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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          course_code: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_code: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string
          status: string
          student_usn: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by: string
          status?: string
          student_usn: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string
          status?: string
          student_usn?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      counseling_requests: {
        Row: {
          counselor_notes: string | null
          created_at: string
          handled_by: string | null
          id: string
          message: string | null
          status: string
          student_email: string | null
          student_name: string | null
          student_user_id: string
          student_usn: string | null
          updated_at: string
        }
        Insert: {
          counselor_notes?: string | null
          created_at?: string
          handled_by?: string | null
          id?: string
          message?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_user_id: string
          student_usn?: string | null
          updated_at?: string
        }
        Update: {
          counselor_notes?: string | null
          created_at?: string
          handled_by?: string | null
          id?: string
          message?: string | null
          status?: string
          student_email?: string | null
          student_name?: string | null
          student_user_id?: string
          student_usn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      parent_children: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          parent_user_id: string
          relationship: string
          student_usn: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          parent_user_id: string
          relationship: string
          student_usn: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          parent_user_id?: string
          relationship?: string
          student_usn?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          usn: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          usn?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          usn?: string | null
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_answer: string | null
          student_usn: string
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_answer?: string | null
          student_usn: string
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_answer?: string | null
          student_usn?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      student_marks: {
        Row: {
          created_at: string
          external_marks: number
          grade: string | null
          id: string
          internal_marks: number
          student_usn: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_marks?: number
          grade?: string | null
          id?: string
          internal_marks?: number
          student_usn: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_marks?: number
          grade?: string | null
          id?: string
          internal_marks?: number
          student_usn?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_tests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          score: number | null
          started_at: string | null
          status: string
          student_usn: string
          test_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_usn: string
          test_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          score?: number | null
          started_at?: string | null
          status?: string
          student_usn?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          max_external: number
          max_internal: number
          name: string
          semester: number
        }
        Insert: {
          created_at?: string
          id?: string
          max_external?: number
          max_internal?: number
          name: string
          semester?: number
        }
        Update: {
          created_at?: string
          id?: string
          max_external?: number
          max_internal?: number
          name?: string
          semester?: number
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          marks: number
          options: Json | null
          question_order: number
          question_text: string
          question_type: string
          test_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          question_order?: number
          question_text: string
          question_type?: string
          test_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json | null
          question_order?: number
          question_text?: string
          question_type?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          duration_minutes: number
          id: string
          max_score: number
          status: string
          subject_id: string | null
          title: string
          total_questions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          max_score?: number
          status?: string
          subject_id?: string | null
          title: string
          total_questions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          max_score?: number
          status?: string
          subject_id?: string | null
          title?: string
          total_questions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approved: boolean | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_overall_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          avg_score: number
          full_name: string
          student_usn: string
          tests_completed: number
          total_score: number
        }[]
      }
      get_test_leaderboard: {
        Args: { p_limit?: number; p_test_id: string }
        Returns: {
          completed_at: string
          full_name: string
          score: number
          student_usn: string
        }[]
      }
      get_test_questions_for_student: {
        Args: { p_test_id: string }
        Returns: {
          id: string
          marks: number
          options: Json
          question_order: number
          question_text: string
          question_type: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      parent_can_view_student: {
        Args: { _parent_user_id: string; _student_usn: string }
        Returns: boolean
      }
      submit_test: {
        Args: { p_answers: Json; p_test_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "student" | "lecturer" | "parent" | "counselor"
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
      app_role: ["student", "lecturer", "parent", "counselor"],
    },
  },
} as const
