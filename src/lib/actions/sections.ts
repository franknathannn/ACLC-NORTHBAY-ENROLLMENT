"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { syncSectionCapacities } from "./settings"

/**
 * ADD SECTION (Sequential Logic)
 * Automatically determines the next letter (e.g., E -> F)
 */
export async function addSection(strand: "ICT" | "GAS") {
  const supabase = await createClient()

  // 1. Find the last section for this strand to get the next letter
  const { data: existing } = await supabase
    .from('sections')
    .select('section_name')
    .eq('strand', strand)
    .order('section_name', { ascending: false })
    .limit(1)

  let nextLetter = "A"
  if (existing && existing.length > 0) {
    // Extracts the last character (e.g., 'E' from 'ICT11-E') and increments it
    const lastLetter = existing[0].section_name.split('-').pop()
    nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1)
  }

  const newName = `${strand}11-${nextLetter}`

  // 2. Create the section (Capacity starts at 0, sync will fix it)
  const { error } = await supabase
    .from('sections')
    .insert([{
      section_name: newName,
      strand: strand,
      capacity: 0 
    }])

  if (error) throw new Error(error.message)

  // 3. Mathematical redistribution of slots
  await syncSectionCapacities()
  
  revalidatePath("/admin/sections")
  return { success: true, name: newName }
}

/**
 * DELETE & COLLAPSE (Sequential Shift Logic)
 * If B is deleted, C becomes B, D becomes C, and students follow the move.
 */
export async function deleteAndCollapseSection(sectionId: string, strand: "ICT" | "GAS") {
  const supabase = await createClient()

  // 1. Get all sections for this strand ordered A-Z
  const { data: allSections } = await supabase
    .from('sections')
    .select('id, section_name')
    .eq('strand', strand)
    .order('section_name', { ascending: true })

  if (!allSections || allSections.length === 0) return

  const targetIndex = allSections.findIndex(s => s.id === sectionId)
  if (targetIndex === -1) return

  // 2. Handle the "Shift": Move students from subsequent sections up
  // Example: If deleting B, move students from C -> B, D -> C...
  for (let i = targetIndex; i < allSections.length - 1; i++) {
    const currentSectionId = allSections[i].id
    const nextSectionId = allSections[i + 1].id

    // Move students from the NEXT section into the CURRENT section ID
    const { error: moveError } = await supabase
      .from('students')
      .update({ 
        section_id: currentSectionId,
        section: allSections[i].section_name
      })
      .eq('section_id', nextSectionId)

    if (moveError) console.error(`Error shifting students to ${allSections[i].section_name}:`, moveError.message)
  }

  // 3. Delete the LAST section in the list (since it's now empty after the shift)
  const lastSection = allSections[allSections.length - 1]
  const { error: deleteError } = await supabase
    .from('sections')
    .delete()
    .eq('id', lastSection.id)

  if (deleteError) throw new Error(deleteError.message)

  // 4. Final Sync: Recalculate capacities for the new total count
  await syncSectionCapacities()
  
  revalidatePath("/admin/sections")
  revalidatePath("/admin/dashboard")
  return { success: true }
}

/**
 * DELETE SECTION (Old Version - Kept for compatibility if needed elsewhere)
 */
export async function deleteSection(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('sections').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await syncSectionCapacities()
  revalidatePath("/admin/sections")
  return { success: true }
}