import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          full_name: string;
          role: 'admin' | 'employee';
          employee_id: string | null;
          pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name: string;
          role?: 'admin' | 'employee';
          employee_id?: string | null;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string;
          role?: 'admin' | 'employee';
          employee_id?: string | null;
          pin_hash?: string | null;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          full_name: string;
          employee_code: string;
          department: string;
          position: string;
          status: 'active' | 'inactive';
          hourly_rate: number;
          profile_photo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          employee_code: string;
          department: string;
          position: string;
          status?: 'active' | 'inactive';
          hourly_rate: number;
          profile_photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          employee_code?: string;
          department?: string;
          position?: string;
          status?: 'active' | 'inactive';
          hourly_rate?: number;
          profile_photo_path?: string | null;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          employee_id: string;
          clock_in_at: string;
          clock_out_at: string | null;
          device_info: string;
          clock_in_photo_path: string | null;
          clock_out_photo_path: string | null;
          break_minutes: number;
          work_minutes: number | null;
          standard_minutes: number | null;
          overtime_minutes: number | null;
          notes: string | null;
          is_auto_created: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          clock_in_at?: string;
          clock_out_at?: string | null;
          device_info: string;
          clock_in_photo_path?: string | null;
          clock_out_photo_path?: string | null;
          break_minutes?: number;
          work_minutes?: number | null;
          standard_minutes?: number | null;
          overtime_minutes?: number | null;
          notes?: string | null;
          is_auto_created?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          clock_out_at?: string | null;
          clock_out_photo_path?: string | null;
          break_minutes?: number;
          work_minutes?: number | null;
          standard_minutes?: number | null;
          overtime_minutes?: number | null;
          notes?: string | null;
          is_auto_created?: boolean;
          updated_at?: string;
        };
      };
    };
  };
};
