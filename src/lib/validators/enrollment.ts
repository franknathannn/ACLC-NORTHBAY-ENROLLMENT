import * as z from "zod"

export const enrollmentSchema = z.object({
  // Step 1: Identity
  first_name: z.string().min(2, "Required"),
  last_name: z.string().min(2, "Required"),
  middle_name: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  contact_no: z.string().regex(/^09\d{9}$/, "Must start with 09 and be 11 digits"),
  phone: z.string().regex(/^09\d{9}$/, "Must start with 09 and be 11 digits").optional(),
  email: z.string().email("Invalid email"),

  // Step 2: Academic
  lrn: z.string().length(12, "LRN must be 12 digits").regex(/^\d+$/, "Numbers only"),
  strand: z.enum(["GAS", "ICT"]),
  gwa_grade_10: z.coerce.number().min(70, "Minimum 70.00").max(99.99, "Must be less than 100.00"),

  // Step 3: Family
  guardian_name: z.string().min(2, "Required"),
  guardian_contact: z.string().regex(/^09\d{9}$/, "Must start with 09 and be 11 digits"),
  guardian_phone: z.string().regex(/^09\d{9}$/, "Must start with 09 and be 11 digits").optional(),

  // Step 4: Documents (URLs from Supabase Storage)
  profile_picture: z.string().optional(),
  form_138_url: z.string().min(1, "Document required"),
  good_moral_url: z.string().min(1, "Document required"),
})

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>