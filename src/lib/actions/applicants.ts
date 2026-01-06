"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * 🔥 NUCLEAR OPTION: REDISTRIBUTE STUDENTS
 */
export async function redistributeStudents(strand: 'ICT' | 'GAS') {
  const supabase = await createClient()

  try {
    console.log(`🚀 Starting redistribution for ${strand}`)

    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('id, section_name, capacity')
      .eq('strand', strand)
      .order('section_name', { ascending: true })

    if (sectionsError) throw sectionsError
    if (!sections || sections.length === 0) {
      throw new Error(`No sections found for ${strand}`)
    }

    console.log(`📦 Found ${sections.length} sections:`, sections.map(s => `${s.section_name}(${s.capacity})`).join(', '))

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, gender, first_name, last_name')
      .eq('strand', strand)
      .in('status', ['Accepted', 'Approved'])
      .order('created_at', { ascending: true })

    if (studentsError) throw studentsError
    if (!students || students.length === 0) {
      console.log('✅ No students to redistribute')
      return { success: true, message: 'No students to redistribute' }
    }

    const maleCount = students.filter(s => s.gender === 'Male').length
    const femaleCount = students.filter(s => s.gender === 'Female').length
    console.log(`👥 Found ${students.length} students: ${maleCount}M, ${femaleCount}F`)

    console.log('🗑️ Unassigning all students...')
    const { error: unassignError } = await supabase
      .from('students')
      .update({ section_id: null, section: 'Unassigned' })
      .eq('strand', strand)
      .in('status', ['Accepted', 'Approved'])

    if (unassignError) throw unassignError
    console.log('✅ All students unassigned')

    const plan: Array<{ student: typeof students[0], section: typeof sections[0] }> = []
    
    const males = students.filter(s => s.gender === 'Male')
    const females = students.filter(s => s.gender === 'Female')
    
    console.log(`📋 Males: ${males.length}, Females: ${females.length}`)

    const sectionTracker = sections.map(s => ({
      section: s,
      males: 0,
      females: 0,
      total: 0
    }))

    let maleIdx = 0
    let femaleIdx = 0
    let sectionIdx = 0

    while (maleIdx < males.length || femaleIdx < females.length) {
      let foundSection = false
      
      for (let i = 0; i < sectionTracker.length; i++) {
        const currentSectionIdx = (sectionIdx + i) % sectionTracker.length
        const tracker = sectionTracker[currentSectionIdx]
        
        if (tracker.total >= tracker.section.capacity) continue
        
        const capacity = Number(tracker.section.capacity)
        const halfCap = Math.floor(capacity / 2)
        const isEven = capacity % 2 === 0
        
        let maxM = halfCap
        let maxF = halfCap
        
        if (!isEven) {
          if (tracker.males === 0 && tracker.females === 0) {
            if (maleIdx < males.length) {
              maxM = halfCap + 1
              maxF = halfCap
            } else {
              maxM = halfCap
              maxF = halfCap + 1
            }
          } else if (tracker.males > tracker.females) {
            maxM = halfCap + 1
            maxF = halfCap
          } else if (tracker.females > tracker.males) {
            maxM = halfCap
            maxF = halfCap + 1
          } else {
            if (maleIdx < males.length) {
              maxM = halfCap + 1
              maxF = halfCap
            } else {
              maxM = halfCap
              maxF = halfCap + 1
            }
          }
        }
        
        let added = false
        
        if (maleIdx < males.length && tracker.males < maxM) {
          plan.push({ student: males[maleIdx], section: tracker.section })
          tracker.males++
          tracker.total++
          maleIdx++
          added = true
          console.log(`  ➕ ${tracker.section.section_name}: Added Male (${tracker.males}M/${tracker.females}F = ${tracker.total}/${capacity})`)
        }
        else if (femaleIdx < females.length && tracker.females < maxF) {
          plan.push({ student: females[femaleIdx], section: tracker.section })
          tracker.females++
          tracker.total++
          femaleIdx++
          added = true
          console.log(`  ➕ ${tracker.section.section_name}: Added Female (${tracker.males}M/${tracker.females}F = ${tracker.total}/${capacity})`)
        }
        
        if (added) {
          sectionIdx = currentSectionIdx
          foundSection = true
          break
        }
      }
      
      if (!foundSection) {
        console.log('⚠️ No more space in any section!')
        break
      }
    }

    console.log(`📊 Assignment plan created: ${plan.length} assignments`)
    console.log(`💾 Writing ${plan.length} assignments to database...`)
    
    const chunkSize = 50
    for (let i = 0; i < plan.length; i += chunkSize) {
      const chunk = plan.slice(i, i + chunkSize)
      await Promise.all(chunk.map(({ student, section }) => 
        supabase
          .from('students')
          .update({ section_id: section.id, section: section.section_name })
          .eq('id', student.id)
      ))
    }

    console.log('✅ All assignments written')
    console.log('\n📈 FINAL DISTRIBUTION:')
    sectionTracker.forEach(t => {
      if (t.total > 0) {
        console.log(`  ${t.section.section_name}: ${t.males}M/${t.females}F = ${t.total}/${t.section.capacity}`)
      }
    })

    revalidatePath("/admin/applicants")
    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/sections")

    const unassigned = students.length - plan.length
    const summary = sectionTracker
      .filter(t => t.total > 0)
      .map(t => `${t.section.section_name}: ${t.males}M/${t.females}F`)
      .join(' | ')

    return { 
      success: true, 
      message: `Redistributed ${plan.length}/${students.length} students${unassigned > 0 ? ` (${unassigned} unassigned - need more capacity)` : ''} | ${summary}`
    }

  } catch (error: any) {
    console.error("🔥 REDISTRIBUTION FAILED:", error)
    throw error
  }
}

