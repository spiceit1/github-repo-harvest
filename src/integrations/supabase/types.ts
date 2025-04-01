export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          active: number | null
          created_at: string
          disabled: number | null
          id: number
          name: string
          total_items: number | null
        }
        Insert: {
          active?: number | null
          created_at?: string
          disabled?: number | null
          id?: number
          name: string
          total_items?: number | null
        }
        Update: {
          active?: number | null
          created_at?: string
          disabled?: number | null
          id?: number
          name?: string
          total_items?: number | null
        }
        Relationships: []
      }
      ebay_credentials: {
        Row: {
          client_id: string
          client_secret: string
          created_at: string | null
          environment: string
          id: string
          is_active: boolean | null
          last_verified_at: string | null
          ru_name: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_secret: string
          created_at?: string | null
          environment: string
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          ru_name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_secret?: string
          created_at?: string | null
          environment?: string
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          ru_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          status: string
          subject: string
          template: string
          template_data: Json
          to_address: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          status?: string
          subject: string
          template: string
          template_data?: Json
          to_address: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          status?: string
          subject?: string
          template?: string
          template_data?: Json
          to_address?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fish_data: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          category: string | null
          cost: string | null
          created_at: string | null
          description: string | null
          disabled: boolean | null
          ebay_listing_id: string | null
          ebay_listing_status: string | null
          id: string
          is_category: boolean | null
          name: string
          order_index: number | null
          original_cost: number | null
          qtyoh: number | null
          sale_cost: number | null
          search_name: string
          size: string | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          category?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          disabled?: boolean | null
          ebay_listing_id?: string | null
          ebay_listing_status?: string | null
          id?: string
          is_category?: boolean | null
          name: string
          order_index?: number | null
          original_cost?: number | null
          qtyoh?: number | null
          sale_cost?: number | null
          search_name: string
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          category?: string | null
          cost?: string | null
          created_at?: string | null
          description?: string | null
          disabled?: boolean | null
          ebay_listing_id?: string | null
          ebay_listing_status?: string | null
          id?: string
          is_category?: boolean | null
          name?: string
          order_index?: number | null
          original_cost?: number | null
          qtyoh?: number | null
          sale_cost?: number | null
          search_name?: string
          size?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fish_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          search_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          search_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          search_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fish_info: {
        Row: {
          common_size: number | null
          compatibility: string | null
          created_at: string | null
          description: string | null
          diet: string | null
          difficulty: string | null
          distribution: string | null
          family: string | null
          habitat: string | null
          id: string
          max_ph: number | null
          max_size: number | null
          max_temp: number | null
          min_ph: number | null
          min_temp: number | null
          reef_safe: string | null
          scientific_name: string | null
          search_name: string
          updated_at: string | null
        }
        Insert: {
          common_size?: number | null
          compatibility?: string | null
          created_at?: string | null
          description?: string | null
          diet?: string | null
          difficulty?: string | null
          distribution?: string | null
          family?: string | null
          habitat?: string | null
          id?: string
          max_ph?: number | null
          max_size?: number | null
          max_temp?: number | null
          min_ph?: number | null
          min_temp?: number | null
          reef_safe?: string | null
          scientific_name?: string | null
          search_name: string
          updated_at?: string | null
        }
        Update: {
          common_size?: number | null
          compatibility?: string | null
          created_at?: string | null
          description?: string | null
          diet?: string | null
          difficulty?: string | null
          distribution?: string | null
          family?: string | null
          habitat?: string | null
          id?: string
          max_ph?: number | null
          max_size?: number | null
          max_temp?: number | null
          min_ph?: number | null
          min_temp?: number | null
          reef_safe?: string | null
          scientific_name?: string | null
          search_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      manual_prices: {
        Row: {
          created_at: string | null
          fish_id: string
          id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fish_id: string
          id?: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fish_id?: string
          id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_prices_fish_id_fkey"
            columns: ["fish_id"]
            isOneToOne: true
            referencedRelation: "fish_data"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          fish_id: string | null
          id: string
          name_at_time: string
          order_id: string
          price_at_time: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          fish_id?: string | null
          id?: string
          name_at_time?: string
          order_id: string
          price_at_time: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          fish_id?: string | null
          id?: string
          name_at_time?: string
          order_id?: string
          price_at_time?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_fish_id_fkey"
            columns: ["fish_id"]
            isOneToOne: false
            referencedRelation: "fish_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json
          created_at: string | null
          guest_email: string | null
          id: string
          order_number: string | null
          shipping_address: Json
          shipping_carrier: string | null
          shipping_option_id: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_payment_status: string | null
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address: Json
          created_at?: string | null
          guest_email?: string | null
          id?: string
          order_number?: string | null
          shipping_address: Json
          shipping_carrier?: string | null
          shipping_option_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_payment_status?: string | null
          total_amount: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          billing_address?: Json
          created_at?: string | null
          guest_email?: string | null
          id?: string
          order_number?: string | null
          shipping_address?: Json
          shipping_carrier?: string | null
          shipping_option_id?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_payment_status?: string | null
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_option_id_fkey"
            columns: ["shipping_option_id"]
            isOneToOne: false
            referencedRelation: "shipping_options"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          billing_address_id: string | null
          card_brand: string
          created_at: string | null
          expiry_month: number
          expiry_year: number
          id: string
          is_default: boolean | null
          last_four: string
          stripe_payment_method_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address_id?: string | null
          card_brand: string
          created_at?: string | null
          expiry_month: number
          expiry_year: number
          id?: string
          is_default?: boolean | null
          last_four: string
          stripe_payment_method_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address_id?: string | null
          card_brand?: string
          created_at?: string | null
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_default?: boolean | null
          last_four?: string
          stripe_payment_method_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      price_markups: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          markup_percentage: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          markup_percentage: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          markup_percentage?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          is_default: boolean | null
          last_name: string
          phone: string | null
          postal_code: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_default?: boolean | null
          last_name: string
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_default?: boolean | null
          last_name?: string
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shipping_options: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_days: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email_preferences: Json | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_preferences?: Json | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_preferences?: Json | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      policy_exists: {
        Args: {
          policy_name: string
          table_name: string
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
