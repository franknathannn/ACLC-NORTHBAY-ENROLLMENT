"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkApplicationStatus(lrn: string) {
  const supabase = await createClient()
  const cleanLrn = lrn.trim()

  try {
    // We use the plural 'sections' because that is your table name
    // If this still returns gray, check if your foreign key in the 
    // 'students' table is actually named 'section_id'
    const { data, error } = await supabase
      .from('students')
      .select(`
        first_name, 
        last_name, 
        status, 
        strand, 
        school_year, 
        decline_reason,
        sections!section_id ( section_name )
      `) 
      .eq('lrn', cleanLrn)
      .maybeSingle()

    if (error) {
      console.error("Supabase Error:", error.message)
      return null
    }
    
    return data
  } catch (err) {
    console.error("Action Error:", err)
    return null
  }
}