
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "activity_concepts": {
                  Row: {
                    "catalog_version": string,"cost_level": number,"description_bg": string,"description_en": string,"duration_minutes": number,"energy": number,"environment": string,"id": string,"interests": (string)[],"novelty": number,"pace": number,"social": number,"tags": (string)[],"title_bg": string,"title_en": string,"transport_required": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_version"?: string,"cost_level": number,"description_bg": string,"description_en": string,"duration_minutes": number,"energy": number,"environment": string,"id": string,"interests": (string)[],"novelty": number,"pace": number,"social": number,"tags"?: (string)[],"title_bg": string,"title_en": string,"transport_required"?: string | null
                  }
                  Update: {
                    "catalog_version"?: string,"cost_level"?: number,"description_bg"?: string,"description_en"?: string,"duration_minutes"?: number,"energy"?: number,"environment"?: string,"id"?: string,"interests"?: (string)[],"novelty"?: number,"pace"?: number,"social"?: number,"tags"?: (string)[],"title_bg"?: string,"title_en"?: string,"transport_required"?: string | null
                  }
                  Relationships: [

                  ]
                },"activity_sessions": {
                  Row: {
                    "activity_date": string,"activity_mode": string,"budget_level": number,"context_completed": boolean,"context_revision": number,"couple_id": string,"created_at": string,"created_by": string,"end_time": string,"ends_at": string,"ends_next_day": boolean,"environment": string,"id": string,"max_travel_minutes": number,"selected_concept_id": string | null,"start_time": string,"starting_location": string,"starts_at": string,"status": string,"timezone": string,"timing": string,"transport": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_date": string,"activity_mode"?: string,"budget_level"?: number,"context_completed"?: boolean,"context_revision"?: number,"couple_id": string,"created_at"?: string,"created_by": string,"end_time": string,"ends_at"?: string,"ends_next_day"?: boolean,"environment"?: string,"id"?: string,"max_travel_minutes"?: number,"selected_concept_id"?: string | null,"start_time": string,"starting_location": string,"starts_at"?: string,"status"?: string,"timezone"?: string,"timing": string,"transport"?: string,"updated_at"?: string
                  }
                  Update: {
                    "activity_date"?: string,"activity_mode"?: string,"budget_level"?: number,"context_completed"?: boolean,"context_revision"?: number,"couple_id"?: string,"created_at"?: string,"created_by"?: string,"end_time"?: string,"ends_at"?: string,"ends_next_day"?: boolean,"environment"?: string,"id"?: string,"max_travel_minutes"?: number,"selected_concept_id"?: string | null,"start_time"?: string,"starting_location"?: string,"starts_at"?: string,"status"?: string,"timezone"?: string,"timing"?: string,"transport"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_sessions_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "activity_sessions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_concept_fkey"
      columns: ["selected_concept_id"]
isOneToOne: false
      referencedRelation: "activity_concepts"
      referencedColumns: ["id"]
    }
                  ]
                },"couple_invitations": {
                  Row: {
                    "couple_id": string,"created_at": string,"created_by": string,"expires_at": string,"id": string,"token_hash": string,"used_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "couple_id": string,"created_at"?: string,"created_by": string,"expires_at"?: string,"id"?: string,"token_hash": string,"used_at"?: string | null
                  }
                  Update: {
                    "couple_id"?: string,"created_at"?: string,"created_by"?: string,"expires_at"?: string,"id"?: string,"token_hash"?: string,"used_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "couple_invitations_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "couple_invitations_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"couple_members": {
                  Row: {
                    "couple_id": string,"joined_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "couple_id": string,"joined_at"?: string,"user_id": string
                  }
                  Update: {
                    "couple_id"?: string,"joined_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "couple_members_couple_id_fkey"
      columns: ["couple_id"]
isOneToOne: false
      referencedRelation: "couples"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "couple_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"couples": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "couples_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"match_feedback": {
                  Row: {
                    "concept_id": string,"context_revision": number,"created_at": string,"id": string,"reason": string,"session_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "concept_id": string,"context_revision": number,"created_at"?: string,"id"?: string,"reason": string,"session_id": string,"user_id": string
                  }
                  Update: {
                    "concept_id"?: string,"context_revision"?: number,"created_at"?: string,"id"?: string,"reason"?: string,"session_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_feedback_concept_id_fkey"
      columns: ["concept_id"]
isOneToOne: false
      referencedRelation: "activity_concepts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_feedback_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "activity_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "match_feedback_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"match_results": {
                  Row: {
                    "catalog_version": string,"context_revision": number,"created_at": string,"engine_version": string,"id": string,"input_fingerprint": string,"iteration": number,"recommendations": NonNullable<Json>,"session_id": string,"stale": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_version"?: string,"context_revision": number,"created_at"?: string,"engine_version"?: string,"id"?: string,"input_fingerprint": string,"iteration": number,"recommendations": NonNullable<Json>,"session_id": string,"stale"?: boolean
                  }
                  Update: {
                    "catalog_version"?: string,"context_revision"?: number,"created_at"?: string,"engine_version"?: string,"id"?: string,"input_fingerprint"?: string,"iteration"?: number,"recommendations"?: NonNullable<Json>,"session_id"?: string,"stale"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "match_results_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "activity_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"locale": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"locale"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"locale"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"tonight_responses": {
                  Row: {
                    "answers": NonNullable<Json>,"context_revision": number,"current_step": number,"mode": string,"session_id": string,"share_answers": boolean,"submitted_at": string | null,"updated_at": string,"user_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"context_revision": number,"current_step"?: number,"mode"?: string,"session_id": string,"share_answers"?: boolean,"submitted_at"?: string | null,"updated_at"?: string,"user_id": string,"version"?: number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"context_revision"?: number,"current_step"?: number,"mode"?: string,"session_id"?: string,"share_answers"?: boolean,"submitted_at"?: string | null,"updated_at"?: string,"user_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tonight_responses_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "activity_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tonight_responses_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_preferences": {
                  Row: {
                    "answers": NonNullable<Json>,"completed_at": string | null,"interests": (string)[],"onboarding_step": number,"updated_at": string,"user_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"completed_at"?: string | null,"interests"?: (string)[],"onboarding_step"?: number,"updated_at"?: string,"user_id": string,"version"?: number
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"completed_at"?: string | null,"interests"?: (string)[],"onboarding_step"?: number,"updated_at"?: string,"user_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "calculate_couple_match":
{ Args: { "p_session": string }; Returns: Json
                           },
"create_couple":
{ Args: { "couple_name": string }; Returns: string
                           },
"get_partner_name":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"issue_couple_invitation":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"join_couple":
{ Args: { "invitation_token": string }; Returns: string
                           },
"record_match_feedback":
{ Args: { "p_concept": string,"p_reason": string,"p_session": string }; Returns: undefined
                           },
"save_personal_preferences":
{ Args: { "p_answers": Json,"p_complete"?: boolean,"p_expected_version": number,"p_step": number }; Returns: number
                           },
"save_tonight_response":
{ Args: { "p_answers": Json,"p_context_revision": number,"p_expected_version": number,"p_mode": string,"p_session": string,"p_share": boolean,"p_step": number,"p_submit"?: boolean }; Returns: number
                           },
"select_match_concept":
{ Args: { "p_concept": string,"p_result": string,"p_session": string }; Returns: undefined
                           },
"tonight_progress":
{ Args: { "p_session": string }; Returns: Json
                           },
"update_tonight_context":
{ Args: { "p_context": Json,"p_expected_revision": number,"p_session": string }; Returns: number
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {

          }
        }
} as const
