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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          code_examples: Json | null
          created_at: string
          description: string | null
          hitl_checkpoint: boolean | null
          id: string
          logic: Json | null
          name: string
          order_index: number | null
          role: string | null
          team_id: string | null
          tools: Json | null
          updated_at: string
        }
        Insert: {
          code_examples?: Json | null
          created_at?: string
          description?: string | null
          hitl_checkpoint?: boolean | null
          id?: string
          logic?: Json | null
          name: string
          order_index?: number | null
          role?: string | null
          team_id?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Update: {
          code_examples?: Json | null
          created_at?: string
          description?: string | null
          hitl_checkpoint?: boolean | null
          id?: string
          logic?: Json | null
          name?: string
          order_index?: number | null
          role?: string | null
          team_id?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      context_docs: {
        Row: {
          category: string | null
          content: string
          created_at: string
          doc_type: string | null
          file_path: string | null
          id: string
          is_public: boolean | null
          slug: string
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          doc_type?: string | null
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          slug: string
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          doc_type?: string | null
          file_path?: string | null
          id?: string
          is_public?: boolean | null
          slug?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      idea_documents: {
        Row: {
          agent: string
          content: string
          created_at: string
          id: string
          idea_id: string
          phase: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent: string
          content?: string
          created_at?: string
          id?: string
          idea_id: string
          phase: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent?: string
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          phase?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_documents_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "startup_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_messages: {
        Row: {
          agent: string
          content: string
          created_at: string
          id: string
          idea_id: string
          phase: string
          role: string
          user_id: string | null
        }
        Insert: {
          agent?: string
          content: string
          created_at?: string
          id?: string
          idea_id: string
          phase?: string
          role?: string
          user_id?: string | null
        }
        Update: {
          agent?: string
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          phase?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_messages_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "startup_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          slug: string
          tags: string[] | null
          template: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          slug: string
          tags?: string[] | null
          template: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          slug?: string
          tags?: string[] | null
          template?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      share_tokens: {
        Row: {
          access_count: number | null
          created_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          resource_id: string | null
          resource_type: string
          token: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          resource_id?: string | null
          resource_type: string
          token?: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          resource_id?: string | null
          resource_type?: string
          token?: string
        }
        Relationships: []
      }
      startup_ideas: {
        Row: {
          created_at: string
          current_phase: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_phase?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_phase?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          example_usage: string | null
          id: string
          is_public: boolean | null
          language: string | null
          mcp_config: Json | null
          name: string
          schema: Json | null
          script_content: string | null
          slug: string
          source_url: string | null
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          example_usage?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          mcp_config?: Json | null
          name: string
          schema?: Json | null
          script_content?: string | null
          slug: string
          source_url?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          example_usage?: string | null
          id?: string
          is_public?: boolean | null
          language?: string | null
          mcp_config?: Json | null
          name?: string
          schema?: Json | null
          script_content?: string | null
          slug?: string
          source_url?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