export async function updateSectionCapacity(sectionId: string, newCapacity: number) {
  const supabase = await createClient()

  const { data: section } = await supabase
    .from('sections')
    .select('strand')
    .eq('id', sectionId)
    .single()

  if (!section) throw new Error('Section not found')

  const { error } = await supabase
    .from('sections')
    .update({ capacity: newCapacity })
    .eq('id', sectionId)

  if (error) throw error

  await redistributeStudents(section.strand)
  
  return { success: true }
}

export async function updateAllSectionCapacities(strand: 'ICT' | 'GAS', newCapacity: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sections')
    .update({ capacity: newCapacity })
    .eq('strand', strand)

  if (error) throw error

  await redistributeStudents(strand)
  
  return { success: true }
}

export async function updateStudentSection(id: string, sectionId: string) {
  const supabase = await createClient()

  const { data: section } = await supabase
    .from('sections')
    .select('section_name')
    .eq('id', sectionId)
    .single()
  
  const { error } = await supabase
    .from('students')
    .update({ section_id: sectionId, section: section?.section_name })
    .eq('id', id)

  if (error) throw error

  revalidatePath("/admin/sections")
  return { success: true }
}

export async function deleteApplicant(id: string) {
  const supabase = await createClient()

  await supabase.from('activity_logs').delete().eq('student_id', id)
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath("/admin/applicants")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/sections") 
  
  return { success: true }
}

