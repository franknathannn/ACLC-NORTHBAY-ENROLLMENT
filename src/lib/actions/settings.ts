"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * GET DETAILED SYSTEM STATUS
 * This is the "Bouncer" for your enrollment portal.
 * Checks Manual Switch + Opening Date + Closing Date + Capacity.
 */
export async function getEnrollmentStatus() {
  try {
    const supabase = await createClient()
    
    const { data: config, error } = await supabase
      .from('system_config')
      .select('*')
      .single()
    
    if (error || !config) {
      return { isOpen: false, reason: "System Configuration Missing", capacity: 1000, schoolYear: "2025-2026" };
    }

    const { count: approvedCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Approved');

    const now = new Date();
    const start = config.enrollment_start ? new Date(config.enrollment_start) : null;
    const end = config.enrollment_end ? new Date(config.enrollment_end) : null;

    const isManualOpen = config.is_portal_active;
    const isPastStart = !start || now >= start;
    const isBeforeEnd = !end || now <= end;
    const isFull = (approvedCount || 0) >= config.capacity;

    const isOpen = isManualOpen && isPastStart && isBeforeEnd && !isFull;

    let reason = "Active";
    if (!isManualOpen) reason = "Manual Shutdown";
    else if (!isPastStart) reason = "Enrollment Not Yet Started";
    else if (!isBeforeEnd) reason = "Enrollment Period Over";
    else if (isFull) reason = "Capacity Reached";

    return { 
      isOpen,
      reason,
      closingTime: config.enrollment_end,
      openingTime: config.enrollment_start,
      capacity: config.capacity,
      schoolYear: config.school_year,
      currentCount: approvedCount || 0,
      isFull
    };
  } catch (err) {
    console.error("🔥 Critical Settings Error:", err);
    return { isOpen: false, reason: "Connection Error", capacity: 1000 };
  }
}

/**
 * 🎯 STRICT SEQUENTIAL GENDER-BALANCED REDISTRIBUTION
 * 
 * RULES:
 * 1. Fill ICT11-A completely BEFORE moving to ICT11-B
 * 2. Maintain gender balance within each section:
 *    - ODD capacity: Max 1-person imbalance (3M/2F ✅, 4M/1F ❌)
 *    - EVEN capacity: Perfect balance (3M/3F ✅, 4M/2F ❌)
 * 3. If a section can't be filled further without violating balance,
 *    mark it as "complete" and move to next section
 */
export async function syncSectionCapacities() {
  const supabase = await createClient()

  const { data: config } = await supabase
    .from('system_config')
    .select('capacity')
    .single()

  const globalLimit = config?.capacity || 1000

  const { data: sections } = await supabase
    .from('sections')
    .select('id, section_name, strand')
    .order('section_name', { ascending: true })
    
  if (!sections || sections.length === 0) {
    return { success: false, error: "No sections found to synchronize." }
  }

  const totalSections = sections.length
  const baseCapacity = Math.floor(globalLimit / totalSections)
  const remainder = globalLimit % totalSections

  const sectionCapacities = sections.map((sec, index) => ({
    ...sec,
    newCapacity: index < remainder ? baseCapacity + 1 : baseCapacity
  }))

  const updatePromises = sectionCapacities.map(sec => 
    supabase.from('sections').update({ capacity: sec.newCapacity }).eq('id', sec.id)
  )

  try {
    await Promise.all(updatePromises)
    
    const strands = ['ICT', 'GAS']
    const allUpdates: any[] = []
    
    for (const strand of strands) {
      const strandSections = sectionCapacities.filter(s => s.strand === strand)
      if (strandSections.length === 0) continue

      // Get all students for this strand, sorted alphabetically
      const { data: students } = await supabase
        .from('students')
        .select('id, section_id, first_name, last_name, gender')
        .eq('strand', strand)
        .in('status', ['Accepted', 'Approved'])
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      if (!students || students.length === 0) continue

      // FIX: Unassign all students in this strand first to handle shrinking
      await supabase.from('students')
        .update({ section_id: null, section: 'Unassigned' })
        .eq('strand', strand)
        .in('status', ['Accepted', 'Approved'])

      // Separate by gender
      const males = students.filter(s => s.gender === 'Male')
      const females = students.filter(s => s.gender === 'Female')

      let maleIndex = 0
      let femaleIndex = 0
      
      // 🎯 STRICT SEQUENTIAL FILLING
      for (let i = 0; i < strandSections.length; i++) {
        const section = strandSections[i]
        const capacity = section.newCapacity
        
        const studentsForSection: typeof students = []

        // Calculate targets to avoid deadlock
        const halfCap = Math.floor(capacity / 2)
        const isOdd = capacity % 2 !== 0
        
        let maxM = halfCap
        let maxF = halfCap
        
        if (isOdd) {
            const malesLeft = males.length - maleIndex
            const femalesLeft = females.length - femaleIndex
            if (malesLeft >= femalesLeft) maxM++
            else maxF++
        }
        
        // Stop if no students left at all
        if (maleIndex >= males.length && femaleIndex >= females.length) break
        
        // 🔥 FILL THIS SECTION TO CAPACITY
        while (studentsForSection.length < capacity) {
          const currentMales = studentsForSection.filter(s => s.gender === 'Male').length
          const currentFemales = studentsForSection.filter(s => s.gender === 'Female').length
          
          const malesAvailable = maleIndex < males.length
          const femalesAvailable = femaleIndex < females.length
          
          if (!malesAvailable && !femalesAvailable) break
          
          const canAddMale = malesAvailable && currentMales < maxM
          const canAddFemale = femalesAvailable && currentFemales < maxF
          
          if (canAddMale && canAddFemale) {
            if (currentMales <= currentFemales) {
              studentsForSection.push(males[maleIndex++])
            } else {
              studentsForSection.push(females[femaleIndex++])
            }
          } else if (canAddMale) {
            studentsForSection.push(males[maleIndex++])
          } else if (canAddFemale) {
            studentsForSection.push(females[femaleIndex++])
          } else {
            break
          }
        }

        // Collect updates for batch processing
        for (const student of studentsForSection) {
          allUpdates.push({
            id: student.id,
            section_id: section.id,
            section: section.section_name
          })
        }
        
        // Log for debugging
        const mCount = studentsForSection.filter(s => s.gender === 'Male').length
        const fCount = studentsForSection.filter(s => s.gender === 'Female').length
        console.log(`✅ ${section.section_name}: ${mCount}M/${fCount}F (${studentsForSection.length}/${capacity})`)
      }
    }

    // 🚀 BATCH UPDATE: Process in chunks to prevent timeouts and partial update errors
    if (allUpdates.length > 0) {
      const chunkSize = 50
      for (let i = 0; i < allUpdates.length; i += chunkSize) {
        const chunk = allUpdates.slice(i, i + chunkSize)
        await Promise.all(chunk.map(u => 
          supabase
            .from('students')
            .update({ section_id: u.section_id, section: u.section })
            .eq('id', u.id)
        ))
      }
    }

    revalidatePath("/admin/sections")
    revalidatePath("/admin/dashboard")
    revalidatePath("/admin/configuration")
    
    return { success: true }
  } catch (error) {
    console.error("Sync Error:", error)
    return { success: false, error: "Failed to update sections." }
  }
}

/**
 * FORCE SYNC
 */
export async function forceSyncCapacities() {
  try {
    await syncSectionCapacities()
    return { success: true }
  } catch (error) {
    console.error("Manual Sync Failed:", error)
    return { success: false }
  }
}

/**
 * UPDATE ENROLLMENT CAPACITY
 */
export async function updateCapacity(newCapacity: number) {
  if (newCapacity < 50) {
    throw new Error("Enrollment capacity cannot be lower than 50 students.");
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('system_config')
    .update({ 
      capacity: Math.abs(newCapacity),
      updated_at: new Date().toISOString() 
    })
    .not('id', 'is', null)

  if (error) throw new Error(error.message);

  await syncSectionCapacities()
  
  revalidatePath("/enroll")
  revalidatePath("/admin/configuration")
  revalidatePath("/admin/dashboard")
  
  return { success: true }
}

/**
 * TOGGLE STATUS (Manual Switch)
 */
export async function toggleEnrollment(status: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('system_config')
    .update({ is_portal_active: status, updated_at: new Date().toISOString() })
    .not('id', 'is', null)

  if (error) throw new Error(error.message)
  
  revalidatePath("/enroll") 
  revalidatePath("/") 
  return { success: true }
}