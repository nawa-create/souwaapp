import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Driver = {
  id: string;
  name: string;
  employee_number: string | null;
  hire_date: string;
  termination_date: string | null;
  is_active: boolean;
  display_order: number;
  dispatch_order: number | null;
  created_at: string;
  updated_at: string;
};

export type OvertimeRate = {
  id: string;
  overtime_type: string;
  hourly_rate: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
};

export type DailyOvertimeRecord = {
  id: string;
  driver_id: string;
  work_date: string;
  late_night_hours: number;
  inner_late_night_hours: number;
  early_hours: number;
  sat_holiday_hours: number;
  sat_holiday_late_night_hours: number;
  legal_holiday_hours: number;
  legal_holiday_late_night_hours: number;
  vacuum_count: number;
  car_stay_count: number;
  boarding_count: number;
  training_count: number;
  guidance_count: number;
  created_at: string;
  updated_at: string;
};

export type AllowanceRate = {
  id: string;
  allowance_type: string;
  amount: number;
  effective_date: string;
  created_at: string;
  updated_at: string;
};

export type MonthlyRecord = {
  id: string;
  driver_id: string;
  period_start: string;
  period_end: string;
  phone_allowance: number;
  revenue_sales: number;
  accident_free_amount: number;
  created_at: string;
  updated_at: string;
};