export async function updateApplicantStatus(id: string, newStatus: string, feedback?: string) {
  const supabase = await createClient()
  let sectionIdToAssign: string | null = null
  let sectionNameToAssign: string = 'Unassigned'
  
  const dbStatus = newStatus === "Accepted" ? "Approved" : newStatus

  if (dbStatus === "Approved") {
    const { data: student } = await supabase
      .from('students')
      .select('strand, gender')
      .eq('id', id)
      .single()

    if (student) {
      const { data: sections } = await supabase
        .from('sections')
        .select('id, section_name, capacity')
        .eq('strand', student.strand)
        .order('section_name', { ascending: true })

      if (sections && sections.length > 0) {
        for (const sec of sections) {
          if (!sec.capacity || sec.capacity <= 0) continue

          const { data: currentStudents } = await supabase
            .from('students')
            .select('gender')
            .eq('section_id', sec.id)
            .eq('status', 'Approved')

          const currentMale = currentStudents?.filter(s => s.gender === 'Male').length || 0
          const currentFemale = currentStudents?.filter(s => s.gender === 'Female').length || 0
          const totalInSection = currentMale + currentFemale

          if (totalInSection >= sec.capacity) continue

          const isEvenCapacity = sec.capacity % 2 === 0
          const halfCapacity = Math.floor(sec.capacity / 2)
          
          let maxMale: number, maxFemale: number
          
          if (isEvenCapacity) {
            maxMale = halfCapacity
            maxFemale = halfCapacity
          } else {
            if (currentMale === 0 && currentFemale === 0) {
              if (student.gender === 'Male') {
                maxMale = halfCapacity + 1
                maxFemale = halfCapacity
              } else {
                maxMale = halfCapacity
                maxFemale = halfCapacity + 1
              }
            } else if (currentMale > currentFemale) {
              maxMale = halfCapacity + 1
              maxFemale = halfCapacity
            } else if (currentFemale > currentMale) {
              maxMale = halfCapacity
              maxFemale = halfCapacity + 1
            } else {
              if (student.gender === 'Male') {
                maxMale = halfCapacity + 1
                maxFemale = halfCapacity
              } else {
                maxMale = halfCapacity
                maxFemale = halfCapacity + 1
              }
            }
          }

          const currentGenderCount = student.gender === 'Male' ? currentMale : currentFemale
          const maxForThisGender = student.gender === 'Male' ? maxMale : maxFemale

          if (currentGenderCount < maxForThisGender) {
            sectionIdToAssign = sec.id
            sectionNameToAssign = sec.section_name
            break
          }
        }
      }
    }
  } else {
    sectionIdToAssign = null
  }

  const { error } = await supabase
    .from('students')
    .update({ 
      status: dbStatus, 
      section_id: sectionIdToAssign,
      section: sectionNameToAssign,
      registrar_feedback: dbStatus === "Approved" ? null : (feedback || null)
    })
    .eq('id', id)

  if (error) throw error

  let assignedSectionName = 'Unassigned'
  if (sectionIdToAssign) {
    const { data: sectionData } = await supabase
      .from('sections')
      .select('section_name')
      .eq('id', sectionIdToAssign)
      .single()
    
    if (sectionData) {
      assignedSectionName = sectionData.section_name
    }
  }

  revalidatePath("/admin/applicants")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/sections") 
  revalidatePath("/admin/status") 
  
  return { 
    success: true,
    assignedSectionId: sectionIdToAssign,
    assignedSection: assignedSectionName
  }
}

/**
 * 🚀 OPTIMIZED BULK UPDATE - Processes students with intelligent section assignment
 */
