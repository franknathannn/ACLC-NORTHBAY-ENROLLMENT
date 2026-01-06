"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Records or updates a yearly enrollment snapshot.
 * Ensures only ONE record exists per school year using the unique constraint.
 */
export async function recordYearlySnapshot(year: string, maleCount: number, femaleCount: number) {
  const supabase = await createClient()

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
        { onConflict: 'school_year' } // This targets the unique constraint we re-applied
      )

    if (error) {
      console.error("❌ Snapshot Upsert Error:", error.message)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error("🔥 Snapshot Action Crash:", error.message)
    return { success: false, error: "Database connection failed." }
  }
}

/**
 * Retrieves all saved snapshots for the comparison modal.
 */
export async function getEnrollmentHistory() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('enrollment_history')
      .select('*')
      .order('school_year', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error("❌ Fetch History Error:", error.message)
    return []
  }
}

/**
 * Deletes a specific snapshot record from the archives.
 */
export async function deleteSnapshot(id: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('enrollment_history')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error("❌ Delete Snapshot Error:", error.message)
    return { success: false, error: error.message }
  }
}