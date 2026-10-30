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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: []
      }
      badge_awards: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          note: string
          recipient_user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          note?: string
          recipient_user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          note?: string
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string
          is_active: boolean
          tier: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_path?: string
          is_active?: boolean
          tier: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string
          is_active?: boolean
          tier?: string
          title?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          member_id: string
          note: string
          package_id: string | null
          slot_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          member_id: string
          note?: string
          package_id?: string | null
          slot_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          member_id?: string
          note?: string
          package_id?: string | null
          slot_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "coach_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "coach_availability"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          accent: string
          description: string
          ends_on: string
          id: string
          metric: string
          name: string
          participant_count: number
          reward_coins: number
          slug: string
          starts_on: string
          status: Database["public"]["Enums"]["content_status"]
          target: number
          unit: string
        }
        Insert: {
          accent?: string
          description: string
          ends_on: string
          id?: string
          metric: string
          name: string
          participant_count?: number
          reward_coins?: number
          slug: string
          starts_on: string
          status?: Database["public"]["Enums"]["content_status"]
          target: number
          unit: string
        }
        Update: {
          accent?: string
          description?: string
          ends_on?: string
          id?: string
          metric?: string
          name?: string
          participant_count?: number
          reward_coins?: number
          slug?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["content_status"]
          target?: number
          unit?: string
        }
        Relationships: []
      }
      coach_availability: {
        Row: {
          coach_id: string
          ends_at: string
          id: string
          is_booked: boolean
          starts_at: string
          timezone: string
        }
        Insert: {
          coach_id: string
          ends_at: string
          id?: string
          is_booked?: boolean
          starts_at: string
          timezone?: string
        }
        Update: {
          coach_id?: string
          ends_at?: string
          id?: string
          is_booked?: boolean
          starts_at?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_packages: {
        Row: {
          coach_id: string
          currency: string
          description: string
          duration_weeks: number
          id: string
          is_active: boolean
          name: string
          price: number
          session_count: number
        }
        Insert: {
          coach_id: string
          currency?: string
          description: string
          duration_weeks: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          session_count: number
        }
        Update: {
          coach_id?: string
          currency?: string
          description?: string
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          session_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          base_price: number
          coaching_type: string
          created_at: string
          currency: string
          id: string
          profile_id: string
          rating: number
          response_hours: number
          review_count: number
          session_count: number
          specialties: string[]
          verified_at: string | null
        }
        Insert: {
          base_price: number
          coaching_type: string
          created_at?: string
          currency?: string
          id?: string
          profile_id: string
          rating?: number
          response_hours?: number
          review_count?: number
          session_count?: number
          specialties?: string[]
          verified_at?: string | null
        }
        Update: {
          base_price?: number
          coaching_type?: string
          created_at?: string
          currency?: string
          id?: string
          profile_id?: string
          rating?: number
          response_hours?: number
          review_count?: number
          session_count?: number
          specialties?: string[]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_spotlights: {
        Row: {
          coach_id: string
          created_at: string
          ends_on: string
          id: string
          is_active: boolean
          starts_on: string
          title: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          ends_on: string
          id?: string
          is_active?: boolean
          starts_on: string
          title: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          is_active?: boolean
          starts_on?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_spotlights_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          accent: string
          created_at: string
          description: string
          id: string
          is_private: boolean
          member_count: number
          name: string
          post_count: number
          slug: string
          topic: string
        }
        Insert: {
          accent?: string
          created_at?: string
          description: string
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
          post_count?: number
          slug: string
          topic: string
        }
        Update: {
          accent?: string
          created_at?: string
          description?: string
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
          post_count?: number
          slug?: string
          topic?: string
        }
        Relationships: []
      }
      community_guidelines: {
        Row: {
          body: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          member_role: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          member_role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_grants: {
        Row: {
          created_at: string
          expires_at: string | null
          granted: boolean
          id: string
          owner_id: string
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          owner_id: string
          scope: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted?: boolean
          id?: string
          owner_id?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          muted_until: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          muted_until?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          muted_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          kind: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          kind?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          owner_id: string
          request_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          request_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          request_type?: string
          status?: string
        }
        Relationships: []
      }
      discovery_tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: string
          label: string
          priority: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          label: string
          priority?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          label?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      exercise_catalog: {
        Row: {
          body_part: string
          category: string
          content_hash: string
          created_at: string
          equipment: string
          gif_path: string
          id: string
          image_path: string
          instruction_steps_by_locale: Json
          instructions: string
          instructions_by_locale: Json
          is_active: boolean
          media_attribution: string
          media_id: string
          media_license_status: string
          muscle_group: string
          name: string
          search_document: unknown
          secondary_muscles: string[]
          source_commit: string
          source_created_at: string | null
          source_license: string
          source_url: string
          steps: string[]
          target: string
        }
        Insert: {
          body_part: string
          category?: string
          content_hash: string
          created_at?: string
          equipment: string
          gif_path?: string
          id: string
          image_path?: string
          instruction_steps_by_locale?: Json
          instructions: string
          instructions_by_locale?: Json
          is_active?: boolean
          media_attribution?: string
          media_id?: string
          media_license_status?: string
          muscle_group: string
          name: string
          search_document?: unknown
          secondary_muscles?: string[]
          source_commit?: string
          source_created_at?: string | null
          source_license?: string
          source_url?: string
          steps?: string[]
          target: string
        }
        Update: {
          body_part?: string
          category?: string
          content_hash?: string
          created_at?: string
          equipment?: string
          gif_path?: string
          id?: string
          image_path?: string
          instruction_steps_by_locale?: Json
          instructions?: string
          instructions_by_locale?: Json
          is_active?: boolean
          media_attribution?: string
          media_id?: string
          media_license_status?: string
          muscle_group?: string
          name?: string
          search_document?: unknown
          secondary_muscles?: string[]
          source_commit?: string
          source_created_at?: string | null
          source_license?: string
          source_url?: string
          steps?: string[]
          target?: string
        }
        Relationships: []
      }
      faceoff_matches: {
        Row: {
          circle_space: string
          created_at: string
          creator_user_id: string
          goal: string
          id: string
          invitee_user_id: string | null
          live_enabled: boolean
          opponent_user_id: string | null
          status: string
          target_date: string
        }
        Insert: {
          circle_space: string
          created_at?: string
          creator_user_id: string
          goal: string
          id?: string
          invitee_user_id?: string | null
          live_enabled?: boolean
          opponent_user_id?: string | null
          status: string
          target_date: string
        }
        Update: {
          circle_space?: string
          created_at?: string
          creator_user_id?: string
          goal?: string
          id?: string
          invitee_user_id?: string | null
          live_enabled?: boolean
          opponent_user_id?: string | null
          status?: string
          target_date?: string
        }
        Relationships: []
      }
      faceoff_live_events: {
        Row: {
          match_id: string
          starts_at: string
          duration_minutes: number
          rules: string
          reward_title: string
          state: string
          stage_arn: string | null
          creator_ready_at: string | null
          opponent_ready_at: string | null
          live_started_at: string | null
          live_ended_at: string | null
          voting_closes_at: string | null
          winner_user_id: string | null
          result: string | null
          created_at: string
        }
        Insert: {
          match_id: string
          starts_at: string
          duration_minutes: number
          rules: string
          reward_title: string
          state?: string
          stage_arn?: string | null
          creator_ready_at?: string | null
          opponent_ready_at?: string | null
          live_started_at?: string | null
          live_ended_at?: string | null
          voting_closes_at?: string | null
          winner_user_id?: string | null
          result?: string | null
          created_at?: string
        }
        Update: {
          match_id?: string
          starts_at?: string
          duration_minutes?: number
          rules?: string
          reward_title?: string
          state?: string
          stage_arn?: string | null
          creator_ready_at?: string | null
          opponent_ready_at?: string | null
          live_started_at?: string | null
          live_ended_at?: string | null
          voting_closes_at?: string | null
          winner_user_id?: string | null
          result?: string | null
          created_at?: string
        }
        Relationships: []
      }
      faceoff_vote_tallies: {
        Row: { match_id: string; creator_votes: number; opponent_votes: number; updated_at: string }
        Insert: { match_id: string; creator_votes?: number; opponent_votes?: number; updated_at?: string }
        Update: { match_id?: string; creator_votes?: number; opponent_votes?: number; updated_at?: string }
        Relationships: []
      }
      faceoff_votes: {
        Row: { match_id: string; voter_user_id: string; candidate_user_id: string; created_at: string }
        Insert: { match_id: string; voter_user_id: string; candidate_user_id: string; created_at?: string }
        Update: { match_id?: string; voter_user_id?: string; candidate_user_id?: string; created_at?: string }
        Relationships: []
      }
      faceoff_awards: {
        Row: { match_id: string; winner_user_id: string; title: string; awarded_at: string }
        Insert: { match_id: string; winner_user_id: string; title: string; awarded_at?: string }
        Update: { match_id?: string; winner_user_id?: string; title?: string; awarded_at?: string }
        Relationships: []
      }
      feature_flags: {
        Row: {
          audience: string
          description: string
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          audience?: string
          description: string
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          audience?: string
          description?: string
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          due_on: string | null
          id: string
          is_active: boolean
          owner_id: string
          target_value: number | null
          title: string
          unit: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          due_on?: string | null
          id?: string
          is_active?: boolean
          owner_id: string
          target_value?: number | null
          title: string
          unit?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          due_on?: string | null
          id?: string
          is_active?: boolean
          owner_id?: string
          target_value?: number | null
          title?: string
          unit?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          body: string
          created_at: string
          id: string
          mood: number | null
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          mood?: number | null
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          mood?: number | null
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          calories: number | null
          carbs_g: number | null
          fat_g: number | null
          id: string
          meal_id: string
          name: string
          protein_g: number | null
          quantity: number
          source_fdc_id: number | null
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          id?: string
          meal_id: string
          name: string
          protein_g?: number | null
          quantity?: number
          source_fdc_id?: number | null
          unit?: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          id?: string
          meal_id?: string
          name?: string
          protein_g?: number | null
          quantity?: number
          source_fdc_id?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          eaten_at: string
          id: string
          meal_type: string
          notes: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type: string
          notes?: string
          owner_id: string
        }
        Update: {
          created_at?: string
          eaten_at?: string
          id?: string
          meal_type?: string
          notes?: string
          owner_id?: string
        }
        Relationships: []
      }
      member_demo_state: {
        Row: {
          loaded_at: string
          owner_id: string
        }
        Insert: {
          loaded_at?: string
          owner_id: string
        }
        Update: {
          loaded_at?: string
          owner_id?: string
        }
        Relationships: []
      }
      member_discovery_choices: {
        Row: {
          created_at: string
          owner_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_discovery_choices_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "discovery_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      member_profile_details: {
        Row: {
          city: string
          country: string
          first_name: string
          last_name: string
          owner_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          city?: string
          country?: string
          first_name?: string
          last_name?: string
          owner_id: string
          phone?: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          first_name?: string
          last_name?: string
          owner_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          byte_size: number
          conversation_id: string
          created_at: string
          file_name: string
          id: string
          message_id: string
          mime_type: string
          storage_path: string
          uploader_user_id: string
        }
        Insert: {
          byte_size: number
          conversation_id: string
          created_at?: string
          file_name: string
          id?: string
          message_id: string
          mime_type: string
          storage_path: string
          uploader_user_id: string
        }
        Update: {
          byte_size?: number
          conversation_id?: string
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string
          mime_type?: string
          storage_path?: string
          uploader_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_profile_id: string | null
          sender_user_id: string | null
          status: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_profile_id?: string | null
          sender_user_id?: string | null
          status?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_profile_id?: string | null
          sender_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_id_fkey"
            columns: ["sender_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          recipient_count: number
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id: string
          recipient_count?: number
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          recipient_count?: number
          title?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          owner_id: string
          reminder_day: boolean
          reminder_hour: boolean
          reminder_ten_minutes: boolean
          updated_at: string
          weekly_digest: boolean
        }
        Insert: {
          owner_id: string
          reminder_day?: boolean
          reminder_hour?: boolean
          reminder_ten_minutes?: boolean
          updated_at?: string
          weekly_digest?: boolean
        }
        Update: {
          owner_id?: string
          reminder_day?: boolean
          reminder_hour?: boolean
          reminder_ten_minutes?: boolean
          updated_at?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          campaign_id: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          owner_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          owner_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          owner_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      operations_queue: {
        Row: {
          area: string
          created_at: string
          detail: string
          id: string
          is_synthetic: boolean
          owner_label: string
          reference: string
          severity: string
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          created_at?: string
          detail: string
          id?: string
          is_synthetic?: boolean
          owner_label?: string
          reference: string
          severity: string
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          created_at?: string
          detail?: string
          id?: string
          is_synthetic?: boolean
          owner_label?: string
          reference?: string
          severity?: string
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_profile_id: string
          author_user_id: string
          body: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_profile_id: string
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_profile_id?: string
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_parent_same_post_fkey"
            columns: ["parent_comment_id", "post_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id", "post_id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          post_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          reaction?: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          detail: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          audience: string
          author_profile_id: string | null
          author_user_id: string | null
          body: string
          circle_space: string
          comment_count: number
          community_id: string | null
          created_at: string
          id: string
          kind: string
          media_alt: string
          media_path: string | null
          media_type: string | null
          reaction_count: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          author_profile_id?: string | null
          author_user_id?: string | null
          body: string
          circle_space?: string
          comment_count?: number
          community_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          media_alt?: string
          media_path?: string | null
          media_type?: string | null
          reaction_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          author_profile_id?: string | null
          author_user_id?: string | null
          body?: string
          circle_space?: string
          comment_count?: number
          community_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          media_alt?: string
          media_path?: string | null
          media_type?: string | null
          reaction_count?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          accent: string
          coin_price: number | null
          currency: string
          description: string
          id: string
          is_active: boolean
          name: string
          price: number
          product_type: string
          slug: string
        }
        Insert: {
          accent?: string
          coin_price?: number | null
          currency?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          product_type: string
          slug: string
        }
        Update: {
          accent?: string
          coin_price?: number | null
          currency?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_type?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_tone: string
          bio: string
          created_at: string
          display_name: string
          handle: string
          headline: string
          id: string
          initials: string
          is_public: boolean
          is_verified: boolean
          location: string
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_tone?: string
          bio?: string
          created_at?: string
          display_name: string
          handle: string
          headline?: string
          id?: string
          initials: string
          is_public?: boolean
          is_verified?: boolean
          location?: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_tone?: string
          bio?: string
          created_at?: string
          display_name?: string
          handle?: string
          headline?: string
          id?: string
          initials?: string
          is_public?: boolean
          is_verified?: boolean
          location?: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      program_session_exercises: {
        Row: {
          exercise_id: string
          id: string
          position: number
          rest_seconds: number
          session_id: string
          target_reps: string
          target_sets: number
        }
        Insert: {
          exercise_id: string
          id?: string
          position: number
          rest_seconds?: number
          session_id: string
          target_reps?: string
          target_sets?: number
        }
        Update: {
          exercise_id?: string
          id?: string
          position?: number
          rest_seconds?: number
          session_id?: string
          target_reps?: string
          target_sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "program_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_sessions: {
        Row: {
          day_number: number
          duration_minutes: number
          focus: string
          id: string
          program_id: string
          title: string
          week_number: number
        }
        Insert: {
          day_number: number
          duration_minutes: number
          focus: string
          id?: string
          program_id: string
          title: string
          week_number: number
        }
        Update: {
          day_number?: number
          duration_minutes?: number
          focus?: string
          id?: string
          program_id?: string
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          accent: string
          author_profile_id: string | null
          created_at: string
          id: string
          level: string
          sessions_per_week: number
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          weeks: number
        }
        Insert: {
          accent?: string
          author_profile_id?: string | null
          created_at?: string
          id?: string
          level: string
          sessions_per_week: number
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary: string
          title: string
          weeks: number
        }
        Update: {
          accent?: string
          author_profile_id?: string | null
          created_at?: string
          id?: string
          level?: string
          sessions_per_week?: number
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          title?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "programs_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_attributions: {
        Row: {
          code: string
          created_at: string
          referred_user_id: string
          referrer_user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          referred_user_id: string
          referrer_user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          referred_user_id?: string
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_attributions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["code"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          owner_id: string
        }
        Insert: {
          code: string
          created_at?: string
          owner_id: string
        }
        Update: {
          code?: string
          created_at?: string
          owner_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          owner_id: string
          plan: string
          status: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          owner_id: string
          plan: string
          status: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          owner_id?: string
          plan?: string
          status?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          owner_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          owner_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          owner_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainee_details: {
        Row: {
          coaching_opt_in: boolean
          diet_notes: string
          diet_preferences: string
          fitness_goals: string
          fitness_level: string
          owner_id: string
          share_with_trainer: boolean
          training_preferences: string
          updated_at: string
          wellness_notes: string
        }
        Insert: {
          coaching_opt_in?: boolean
          diet_notes?: string
          diet_preferences?: string
          fitness_goals?: string
          fitness_level?: string
          owner_id: string
          share_with_trainer?: boolean
          training_preferences?: string
          updated_at?: string
          wellness_notes?: string
        }
        Update: {
          coaching_opt_in?: boolean
          diet_notes?: string
          diet_preferences?: string
          fitness_goals?: string
          fitness_level?: string
          owner_id?: string
          share_with_trainer?: boolean
          training_preferences?: string
          updated_at?: string
          wellness_notes?: string
        }
        Relationships: []
      }
      trainee_exercises: {
        Row: {
          created_at: string
          equipment: string
          id: string
          instructions: string
          name: string
          owner_id: string
          target: string
        }
        Insert: {
          created_at?: string
          equipment?: string
          id?: string
          instructions?: string
          name: string
          owner_id: string
          target?: string
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          instructions?: string
          name?: string
          owner_id?: string
          target?: string
        }
        Relationships: []
      }
      trainee_program_days: {
        Row: {
          id: string
          label: string
          owner_id: string
          program_id: string
          weekday: number
        }
        Insert: {
          id?: string
          label?: string
          owner_id: string
          program_id: string
          weekday: number
        }
        Update: {
          id?: string
          label?: string
          owner_id?: string
          program_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainee_program_days_program_id_owner_id_fkey"
            columns: ["program_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "trainee_programs"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      trainee_program_movements: {
        Row: {
          catalog_exercise_id: string | null
          custom_exercise_id: string | null
          day_id: string
          id: string
          notes: string
          owner_id: string
          position: number
          target_reps: string
          target_sets: number
        }
        Insert: {
          catalog_exercise_id?: string | null
          custom_exercise_id?: string | null
          day_id: string
          id?: string
          notes?: string
          owner_id: string
          position: number
          target_reps?: string
          target_sets?: number
        }
        Update: {
          catalog_exercise_id?: string | null
          custom_exercise_id?: string | null
          day_id?: string
          id?: string
          notes?: string
          owner_id?: string
          position?: number
          target_reps?: string
          target_sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "trainee_program_movements_catalog_exercise_id_fkey"
            columns: ["catalog_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainee_program_movements_custom_exercise_id_owner_id_fkey"
            columns: ["custom_exercise_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "trainee_exercises"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "trainee_program_movements_day_id_owner_id_fkey"
            columns: ["day_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "trainee_program_days"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      trainee_programs: {
        Row: {
          created_at: string
          description: string
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainee_schedules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          program_id: string
          share_token: string | null
          starts_on: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id: string
          program_id: string
          share_token?: string | null
          starts_on: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          program_id?: string
          share_token?: string | null
          starts_on?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainee_schedules_program_id_owner_id_fkey"
            columns: ["program_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "trainee_programs"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      trainer_applications: {
        Row: {
          applicant_id: string
          bio: string
          certificate_path: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          specialties: string[]
          status: string
        }
        Insert: {
          applicant_id: string
          bio?: string
          certificate_path?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
        }
        Update: {
          applicant_id?: string
          bio?: string
          certificate_path?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialties?: string[]
          status?: string
        }
        Relationships: []
      }
      trainer_client_care_plans: {
        Row: {
          created_at: string
          diet_plan: string
          other_guidance: string
          recovery_plan: string
          trainee_id: string
          trainer_id: string | null
          training_plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_plan?: string
          other_guidance?: string
          recovery_plan?: string
          trainee_id: string
          trainer_id?: string | null
          training_plan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_plan?: string
          other_guidance?: string
          recovery_plan?: string
          trainee_id?: string
          trainer_id?: string | null
          training_plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      trainer_client_links: {
        Row: {
          active: boolean
          created_at: string
          id: string
          trainee_id: string
          trainer_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          trainee_id: string
          trainer_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          trainee_id?: string
          trainer_id?: string
        }
        Relationships: []
      }
      trainer_onboarding: {
        Row: {
          created_at: string
          must_change_password: boolean
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          must_change_password?: boolean
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          must_change_password?: boolean
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          owner_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          owner_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          owner_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          owner_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          owner_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          owner_id?: string
          transaction_type?: string
        }
        Relationships: []
      }
      wellness_checkins: {
        Row: {
          checked_on: string
          created_at: string
          energy: number
          id: string
          mood: number
          note: string
          owner_id: string
          sleep_hours: number | null
          soreness: number
        }
        Insert: {
          checked_on?: string
          created_at?: string
          energy: number
          id?: string
          mood: number
          note?: string
          owner_id: string
          sleep_hours?: number | null
          soreness: number
        }
        Update: {
          checked_on?: string
          created_at?: string
          energy?: number
          id?: string
          mood?: number
          note?: string
          owner_id?: string
          sleep_hours?: number | null
          soreness?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string
          position: number
          rest_seconds: number
          target_reps: string
          target_sets: number
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string
          position: number
          rest_seconds?: number
          target_reps?: string
          target_sets?: number
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string
          position?: number
          rest_seconds?: number
          target_reps?: string
          target_sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed_at: string | null
          id: string
          is_warmup: boolean
          owner_id: string
          reps: number | null
          rpe: number | null
          set_number: number
          weight_kg: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_warmup?: boolean
          owner_id: string
          reps?: number | null
          rpe?: number | null
          set_number: number
          weight_kg?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_warmup?: boolean
          owner_id?: string
          reps?: number | null
          rpe?: number | null
          set_number?: number
          weight_kg?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_template: boolean
          name: string
          notes: string
          owner_id: string | null
          scheduled_for: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["workout_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_template?: boolean
          name: string
          notes?: string
          owner_id?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workout_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_template?: boolean
          name?: string
          notes?: string
          owner_id?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workout_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_faceoff_vote: { Args: { p_match_id: string; p_candidate: string; p_voter: string }; Returns: undefined }
      finalize_faceoff: { Args: { p_match_id: string }; Returns: string }
      can_access_conversation: {
        Args: { target_conversation: string }
        Returns: boolean
      }
      current_profile_id: { Args: never; Returns: string }
      delete_my_account: { Args: { confirmation: string }; Returns: boolean }
      get_exercise_facets: { Args: never; Returns: Json }
      is_operator: { Args: never; Returns: boolean }
      load_member_demo_history: { Args: never; Returns: boolean }
      operator_set_feature_flag: {
        Args: { flag_key: string; next_enabled: boolean }
        Returns: boolean
      }
      operator_update_case: {
        Args: {
          next_status: Database["public"]["Enums"]["case_status"]
          note: string
          target_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "requested" | "confirmed" | "completed" | "cancelled"
      case_status: "open" | "review" | "resolved" | "dismissed"
      content_status: "draft" | "published" | "hidden" | "removed"
      profile_role:
        | "member"
        | "coachsphere"
        | "fitsphere"
        | "moderator"
        | "support"
        | "finance_admin"
        | "catalog_admin"
        | "super_admin"
      workout_status:
        | "draft"
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
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
      booking_status: ["requested", "confirmed", "completed", "cancelled"],
      case_status: ["open", "review", "resolved", "dismissed"],
      content_status: ["draft", "published", "hidden", "removed"],
      profile_role: [
        "member",
        "coachsphere",
        "fitsphere",
        "moderator",
        "support",
        "finance_admin",
        "catalog_admin",
        "super_admin",
      ],
      workout_status: [
        "draft",
        "scheduled",
        "active",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
