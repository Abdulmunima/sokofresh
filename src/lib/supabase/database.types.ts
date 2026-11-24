export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          name_sw: string | null;
          sort: number;
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          name: string;
          name_sw?: string | null;
          sort?: number;
          supplier_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_sw?: string | null;
          sort?: number;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      customer_metrics: {
        Row: {
          avg_order_value_kes: number | null;
          computed_at: string;
          customer_id: string;
          flags: string[];
          last_order_at: string | null;
          order_count: number;
          supplier_id: string;
          usual_gap_days: number | null;
        };
        ComputedFields: never;
        Insert: {
          avg_order_value_kes?: number | null;
          computed_at?: string;
          customer_id: string;
          flags?: string[];
          last_order_at?: string | null;
          order_count?: number;
          supplier_id: string;
          usual_gap_days?: number | null;
        };
        Update: {
          avg_order_value_kes?: number | null;
          computed_at?: string;
          customer_id?: string;
          flags?: string[];
          last_order_at?: string | null;
          order_count?: number;
          supplier_id?: string;
          usual_gap_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_metrics_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_balances";
            referencedColumns: ["supplier_id", "customer_id"];
          },
          {
            foreignKeyName: "customer_metrics_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "customer_metrics_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          anonymised_at: string | null;
          consent_at: string | null;
          created_at: string;
          credit_days: number | null;
          credit_limit_kes: number | null;
          id: string;
          location: string | null;
          name: string;
          notes: string | null;
          payment_terms: Database["public"]["Enums"]["payment_terms"];
          phone: string | null;
          supplier_id: string;
          whatsapp_opt_in: boolean;
          zone_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          anonymised_at?: string | null;
          consent_at?: string | null;
          created_at?: string;
          credit_days?: number | null;
          credit_limit_kes?: number | null;
          id?: string;
          location?: string | null;
          name: string;
          notes?: string | null;
          payment_terms?: Database["public"]["Enums"]["payment_terms"];
          phone?: string | null;
          supplier_id: string;
          whatsapp_opt_in?: boolean;
          zone_id?: string | null;
        };
        Update: {
          anonymised_at?: string | null;
          consent_at?: string | null;
          created_at?: string;
          credit_days?: number | null;
          credit_limit_kes?: number | null;
          id?: string;
          location?: string | null;
          name?: string;
          notes?: string | null;
          payment_terms?: Database["public"]["Enums"]["payment_terms"];
          phone?: string | null;
          supplier_id?: string;
          whatsapp_opt_in?: boolean;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customers_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customers_zone_fkey";
            columns: ["supplier_id", "zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["supplier_id", "id"];
          },
        ];
      };
      delivery_windows: {
        Row: {
          cutoff_hours_before: number;
          end_time: string;
          id: string;
          start_time: string;
          supplier_id: string;
          weekday: number;
          zone_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          cutoff_hours_before?: number;
          end_time: string;
          id?: string;
          start_time: string;
          supplier_id: string;
          weekday: number;
          zone_id?: string | null;
        };
        Update: {
          cutoff_hours_before?: number;
          end_time?: string;
          id?: string;
          start_time?: string;
          supplier_id?: string;
          weekday?: number;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_windows_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_windows_zone_fkey";
            columns: ["supplier_id", "zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["supplier_id", "id"];
          },
        ];
      };
      delivery_zones: {
        Row: {
          fee_kes: number;
          id: string;
          min_order_kes: number;
          name: string;
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          fee_kes?: number;
          id?: string;
          min_order_kes?: number;
          name: string;
          supplier_id: string;
        };
        Update: {
          fee_kes?: number;
          id?: string;
          min_order_kes?: number;
          name?: string;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_zones_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      dev_flags: {
        Row: {
          created_at: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          name?: string;
        };
        Relationships: [];
      };
      login_code_outbox: {
        Row: {
          code: string;
          created_at: string;
          id: number;
          phone: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          id?: never;
          phone: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: never;
          phone?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["member_role"];
          supplier_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          supplier_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["member_role"];
          supplier_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      message_log: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel"];
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          id: string;
          kind: string;
          order_id: string | null;
          status: string;
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          channel: Database["public"]["Enums"]["message_channel"];
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          id?: string;
          kind: string;
          order_id?: string | null;
          status?: string;
          supplier_id: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["message_channel"];
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          id?: string;
          kind?: string;
          order_id?: string | null;
          status?: string;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_log_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_balances";
            referencedColumns: ["supplier_id", "customer_id"];
          },
          {
            foreignKeyName: "message_log_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "message_log_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["supplier_id", "order_id"];
          },
          {
            foreignKeyName: "message_log_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "message_log_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_total_kes: number | null;
          order_id: string;
          product_id: string | null;
          product_name: string;
          qty_delivered: number | null;
          qty_ordered: number;
          supplier_id: string;
          unit: string;
          unit_price_kes: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          line_total_kes?: never;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          qty_delivered?: number | null;
          qty_ordered: number;
          supplier_id: string;
          unit: string;
          unit_price_kes: number;
        };
        Update: {
          id?: string;
          line_total_kes?: never;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          qty_delivered?: number | null;
          qty_ordered?: number;
          supplier_id?: string;
          unit?: string;
          unit_price_kes?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["supplier_id", "order_id"];
          },
          {
            foreignKeyName: "order_items_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "order_items_product_fkey";
            columns: ["supplier_id", "product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "order_items_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          cancel_reason: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          delivery_date: string | null;
          delivery_fee_kes: number;
          delivery_window_id: string | null;
          due_date: string | null;
          id: string;
          notes: string | null;
          order_number: number;
          payment_status: Database["public"]["Enums"]["order_payment_status"];
          source: Database["public"]["Enums"]["order_source"];
          status: Database["public"]["Enums"]["order_status"];
          subtotal_kes: number;
          supplier_id: string;
          total_kes: number;
          updated_at: string;
          zone_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          cancel_reason?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          delivery_date?: string | null;
          delivery_fee_kes?: number;
          delivery_window_id?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          order_number: number;
          payment_status?: Database["public"]["Enums"]["order_payment_status"];
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_kes?: number;
          supplier_id: string;
          total_kes?: number;
          updated_at?: string;
          zone_id?: string | null;
        };
        Update: {
          cancel_reason?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          delivery_date?: string | null;
          delivery_fee_kes?: number;
          delivery_window_id?: string | null;
          due_date?: string | null;
          id?: string;
          notes?: string | null;
          order_number?: number;
          payment_status?: Database["public"]["Enums"]["order_payment_status"];
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_kes?: number;
          supplier_id?: string;
          total_kes?: number;
          updated_at?: string;
          zone_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_balances";
            referencedColumns: ["supplier_id", "customer_id"];
          },
          {
            foreignKeyName: "orders_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "orders_delivery_window_fkey";
            columns: ["supplier_id", "delivery_window_id"];
            isOneToOne: false;
            referencedRelation: "delivery_windows";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_zone_fkey";
            columns: ["supplier_id", "zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["supplier_id", "id"];
          },
        ];
      };
      payment_allocations: {
        Row: {
          amount_kes: number;
          id: string;
          order_id: string;
          payment_id: string;
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_kes: number;
          id?: string;
          order_id: string;
          payment_id: string;
          supplier_id: string;
        };
        Update: {
          amount_kes?: number;
          id?: string;
          order_id?: string;
          payment_id?: string;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_allocations_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "order_balances";
            referencedColumns: ["supplier_id", "order_id"];
          },
          {
            foreignKeyName: "payment_allocations_order_fkey";
            columns: ["supplier_id", "order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "payment_allocations_payment_fkey";
            columns: ["supplier_id", "payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "payment_allocations_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          created_at: string;
          details: NonNullable<Json>;
          id: string;
          label: string | null;
          show_to_customers: boolean;
          sort: number;
          supplier_id: string;
          type: Database["public"]["Enums"]["payment_method_type"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: NonNullable<Json>;
          id?: string;
          label?: string | null;
          show_to_customers?: boolean;
          sort?: number;
          supplier_id: string;
          type: Database["public"]["Enums"]["payment_method_type"];
        };
        Update: {
          created_at?: string;
          details?: NonNullable<Json>;
          id?: string;
          label?: string | null;
          show_to_customers?: boolean;
          sort?: number;
          supplier_id?: string;
          type?: Database["public"]["Enums"]["payment_method_type"];
        };
        Relationships: [
          {
            foreignKeyName: "payment_methods_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_kes: number;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          id: string;
          method: Database["public"]["Enums"]["payment_method_type"];
          mpesa_transaction_id: string | null;
          payer_phone: string | null;
          raw: Json | null;
          received_at: string;
          reference: string | null;
          source: Database["public"]["Enums"]["payment_source"];
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_kes: number;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          id?: string;
          method: Database["public"]["Enums"]["payment_method_type"];
          mpesa_transaction_id?: string | null;
          payer_phone?: string | null;
          raw?: Json | null;
          received_at?: string;
          reference?: string | null;
          source?: Database["public"]["Enums"]["payment_source"];
          supplier_id: string;
        };
        Update: {
          amount_kes?: number;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method_type"];
          mpesa_transaction_id?: string | null;
          payer_phone?: string | null;
          raw?: Json | null;
          received_at?: string;
          reference?: string | null;
          source?: Database["public"]["Enums"]["payment_source"];
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_balances";
            referencedColumns: ["supplier_id", "customer_id"];
          },
          {
            foreignKeyName: "payments_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "payments_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          name_sw: string | null;
          photo_path: string | null;
          price_changed_at: string | null;
          price_kes: number;
          qty: number | null;
          sort: number;
          stock_changed_at: string | null;
          stock_status: Database["public"]["Enums"]["stock_status"];
          supplier_id: string;
          unit: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          name_sw?: string | null;
          photo_path?: string | null;
          price_changed_at?: string | null;
          price_kes: number;
          qty?: number | null;
          sort?: number;
          stock_changed_at?: string | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          supplier_id: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          name_sw?: string | null;
          photo_path?: string | null;
          price_changed_at?: string | null;
          price_kes?: number;
          qty?: number | null;
          sort?: number;
          stock_changed_at?: string | null;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          supplier_id?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_fkey";
            columns: ["supplier_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          language: string;
          phone: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          language?: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          language?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      staff_invites: {
        Row: {
          created_at: string;
          id: string;
          name: string | null;
          phone: string;
          role: Database["public"]["Enums"]["member_role"];
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name?: string | null;
          phone: string;
          role?: Database["public"]["Enums"]["member_role"];
          supplier_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string | null;
          phone?: string;
          role?: Database["public"]["Enums"]["member_role"];
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_invites_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_payments: {
        Row: {
          amount_kes: number;
          checkout_request_id: string | null;
          created_at: string;
          id: string;
          mpesa_receipt: string | null;
          raw: Json | null;
          status: string;
          supplier_id: string;
        };
        ComputedFields: never;
        Insert: {
          amount_kes: number;
          checkout_request_id?: string | null;
          created_at?: string;
          id?: string;
          mpesa_receipt?: string | null;
          raw?: Json | null;
          status?: string;
          supplier_id: string;
        };
        Update: {
          amount_kes?: number;
          checkout_request_id?: string | null;
          created_at?: string;
          id?: string;
          mpesa_receipt?: string | null;
          raw?: Json | null;
          status?: string;
          supplier_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_payments_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"];
          grace_until: string | null;
          plan: Database["public"]["Enums"]["plan_tier"];
          renews_at: string | null;
          status: Database["public"]["Enums"]["subscription_status"];
          supplier_id: string;
          trial_ends_at: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"];
          grace_until?: string | null;
          plan?: Database["public"]["Enums"]["plan_tier"];
          renews_at?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          supplier_id: string;
          trial_ends_at?: string;
          updated_at?: string;
        };
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"];
          grace_until?: string | null;
          plan?: Database["public"]["Enums"]["plan_tier"];
          renews_at?: string | null;
          status?: Database["public"]["Enums"]["subscription_status"];
          supplier_id?: string;
          trial_ends_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: true;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          business_type: string | null;
          created_at: string;
          default_credit_days: number;
          default_language: string;
          default_payment_terms: Database["public"]["Enums"]["payment_terms"];
          id: string;
          is_public: boolean;
          name: string;
          order_counter: number;
          phone: string | null;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          business_type?: string | null;
          created_at?: string;
          default_credit_days?: number;
          default_language?: string;
          default_payment_terms?: Database["public"]["Enums"]["payment_terms"];
          id?: string;
          is_public?: boolean;
          name: string;
          order_counter?: number;
          phone?: string | null;
          slug: string;
        };
        Update: {
          business_type?: string | null;
          created_at?: string;
          default_credit_days?: number;
          default_language?: string;
          default_payment_terms?: Database["public"]["Enums"]["payment_terms"];
          id?: string;
          is_public?: boolean;
          name?: string;
          order_counter?: number;
          phone?: string | null;
          slug?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      customer_balances: {
        Row: {
          credit_kes: number | null;
          credit_limit_kes: number | null;
          customer_id: string;
          name: string;
          net_balance_kes: number | null;
          oldest_overdue_date: string | null;
          orders_total_kes: number | null;
          outstanding_kes: number | null;
          overdue_1_30_kes: number | null;
          overdue_31_60_kes: number | null;
          overdue_60_plus_kes: number | null;
          overdue_kes: number | null;
          payment_terms: Database["public"]["Enums"]["payment_terms"];
          payments_kes: number | null;
          phone: string | null;
          supplier_id: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "customers_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_balances: {
        Row: {
          applied_kes: number | null;
          created_at: string;
          customer_id: string;
          days_overdue: number | null;
          delivery_date: string | null;
          due_date: string | null;
          is_overdue: boolean | null;
          order_id: string;
          order_number: number;
          outstanding_kes: number | null;
          overpaid_kes: number | null;
          paid_kes: number | null;
          status: Database["public"]["Enums"]["order_status"];
          supplier_id: string;
          total_kes: number;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "orders_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_balances";
            referencedColumns: ["supplier_id", "customer_id"];
          },
          {
            foreignKeyName: "orders_customer_fkey";
            columns: ["supplier_id", "customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["supplier_id", "id"];
          },
          {
            foreignKeyName: "orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_team_member: {
        Args: {
          p_name?: string;
          p_phone: string;
          p_role: Database["public"]["Enums"]["member_role"];
          p_supplier_id: string;
        };
        Returns: string;
      };
      anonymise_customer: { Args: { p_customer_id: string }; Returns: undefined };
      can_edit_payment: { Args: { p_payment_id: string }; Returns: boolean };
      can_manage_money: { Args: { sid: string }; Returns: boolean };
      claim_staff_invites: { Args: Record<PropertyKey, never>; Returns: number };
      create_business: {
        Args: { p_language?: string; p_name: string; p_slug: string };
        Returns: string;
      };
      dev_latest_login_code: { Args: { p_phone: string }; Returns: string };
      dev_reset_test_user: { Args: { p_phone: string }; Returns: number };
      get_public_catalog: { Args: { p_slug: string }; Returns: Json };
      has_role: {
        Args: { roles: Database["public"]["Enums"]["member_role"][]; sid: string };
        Returns: boolean;
      };
      is_member: { Args: { sid: string }; Returns: boolean };
      plan_limit: { Args: { sid: string; what: string }; Returns: number };
      refresh_order_payment_status: { Args: { p_order_id: string }; Returns: undefined };
      refresh_order_totals: { Args: { p_order_id: string }; Returns: undefined };
      send_login_code_dev: { Args: { event: Json }; Returns: Json };
      set_product_price: {
        Args: { p_changed_at: string; p_price: number; p_product_id: string };
        Returns: string;
      };
      set_product_stock: {
        Args: {
          p_changed_at: string;
          p_product_id: string;
          p_status: Database["public"]["Enums"]["stock_status"];
        };
        Returns: string;
      };
      team_members: {
        Args: { p_supplier_id: string };
        Returns: {
          full_name: string;
          joined_at: string;
          phone: string;
          role: Database["public"]["Enums"]["member_role"];
          user_id: string;
        }[];
      };
      verified_phone: { Args: { p_user: string }; Returns: string };
    };
    Enums: {
      billing_period: "monthly" | "annual";
      member_role: "owner" | "manager" | "staff";
      message_channel: "whatsapp_link" | "whatsapp_api" | "sms";
      order_payment_status: "unpaid" | "part_paid" | "paid";
      order_source: "link" | "phone" | "whatsapp" | "walk_in";
      order_status: "new" | "confirmed" | "packed" | "out_for_delivery" | "delivered" | "cancelled";
      payment_method_type: "cash" | "mpesa_till" | "mpesa_paybill" | "mpesa_send_money" | "bank";
      payment_source: "manual" | "sms_paste" | "mpesa_auto";
      payment_terms: "upfront" | "on_delivery" | "credit";
      plan_tier: "starter" | "growth" | "business";
      stock_status: "in_stock" | "low" | "out";
      subscription_status: "trialing" | "active" | "grace" | "read_only" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      billing_period: ["monthly", "annual"],
      member_role: ["owner", "manager", "staff"],
      message_channel: ["whatsapp_link", "whatsapp_api", "sms"],
      order_payment_status: ["unpaid", "part_paid", "paid"],
      order_source: ["link", "phone", "whatsapp", "walk_in"],
      order_status: ["new", "confirmed", "packed", "out_for_delivery", "delivered", "cancelled"],
      payment_method_type: ["cash", "mpesa_till", "mpesa_paybill", "mpesa_send_money", "bank"],
      payment_source: ["manual", "sms_paste", "mpesa_auto"],
      payment_terms: ["upfront", "on_delivery", "credit"],
      plan_tier: ["starter", "growth", "business"],
      stock_status: ["in_stock", "low", "out"],
      subscription_status: ["trialing", "active", "grace", "read_only", "cancelled"],
    },
  },
} as const;