export async function bulkUpdateApplicantStatus(ids: string[], newStatus: string, feedback?: string) {
  const supabase = await createClient()
  const dbStatus = newStatus === "Accepted" ? "Approved" : newStatus
  
  try {
    // Get all students being updated
    const { data: studentsToUpdate, error: fetchError } = await supabase
      .from('students')
      .select('id, strand, gender')
      .in('id', ids)
    
    if (fetchError) throw fetchError
    if (!studentsToUpdate) return { success: false, results: [] }

    // Group by strand for efficient section lookup
    const strandGroups: Record<string, typeof studentsToUpdate> = {}
    studentsToUpdate.forEach(s => {
      if (!strandGroups[s.strand]) strandGroups[s.strand] = []
      strandGroups[s.strand].push(s)
    })

    const results = []

    for (const [strand, students] of Object.entries(strandGroups)) {
      // Fetch sections for this strand
      const { data: sections } = await supabase
        .from('sections')
        .select('id, section_name, capacity')
        .eq('strand', strand)
        .order('section_name', { ascending: true })

      if (!sections || sections.length === 0) {
        // No sections - update without assignment
        for (const student of students) {
          const { error } = await supabase
            .from('students')
            .update({ 
              status: dbStatus,
              section_id: null,
              section: 'Unassigned',
              registrar_feedback: dbStatus === "Approved" ? null : (feedback || null)
            })
            .eq('id', student.id)
          
          results.push({
            id: student.id,
            success: !error,
            assignedSectionId: null,
            assignedSection: 'Unassigned'
          })
        }
        continue
      }

      // Get current section occupancy
      const sectionData = await Promise.all(
        sections.map(async (sec) => {
          const { data: currentStudents } = await supabase
            .from('students')
            .select('gender')
            .eq('section_id', sec.id)
            .eq('status', 'Approved')

          const currentMale = currentStudents?.filter(s => s.gender === 'Male').length || 0
          const currentFemale = currentStudents?.filter(s => s.gender === 'Female').length || 0

          return {
            ...sec,
            currentMale,
            currentFemale,
            total: currentMale + currentFemale
          }
        })
      )

      // Assign students to sections
      for (const student of students) {
        let sectionIdToAssign: string | null = null
        let sectionNameToAssign = 'Unassigned'

        if (dbStatus === "Approved") {
          // Find best section
          for (const sec of sectionData) {
            if (sec.total >= sec.capacity) continue

            const halfCapacity = Math.floor(sec.capacity / 2)
            const isEven = sec.capacity % 2 === 0

            let maxMale: number, maxFemale: number

            if (isEven) {
              maxMale = halfCapacity
              maxFemale = halfCapacity
            } else {
              if (sec.currentMale === 0 && sec.currentFemale === 0) {
                if (student.gender === 'Male') {
                  maxMale = halfCapacity + 1
                  maxFemale = halfCapacity
                } else {
                  maxMale = halfCapacity
                  maxFemale = halfCapacity + 1
                }
              } else if (sec.currentMale > sec.currentFemale) {
                maxMale = halfCapacity + 1
                maxFemale = halfCapacity
              } else if (sec.currentFemale > sec.currentMale) {
                maxMale = halfCapacity
                maxFemale = halfCapacity + 1
              } else {
                if (student.gender === 'Male') {
                  maxMale = halfCapacity + 1
                  maxFemale = halfCapacity
                } else {
                  maxMale = halfCapacity
                  maxFemale = halfCapacity + 1
                }
              }
            }

            const currentGenderCount = student.gender === 'Male' ? sec.currentMale : sec.currentFemale
            const maxForGender = student.gender === 'Male' ? maxMale : maxFemale

            if (currentGenderCount < maxForGender) {
              sectionIdToAssign = sec.id
              sectionNameToAssign = sec.section_name
              
              // Update local tracking
              if (student.gender === 'Male') {
                sec.currentMale++
              } else {
                sec.currentFemale++
              }
              sec.total++
              
              break
            }
          }
        }

        // Update student
        const { error } = await supabase
          .from('students')
          .update({ 
            status: dbStatus,
            section_id: sectionIdToAssign,
            section: sectionNameToAssign,
            registrar_feedback: dbStatus === "Approved" ? null : (feedback || null)
          })
          .eq('id', student.id)

        results.push({
          id: student.id,
          success: !error,
          assignedSectionId: sectionIdToAssign,
          assignedSection: sectionNameToAssign
        })
      }
    }

    revalidatePath("/admin/applicants")
    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/sections")
    
    return { success: true, results }
  } catch (error) {
    console.error("Bulk update error:", error)
    throw error
  }
}

/**
 * 🚀 OPTIMIZED BULK DELETE
 */
export async function bulkDeleteApplicants(ids: string[]) {
  const supabase = await createClient()
  
  try {
    // Delete logs first
    await supabase.from('activity_logs').delete().in('student_id', ids)
    
    // Delete students
    const { error } = await supabase
      .from('students')
      .delete()
      .in('id', ids)

    if (error) throw error

    revalidatePath("/admin/applicants")
    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/sections")
    
    return { success: true }
  } catch (error) {
    console.error("Bulk delete error:", error)
    throw error
  }
}