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
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_images: {
        Row: {
          alt_text: string | null
          blog_post_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number
        }
        Insert: {
          alt_text?: string | null
          blog_post_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
        }
        Update: {
          alt_text?: string | null
          blog_post_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_images_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category_id: string | null
          content: string | null
          cover_alt_text: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          featured_blog: boolean
          featured_home: boolean
          id: string
          published: boolean
          published_at: string | null
          reading_time: number | null
          related_caravan_id: string | null
          related_destination: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content?: string | null
          cover_alt_text?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          featured_blog?: boolean
          featured_home?: boolean
          id?: string
          published?: boolean
          published_at?: string | null
          reading_time?: number | null
          related_caravan_id?: string | null
          related_destination?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content?: string | null
          cover_alt_text?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          featured_blog?: boolean
          featured_home?: boolean
          id?: string
          published?: boolean
          published_at?: string | null
          reading_time?: number | null
          related_caravan_id?: string | null
          related_destination?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_related_caravan_id_fkey"
            columns: ["related_caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caravan_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      caravan_departures: {
        Row: {
          available_spots: number | null
          caravan_id: string
          created_at: string
          end_date: string | null
          id: string
          label: string | null
          notes: string | null
          order_index: number
          start_date: string | null
          status: Database["public"]["Enums"]["departure_status"]
          updated_at: string
        }
        Insert: {
          available_spots?: number | null
          caravan_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          order_index?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["departure_status"]
          updated_at?: string
        }
        Update: {
          available_spots?: number | null
          caravan_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          label?: string | null
          notes?: string | null
          order_index?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["departure_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caravan_departures_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
        ]
      }
      caravan_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          caravan_id: string
          created_at: string
          id: string
          image_url: string
          order_index: number
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          caravan_id: string
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          caravan_id?: string
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "caravan_images_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
        ]
      }
      caravan_itinerary_days: {
        Row: {
          accommodation: string | null
          caravan_id: string
          created_at: string
          day_number: number
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          meals: Json
          notes: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          accommodation?: string | null
          caravan_id: string
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          meals?: Json
          notes?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          accommodation?: string | null
          caravan_id?: string
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          meals?: Json
          notes?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caravan_itinerary_days_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
        ]
      }
      caravans: {
        Row: {
          card_image_url: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          destination: string
          duration: string | null
          featured_hero: boolean
          featured_home: boolean
          has_leehov_representative: boolean
          has_portuguese_guide: boolean
          has_travel_insurance: boolean
          has_travel_kit: boolean
          hero_cta_text: string | null
          hero_cta_url: string | null
          hero_description: string | null
          hero_image_url: string | null
          hero_order: number
          hero_title: string | null
          id: string
          included: Json
          is_accompanied: boolean
          is_group_trip: boolean
          leader_bio: string | null
          leader_image_url: string | null
          leader_name: string | null
          max_people: number | null
          min_people: number | null
          not_included: Json
          notes: string | null
          price: string | null
          published: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["caravan_status"]
          summary: string | null
          title: string
          type: string | null
          updated_at: string
          updated_by: string | null
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          card_image_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          destination: string
          duration?: string | null
          featured_hero?: boolean
          featured_home?: boolean
          has_leehov_representative?: boolean
          has_portuguese_guide?: boolean
          has_travel_insurance?: boolean
          has_travel_kit?: boolean
          hero_cta_text?: string | null
          hero_cta_url?: string | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_order?: number
          hero_title?: string | null
          id?: string
          included?: Json
          is_accompanied?: boolean
          is_group_trip?: boolean
          leader_bio?: string | null
          leader_image_url?: string | null
          leader_name?: string | null
          max_people?: number | null
          min_people?: number | null
          not_included?: Json
          notes?: string | null
          price?: string | null
          published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["caravan_status"]
          summary?: string | null
          title: string
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          card_image_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          destination?: string
          duration?: string | null
          featured_hero?: boolean
          featured_home?: boolean
          has_leehov_representative?: boolean
          has_portuguese_guide?: boolean
          has_travel_insurance?: boolean
          has_travel_kit?: boolean
          hero_cta_text?: string | null
          hero_cta_url?: string | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_order?: number
          hero_title?: string | null
          id?: string
          included?: Json
          is_accompanied?: boolean
          is_group_trip?: boolean
          leader_bio?: string | null
          leader_image_url?: string | null
          leader_name?: string | null
          max_people?: number | null
          min_people?: number | null
          not_included?: Json
          notes?: string | null
          price?: string | null
          published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["caravan_status"]
          summary?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caravans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "caravan_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caravans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caravans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          provider: string
          provider_message_id: string | null
          recipient_email: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string
          template_key: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject: string
          template_key: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          provider?: string
          provider_message_id?: string | null
          recipient_email?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      form_rate_limits: {
        Row: {
          attempts: number
          created_at: string
          id: string
          identifier_hash: string
          last_attempt_at: string
          scope: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          identifier_hash: string
          last_attempt_at?: string
          scope: string
          window_started_at: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          identifier_hash?: string
          last_attempt_at?: string
          scope?: string
          window_started_at?: string
        }
        Relationships: []
      }
      google_business_connections: {
        Row: {
          account_id: string | null
          account_name: string | null
          connected_at: string
          connected_by: string | null
          created_at: string
          disconnected_at: string | null
          google_maps_url: string | null
          id: string
          last_token_refresh_at: string | null
          location_id: string | null
          location_name: string | null
          refresh_token_ciphertext: string | null
          scopes: string[]
          status: Database["public"]["Enums"]["google_business_connection_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          disconnected_at?: string | null
          google_maps_url?: string | null
          id?: string
          last_token_refresh_at?: string | null
          location_id?: string | null
          location_name?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["google_business_connection_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          connected_at?: string
          connected_by?: string | null
          created_at?: string
          disconnected_at?: string | null
          google_maps_url?: string | null
          id?: string
          last_token_refresh_at?: string | null
          location_id?: string | null
          location_name?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["google_business_connection_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_business_connections_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_business_connections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_business_settings: {
        Row: {
          account_id: string | null
          cache_hours: number
          connection_id: string | null
          created_at: string
          display_mode: Database["public"]["Enums"]["review_display_mode"]
          enabled: boolean
          google_maps_url: string | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          location_id: string | null
          min_rating: number
          reviews_limit: number
          singleton: boolean
          sync_lock_token: string | null
          sync_lock_until: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_id?: string | null
          cache_hours?: number
          connection_id?: string | null
          created_at?: string
          display_mode?: Database["public"]["Enums"]["review_display_mode"]
          enabled?: boolean
          google_maps_url?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          location_id?: string | null
          min_rating?: number
          reviews_limit?: number
          singleton?: boolean
          sync_lock_token?: string | null
          sync_lock_until?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_id?: string | null
          cache_hours?: number
          connection_id?: string | null
          created_at?: string
          display_mode?: Database["public"]["Enums"]["review_display_mode"]
          enabled?: boolean
          google_maps_url?: string | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          location_id?: string | null
          min_rating?: number
          reviews_limit?: number
          singleton?: boolean
          sync_lock_token?: string | null
          sync_lock_until?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_business_settings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_business_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_business_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      google_reviews_cache: {
        Row: {
          comment: string | null
          connection_id: string | null
          create_time: string | null
          created_at: string
          expires_at: string
          featured: boolean
          google_review_id: string
          id: string
          raw_data: Json
          reply_comment: string | null
          reply_error: string | null
          reply_pending_at: string | null
          reply_status: Database["public"]["Enums"]["google_review_reply_status"]
          reply_update_time: string | null
          review_name: string | null
          reviewer_display_name: string | null
          reviewer_profile_photo_url: string | null
          reviewer_profile_url: string | null
          star_rating: number
          synced_at: string
          update_time: string | null
          updated_at: string
          updated_by: string | null
          visible: boolean
        }
        Insert: {
          comment?: string | null
          connection_id?: string | null
          create_time?: string | null
          created_at?: string
          expires_at?: string
          featured?: boolean
          google_review_id: string
          id?: string
          raw_data?: Json
          reply_comment?: string | null
          reply_error?: string | null
          reply_pending_at?: string | null
          reply_status?: Database["public"]["Enums"]["google_review_reply_status"]
          reply_update_time?: string | null
          review_name?: string | null
          reviewer_display_name?: string | null
          reviewer_profile_photo_url?: string | null
          reviewer_profile_url?: string | null
          star_rating: number
          synced_at?: string
          update_time?: string | null
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Update: {
          comment?: string | null
          connection_id?: string | null
          create_time?: string | null
          created_at?: string
          expires_at?: string
          featured?: boolean
          google_review_id?: string
          id?: string
          raw_data?: Json
          reply_comment?: string | null
          reply_error?: string | null
          reply_pending_at?: string | null
          reply_status?: Database["public"]["Enums"]["google_review_reply_status"]
          reply_update_time?: string | null
          review_name?: string | null
          reviewer_display_name?: string | null
          reviewer_profile_photo_url?: string | null
          reviewer_profile_url?: string | null
          star_rating?: number
          synced_at?: string
          update_time?: string | null
          updated_at?: string
          updated_by?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_cache_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_business_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_reviews_cache_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          caravan_id: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json
          name: string
          phone: string
          source: string
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          caravan_id?: string | null
          city?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json
          name: string
          phone: string
          source: string
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          caravan_id?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json
          name?: string
          phone?: string
          source?: string
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          file_name: string
          file_size: number
          folder: string
          id: string
          mime_type: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size: number
          folder?: string
          id?: string
          mime_type: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size?: number
          folder?: string
          id?: string
          mime_type?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          active: boolean | null
          confirmation_expires_at: string | null
          confirmation_sent_at: string | null
          confirmation_token_hash: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          metadata: Json
          name: string | null
          source: string
          status: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token_hash: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          confirmation_expires_at?: string | null
          confirmation_sent_at?: string | null
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json
          name?: string | null
          source: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          confirmation_expires_at?: string | null
          confirmation_sent_at?: string | null
          confirmation_token_hash?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json
          name?: string | null
          source?: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          active: boolean
          button_text: string | null
          button_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_location: Database["public"]["Enums"]["popup_display_location"]
          frequency: Database["public"]["Enums"]["popup_frequency"]
          id: string
          image_asset_id: string | null
          popup_type: Database["public"]["Enums"]["popup_type"]
          related_caravan_id: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_location?: Database["public"]["Enums"]["popup_display_location"]
          frequency?: Database["public"]["Enums"]["popup_frequency"]
          id?: string
          image_asset_id?: string | null
          popup_type: Database["public"]["Enums"]["popup_type"]
          related_caravan_id?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_location?: Database["public"]["Enums"]["popup_display_location"]
          frequency?: Database["public"]["Enums"]["popup_frequency"]
          id?: string
          image_asset_id?: string | null
          popup_type?: Database["public"]["Enums"]["popup_type"]
          related_caravan_id?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popups_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popups_related_caravan_id_fkey"
            columns: ["related_caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "popups_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          media_asset_id: string | null
          public_read: boolean
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          media_asset_id?: string | null
          public_read?: boolean
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          media_asset_id?: string | null
          public_read?: boolean
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          active: boolean
          city: string | null
          created_at: string
          created_by: string | null
          featured: boolean
          id: string
          image_asset_id: string | null
          name: string
          order_index: number
          rating: number
          role_title: string | null
          testimonial_text: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          image_asset_id?: string | null
          name: string
          order_index?: number
          rating?: number
          role_title?: string | null
          testimonial_text: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          created_at?: string
          created_by?: string | null
          featured?: boolean
          id?: string
          image_asset_id?: string | null
          name?: string
          order_index?: number
          rating?: number
          role_title?: string | null
          testimonial_text?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          delivery_id: string
          error_message: string | null
          event: Database["public"]["Enums"]["webhook_event"]
          id: string
          payload: Json
          payload_version: number
          request_started_at: string | null
          response_body: string | null
          response_status: number | null
          status: Database["public"]["Enums"]["webhook_delivery_status"]
          updated_at: string
          webhook_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          delivery_id: string
          error_message?: string | null
          event: Database["public"]["Enums"]["webhook_event"]
          id?: string
          payload: Json
          payload_version?: number
          request_started_at?: string | null
          response_body?: string | null
          response_status?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          updated_at?: string
          webhook_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          delivery_id?: string
          error_message?: string | null
          event?: Database["public"]["Enums"]["webhook_event"]
          id?: string
          payload?: Json
          payload_version?: number
          request_started_at?: string | null
          response_body?: string | null
          response_status?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          updated_at?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          endpoint_url: string
          events: Database["public"]["Enums"]["webhook_event"][]
          id: string
          name: string
          updated_at: string
          updated_by: string | null
          validation_key_ciphertext: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          endpoint_url: string
          events: Database["public"]["Enums"]["webhook_event"][]
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
          validation_key_ciphertext: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          endpoint_url?: string
          events?: Database["public"]["Enums"]["webhook_event"][]
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
          validation_key_ciphertext?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_form_rate_limit: {
        Args: {
          p_identifier_hash: string
          p_limit?: number
          p_scope: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      caravan_status:
        | "available"
        | "coming_soon"
        | "waitlist"
        | "sold_out"
        | "draft"
      departure_status: "available" | "coming_soon" | "waitlist" | "sold_out"
      email_status: "pending" | "sent" | "failed" | "skipped"
      google_business_connection_status:
        | "pending_location"
        | "connected"
        | "disconnected"
        | "error"
      google_review_reply_status:
        | "none"
        | "pending"
        | "synced"
        | "delete_pending"
        | "error"
      lead_status: "new" | "in_progress" | "converted" | "archived"
      newsletter_status: "pending" | "active" | "unsubscribed"
      popup_display_location: "home" | "blog" | "caravans" | "sitewide"
      popup_frequency: "always" | "session" | "daily" | "weekly"
      popup_type: "campaign" | "newsletter" | "whatsapp" | "caravan"
      review_display_mode: "manual" | "google" | "mixed"
      webhook_delivery_status: "pending" | "sent" | "failed"
      webhook_event:
        | "lead.created"
        | "caravan_interest.created"
        | "contact.created"
        | "newsletter.subscribed"
        | "newsletter.confirmed"
        | "google_review.created"
        | "google_review.low_rating"
        | "caravan.created"
        | "caravan.updated"
        | "caravan.published"
        | "blog_post.published"
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
      app_role: ["admin", "editor"],
      caravan_status: [
        "available",
        "coming_soon",
        "waitlist",
        "sold_out",
        "draft",
      ],
      departure_status: ["available", "coming_soon", "waitlist", "sold_out"],
      email_status: ["pending", "sent", "failed", "skipped"],
      google_business_connection_status: [
        "pending_location",
        "connected",
        "disconnected",
        "error",
      ],
      google_review_reply_status: [
        "none",
        "pending",
        "synced",
        "delete_pending",
        "error",
      ],
      lead_status: ["new", "in_progress", "converted", "archived"],
      newsletter_status: ["pending", "active", "unsubscribed"],
      popup_display_location: ["home", "blog", "caravans", "sitewide"],
      popup_frequency: ["always", "session", "daily", "weekly"],
      popup_type: ["campaign", "newsletter", "whatsapp", "caravan"],
      review_display_mode: ["manual", "google", "mixed"],
      webhook_delivery_status: ["pending", "sent", "failed"],
      webhook_event: [
        "lead.created",
        "caravan_interest.created",
        "contact.created",
        "newsletter.subscribed",
        "newsletter.confirmed",
        "google_review.created",
        "google_review.low_rating",
        "caravan.created",
        "caravan.updated",
        "caravan.published",
        "blog_post.published",
      ],
    },
  },
} as const
