// TypeScript types for Supabase Database
// These types are generated based on your database schema

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          industry: string | null
          contact_name: string | null
          contact_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          contact_name?: string | null
          contact_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          contact_name?: string | null
          contact_email?: string | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string
          status: 'open' | 'closed' | 'on_hold' | 'filled'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          client_id: string
          status?: 'open' | 'closed' | 'on_hold' | 'filled'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          client_id?: string
          status?: 'open' | 'closed' | 'on_hold' | 'filled'
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          resume_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          resume_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          resume_url?: string | null
          created_at?: string
        }
      }
      job_candidate: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          stage: 'applied' | 'screening' | 'interview' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected'
          notes: string | null
          assigned_to: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          stage?: 'applied' | 'screening' | 'interview' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected'
          notes?: string | null
          assigned_to?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          stage?: 'applied' | 'screening' | 'interview' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected'
          notes?: string | null
          assigned_to?: string | null
          updated_at?: string
        }
      }
      candidate_notes: {
        Row: {
          id: string
          job_candidate_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          job_candidate_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          job_candidate_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status: 'open' | 'closed' | 'on_hold' | 'filled'
      candidate_stage: 'applied' | 'screening' | 'interview' | 'technical' | 'final' | 'offer' | 'hired' | 'rejected'
    }
  }
}