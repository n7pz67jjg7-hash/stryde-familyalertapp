export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          doctor_name: string
          hospital_name: string | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          specialty: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_name: string
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_name?: string
          hospital_name?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      caregiver_patient_links: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          id: string
          note: string | null
          patient_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          patient_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          patient_id?: string
          status?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          priority: boolean
          relation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          priority?: boolean
          relation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          priority?: boolean
          relation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_events: {
        Row: {
          id: string
          kind: string
          lat: number | null
          lng: number | null
          patient_id: string
          resolution_code: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          snapshot: Json
          triggered_at: string
        }
        Insert: {
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          patient_id: string
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          snapshot?: Json
          triggered_at?: string
        }
        Update: {
          id?: string
          kind?: string
          lat?: number | null
          lng?: number | null
          patient_id?: string
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          snapshot?: Json
          triggered_at?: string
        }
        Relationships: []
      }
      hospital_favorites: {
        Row: {
          address: string | null
          created_at: string
          id: string
          place_id: string
          place_name: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          place_id: string
          place_name?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          place_id?: string
          place_name?: string
          user_id?: string
        }
        Relationships: []
      }
      hospital_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          place_id: string
          place_name: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          place_id: string
          place_name?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          place_id?: string
          place_name?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_id: string | null
          id: string
          patient_id: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_id?: string | null
          id?: string
          patient_id: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string | null
          id?: string
          patient_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "emergency_events"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_egp: number
          created_at: string
          description: string
          id: string
          issued_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_egp?: number
          created_at?: string
          description: string
          id?: string
          issued_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_egp?: number
          created_at?: string
          description?: string
          id?: string
          issued_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          id: string
          lab_name: string | null
          patient_id: string
          reference_range: string | null
          result: string
          taken_at: string
          test_name: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lab_name?: string | null
          patient_id: string
          reference_range?: string | null
          result: string
          taken_at?: string
          test_name: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lab_name?: string | null
          patient_id?: string
          reference_range?: string | null
          result?: string
          taken_at?: string
          test_name?: string
          unit?: string | null
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          patient_id: string
          status: string
          taken_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          patient_id: string
          status?: string
          taken_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          patient_id?: string
          status?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          reminder_time: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          reminder_time?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          reminder_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          allergies_drug: string[]
          allergies_food: string[]
          blood_type: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          language: string
          medical_conditions: string[]
          medical_notes: string | null
          medications: string[]
          national_id: string | null
          onboarded_at: string | null
          patient_code: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          allergies_drug?: string[]
          allergies_food?: string[]
          blood_type?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id: string
          language?: string
          medical_conditions?: string[]
          medical_notes?: string | null
          medications?: string[]
          national_id?: string | null
          onboarded_at?: string | null
          patient_code?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          age?: number | null
          allergies_drug?: string[]
          allergies_food?: string[]
          blood_type?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          medical_conditions?: string[]
          medical_notes?: string | null
          medications?: string[]
          national_id?: string | null
          onboarded_at?: string | null
          patient_code?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      safe_zones: {
        Row: {
          active: boolean
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          patient_id: string
          radius_m: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          patient_id: string
          radius_m?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          patient_id?: string
          radius_m?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string | null
          patient_id: string
          recorded_at: string
          unit: string | null
          value: number
          value2: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          patient_id: string
          recorded_at?: string
          unit?: string | null
          value: number
          value2?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          patient_id?: string
          recorded_at?: string
          unit?: string | null
          value?: number
          value2?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_patient_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_caregiver_by_code: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      app_role: "patient" | "caregiver"
      subscription_tier: "free" | "plus" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "caregiver"],
      subscription_tier: ["free", "plus", "premium"],
    },
  },
} as const
