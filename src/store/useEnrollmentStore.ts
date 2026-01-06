import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EnrollmentData {
  // CRITICAL: ID field for the Secure Edit Protocol (Null for new students, UUID for re-submissions)
  id?: string;

  // Step 1: Identity
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  lrn?: string;
  gender?: string;
  age?: string;
  birth_date?: string;
  email?: string;
  phone?: string; // Personal student phone
  address?: string;
  religion?: string;
  civil_status?: string;

  // Step 2: Academic
  student_category?: "JHS Graduate" | "ALS Passer"; // Matches Select values
  strand?: string;
  last_school_attended?: string;
  gwa_grade_10?: string;
  school_year?: string; // Fetched from system_config in Step 2

  // Step 3: Family (Segmented per database schema)
  guardian_first_name?: string;
  guardian_middle_name?: string;
  guardian_last_name?: string;
  guardian_phone?: string;
  guardian_relationship?: string;

  // Step 4: Documents (The URLs from Supabase Storage)
  profile_2x2_url?: string; // MANDATORY for identification
  diploma_url?: string;
  af5_url?: string;
  form_138_url?: string;    // JHS
  cor_url?: string;         // ALS
  good_moral_url?: string;  // JHS
}

interface EnrollmentState {
  currentStep: number;
  formData: EnrollmentData;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<EnrollmentData>) => void;
  resetForm: () => void;
}

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formData: {
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone: "",
        lrn: "",
        strand: "",
        student_category: "JHS Graduate",
        profile_2x2_url: "",
        diploma_url: "",
        af5_url: "",
        form_138_url: "",
        cor_url: "",
        good_moral_url: "",
        address: "",
        religion: "",
        age: "",
        civil_status: "Single",
      },
      setStep: (step) => set({ currentStep: step }),
      updateFormData: (newData) => 
        set((state) => ({ 
          formData: { ...state.formData, ...newData } 
        })),
      resetForm: () => set({ 
        currentStep: 1, 
        formData: {
          student_category: "JHS Graduate", // Default reset values
          civil_status: "Single",
          first_name: "",
          last_name: "",
          middle_name: "",
          lrn: "",
        } 
      }),
    }),
    { name: 'aclc-enrollment-storage' }
  )
)