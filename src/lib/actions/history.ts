"use server"

import { supabase } from "@/lib/supabase/client"
import { revalidatePath } from "next/cache"

/**
 * Records or updates a yearly enrollment snapshot.
 * Uses .upsert() to overwrite existing records for the same year, 
 * which resolves the "unique constraint" error.
 */
export async function recordYearlySnapshot(year: string, maleCount: number, femaleCount: number) {
  try {
    const { data, error } = await supabase
      .from('enrollment_history')
      .upsert(
        { 
          school_year: year, 
          male_total: maleCount, 
          female_total: femaleCount,
          total_combined: maleCount + femaleCount,
          recorded_at: new Date().toISOString()
        },
        // CRITICAL: This tells Supabase to look for a conflict in 'school_year'
        // and perform an UPDATE instead of a fresh INSERT.
        { onConflict: 'school_year' } 
      )

    if (error) {
      console.error("❌ Snapshot Database Error:", error.message)
      return { success: false, error: error.message }
    }

    // Refresh the dashboard cache to show the new data immediately
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error("🔥 Snapshot Action Crash:", error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Retrieves all saved enrollment snapshots.
 * Ordered by school year descending.
 */
export async function getEnrollmentHistory() {
  try {
    const { data, error } = await supabase
      .from('enrollment_history')
      .select('*')
      .order('school_year', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("Fetch History Error:", error.message)
    return []
  }
}

/**
 * Deletes a specific yearly snapshot from the archives.
 */
export async function deleteSnapshot(id: string) {
  try {
    const { error } = await supabase
      .from('enrollment_history')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error("Delete Snapshot Error:", error.message)
    return { success: false, error: error.message }
  }
}