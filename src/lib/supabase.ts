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

// Employee type based on your table schema
export type Employee = {
  id: string;
  full_name: string;
  employee_code: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  hourly_rate: number;
  profile_photo_path: string | null;
  address: string | null;
  bank_account: string | null;
  created_at: string;
  updated_at: string;
};

// Employee CRUD operations
export const employeeQueries = {
  // Fetch all employees
  async getEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Employee[];
  },

  // Fetch active employees only (for kiosk)
  async getActiveEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'active')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data as Employee[];
  },

  // Fetch single employee by ID
  async getEmployee(id: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Employee;
  },

  // Create new employee
  async createEmployee(employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employees')
      .insert([employeeData])
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  },

  // Update employee
  async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Employee;
  },

  // Delete employee
  async deleteEmployee(id: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Subscribe to real-time changes
  subscribeToEmployees(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Employee | null;
    old: { id: string } | null;
  }) => void) {
    return supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Employee | null,
            old: payload.old as { id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

// Shift type based on your table schema
export type Shift = {
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

// Shift CRUD operations
export const shiftQueries = {
  // Get open shift for an employee (clock_out_at is null)
  async getOpenShift(employeeId: string): Promise<Shift | null> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as Shift | null;
  },

  // Get all open shifts (for kiosk to know who is signed in)
  async getAllOpenShifts(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .is('clock_out_at', null);
    if (error) throw error;
    return data as Shift[];
  },

  // Clock in - create new shift
  async clockIn(employeeId: string, deviceInfo: string, photoPath?: string): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert([{
        employee_id: employeeId,
        device_info: deviceInfo,
        clock_in_photo_path: photoPath || null,
        created_by: employeeId, // Using employee_id as created_by for kiosk
      }])
      .select()
      .single();
    if (error) throw error;
    return data as Shift;
  },

  // Clock out - update existing shift
  async clockOut(shiftId: string, photoPath?: string): Promise<Shift> {
    const clockOutTime = new Date().toISOString();

    // First get the shift to calculate work minutes
    const { data: shift, error: fetchError } = await supabase
      .from('shifts')
      .select('clock_in_at, break_minutes')
      .eq('id', shiftId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching shift for clock out:', fetchError);
      throw fetchError;
    }

    if (!shift) {
      // If we can't fetch the shift (RLS issue), just update without calculating minutes
      console.warn('Could not fetch shift details, updating without work minutes calculation');
      const { data, error } = await supabase
        .from('shifts')
        .update({
          clock_out_at: clockOutTime,
          clock_out_photo_path: photoPath || null,
          updated_at: clockOutTime,
        })
        .eq('id', shiftId)
        .is('clock_out_at', null) // Only update if not already clocked out
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to clock out - shift not found or already clocked out');
      return data as Shift;
    }

    // Calculate work minutes
    const clockInTime = new Date(shift.clock_in_at);
    const clockOutDate = new Date(clockOutTime);
    const totalMinutes = Math.floor((clockOutDate.getTime() - clockInTime.getTime()) / 60000);

    // Note: Break deduction depends on BREAK_SETTINGS.BREAKS_ARE_PAID
    // For now, we always deduct breaks from work minutes as the paid/unpaid
    // status affects payment calculation, not hours tracking
    const workMinutes = totalMinutes - (shift.break_minutes || 0);

    // Standard day hours - configurable via SHIFT_SETTINGS.STANDARD_HOURS_PER_DAY
    // Default: 8 hours = 480 minutes
    const standardDayMinutes = 8 * 60; // TODO: Import from settings when converted to DB
    const standardMinutes = Math.min(workMinutes, standardDayMinutes);
    const overtimeMinutes = Math.max(0, workMinutes - standardDayMinutes);

    const { data, error } = await supabase
      .from('shifts')
      .update({
        clock_out_at: clockOutTime,
        clock_out_photo_path: photoPath || null,
        work_minutes: workMinutes,
        standard_minutes: standardMinutes,
        overtime_minutes: overtimeMinutes,
        updated_at: clockOutTime,
      })
      .eq('id', shiftId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to clock out - shift not found');
    return data as Shift;
  },

  // Add break time to a shift
  async addBreak(shiftId: string, breakMinutes: number): Promise<Shift> {
    // First get the current shift to add to existing break time
    const { data: shift, error: fetchError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .is('clock_out_at', null)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!shift) throw new Error('Shift not found or already clocked out');

    const currentBreakMinutes = shift.break_minutes || 0;
    const newBreakMinutes = currentBreakMinutes + breakMinutes;

    const { data, error } = await supabase
      .from('shifts')
      .update({
        break_minutes: newBreakMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  // Subscribe to shift changes
  subscribeToShifts(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Shift | null;
    old: { id: string } | null;
  }) => void) {
    return supabase
      .channel('shifts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Shift | null,
            old: payload.old as { id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

// Visitor type based on your table schema
export type Visitor = {
  id: string;
  full_name: string;
  purpose: string;
  car_registration: string | null;
  company: string | null;
  host_employee_id: string | null;
  badge_number: string | null;
  sign_in_at: string;
  sign_out_at: string | null;
  sign_in_photo_path: string | null;
  sign_out_photo_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Visitor with host employee details
export type VisitorWithHost = Visitor & {
  host_employee?: Employee | null;
};

// Visitor CRUD operations
export const visitorQueries = {
  // Get all visitors (for back office)
  async getVisitors(): Promise<VisitorWithHost[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        host_employee:employees(*)
      `)
      .order('sign_in_at', { ascending: false });
    if (error) throw error;
    return data as VisitorWithHost[];
  },

  // Get visitors for today
  async getTodaysVisitors(): Promise<VisitorWithHost[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        host_employee:employees(*)
      `)
      .gte('sign_in_at', today.toISOString())
      .order('sign_in_at', { ascending: false });
    if (error) throw error;
    return data as VisitorWithHost[];
  },

  // Get currently signed in visitors (no sign_out_at)
  async getActiveVisitors(): Promise<VisitorWithHost[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        host_employee:employees(*)
      `)
      .is('sign_out_at', null)
      .order('sign_in_at', { ascending: false });
    if (error) throw error;
    return data as VisitorWithHost[];
  },

  // Sign in a visitor
  async signInVisitor(visitorData: {
    full_name: string;
    purpose: string;
    car_registration?: string;
    company?: string;
    host_employee_id?: string;
    badge_number?: string;
    sign_in_photo_path?: string;
    notes?: string;
  }): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .insert([{
        full_name: visitorData.full_name,
        purpose: visitorData.purpose,
        car_registration: visitorData.car_registration || null,
        company: visitorData.company || null,
        host_employee_id: visitorData.host_employee_id || null,
        badge_number: visitorData.badge_number || null,
        sign_in_photo_path: visitorData.sign_in_photo_path || null,
        notes: visitorData.notes || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data as Visitor;
  },

  // Sign out a visitor
  async signOutVisitor(visitorId: string, photoPath?: string): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        sign_out_at: new Date().toISOString(),
        sign_out_photo_path: photoPath || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', visitorId)
      .select()
      .single();
    if (error) throw error;
    return data as Visitor;
  },

  // Get visitor by ID
  async getVisitor(id: string): Promise<VisitorWithHost> {
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        *,
        host_employee:employees(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as VisitorWithHost;
  },

  // Update visitor
  async updateVisitor(id: string, updates: Partial<Omit<Visitor, 'id' | 'created_at'>>): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Visitor;
  },

  // Delete visitor
  async deleteVisitor(id: string): Promise<void> {
    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Subscribe to visitor changes
  subscribeToVisitors(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Visitor | null;
    old: { id: string } | null;
  }) => void) {
    return supabase
      .channel('visitors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Visitor | null,
            old: payload.old as { id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

// Leave Request type
export type LeaveRequest = {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

// Leave request with employee details
export type LeaveRequestWithEmployee = LeaveRequest & {
  employee?: Employee;
};

// Leave Request CRUD operations
export const leaveRequestQueries = {
  // Get all leave requests (admin)
  async getAllLeaveRequests(): Promise<LeaveRequestWithEmployee[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeaveRequestWithEmployee[];
  },

  // Get leave requests for an employee
  async getLeaveRequestsForEmployee(employeeId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeaveRequest[];
  },

  // Get leave requests by status
  async getLeaveRequestsByStatus(status: LeaveRequest['status']): Promise<LeaveRequestWithEmployee[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as LeaveRequestWithEmployee[];
  },

  // Get pending leave requests count
  async getPendingCount(): Promise<number> {
    const { count, error } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (error) throw error;
    return count || 0;
  },

  // Create leave request
  async createLeaveRequest(data: {
    employee_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<LeaveRequest> {
    const { data: result, error } = await supabase
      .from('leave_requests')
      .insert([{
        employee_id: data.employee_id,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason || null,
        status: 'pending',
      }])
      .select()
      .single();
    if (error) throw error;
    return result as LeaveRequest;
  },

  // Approve leave request
  async approveLeaveRequest(id: string, approvedBy: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LeaveRequest;
  },

  // Reject leave request
  async rejectLeaveRequest(id: string, reason?: string): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LeaveRequest;
  },

  // Get approved leave for date range (for calendar display)
  async getApprovedLeaveForDateRange(startDate: string, endDate: string): Promise<LeaveRequestWithEmployee[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('status', 'approved')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .order('start_date', { ascending: true });
    if (error) throw error;
    return data as LeaveRequestWithEmployee[];
  },

  // Subscribe to leave request changes
  subscribeToLeaveRequests(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: LeaveRequest | null;
    old: { id: string } | null;
  }) => void) {
    return supabase
      .channel('leave-requests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as LeaveRequest | null,
            old: payload.old as { id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

// Auth/PIN operations
export const authQueries = {
  // Hash PIN using SHA256 with salt (must match SetPin.tsx)
  async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'timetracker-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Verify employee PIN - hashes input and compares with stored hash
  async verifyEmployeePin(employeeId: string, pin: string): Promise<boolean> {
    // Get the profile linked to this employee
    const { data, error } = await supabase
      .from('profiles')
      .select('pin_hash')
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      console.error('PIN verification error:', error);
      return false;
    }

    if (!data?.pin_hash) {
      console.error('No PIN set for this employee');
      return false;
    }

    // Hash the entered PIN and compare with stored hash
    const hashedPin = await this.hashPin(pin);
    return data.pin_hash === hashedPin;
  },

  // Set employee PIN (hashes before storing)
  async setEmployeePin(employeeId: string, pin: string): Promise<boolean> {
    const hashedPin = await this.hashPin(pin);
    const { error } = await supabase
      .from('profiles')
      .update({ pin_hash: hashedPin, updated_at: new Date().toISOString() })
      .eq('employee_id', employeeId);

    return !error;
  },
};

// Profile type based on your table schema
export type Profile = {
  user_id: string;
  full_name: string;
  role: 'admin' | 'employee';
  employee_id: string | null;
  pin_hash: string | null;
  approval_status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
};

// Profile CRUD operations for user management
export const profileQueries = {
  // Fetch all profiles
  async getProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
  },

  // Fetch pending approval profiles (includes NULL values)
  async getPendingProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('approval_status.eq.pending,approval_status.is.null')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Profile[];
  },

  // Fetch profiles by approval status
  async getProfilesByStatus(status: 'pending' | 'approved' | 'denied') {
    let query = supabase
      .from('profiles')
      .select('*');

    if (status === 'pending') {
      // Include both 'pending' and NULL values for pending tab
      query = query.or('approval_status.eq.pending,approval_status.is.null');
    } else {
      query = query.eq('approval_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles by status:', error);
      throw error;
    }
    console.log(`Profiles with status ${status}:`, data);
    return data as Profile[];
    if (error) throw error;
    return data as Profile[];
  },

  // Approve a user and create employee record
  async approveUser(
    userId: string,
    employeeData: {
      full_name: string;
      employee_code: string;
      department: string;
      position: string;
      hourly_rate: number;
    }
  ) {
    // First create employee record
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert([{
        ...employeeData,
        status: 'active',
        profile_photo_path: null,
        address: null,
        bank_account: null,
      }])
      .select()
      .single();

    if (empError) throw empError;

    // Then update profile with employee_id and approval status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        approval_status: 'approved',
        employee_id: employee.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    return employee as Employee;
  },

  // Deny a user
  async denyUser(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        approval_status: 'denied',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Subscribe to profile changes
  subscribeToProfiles(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Profile | null;
    old: { user_id: string } | null;
  }) => void) {
    return supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Profile | null,
            old: payload.old as { user_id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

// Invoice type based on your table schema
export type Invoice = {
  id: string;
  employee_id: string;
  invoice_number: string;
  week_number: number;
  year: number;
  week_start: string;
  week_end: string;
  total_hours: number;
  hourly_rate: number;
  total_amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  company_name: string;
  company_address: string;
  company_website: string;
  company_email: string;
  company_phone: string;
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  updated_at: string;
};

// Invoice with employee details for display
export type InvoiceWithEmployee = Invoice & {
  employee?: Employee;
};

// Helper functions for date/week calculations
export const dateHelpers = {
  // Get week number from a date
  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  },

  // Get start and end dates of a week
  getWeekDates(year: number, weekNumber: number): { start: Date; end: Date } {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const startOfWeek1 = new Date(jan4);
    startOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

    const start = new Date(startOfWeek1);
    start.setDate(startOfWeek1.getDate() + (weekNumber - 1) * 7);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return { start, end };
  },

  // Format date as YYYY-MM-DD
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  },
};

// Invoice CRUD operations
export const invoiceQueries = {
  // Get shifts for a date range (for calculating hours)
  async getShiftsForDateRange(employeeId: string, startDate: string, endDate: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('clock_in_at', `${startDate}T00:00:00`)
      .lte('clock_in_at', `${endDate}T23:59:59`)
      .not('clock_out_at', 'is', null)
      .order('clock_in_at', { ascending: true });

    if (error) throw error;
    return data as Shift[];
  },

  // Get all shifts grouped by date for invoice display
  async getShiftsByDateForInvoice(employeeId: string, startDate: string, endDate: string) {
    const shifts = await this.getShiftsForDateRange(employeeId, startDate, endDate);

    // Group shifts by date and calculate hours
    const shiftsByDate: { date: string; hours: number }[] = [];
    const dateMap = new Map<string, number>();

    shifts.forEach(shift => {
      const date = shift.clock_in_at.split('T')[0];
      const hours = (shift.work_minutes || 0) / 60;
      dateMap.set(date, (dateMap.get(date) || 0) + hours);
    });

    dateMap.forEach((hours, date) => {
      shiftsByDate.push({ date, hours: Math.round(hours * 100) / 100 });
    });

    shiftsByDate.sort((a, b) => a.date.localeCompare(b.date));
    return shiftsByDate;
  },

  // Calculate total hours for a date range
  async calculateTotalHours(employeeId: string, startDate: string, endDate: string): Promise<number> {
    const shifts = await this.getShiftsForDateRange(employeeId, startDate, endDate);
    const totalMinutes = shifts.reduce((sum, shift) => sum + (shift.work_minutes || 0), 0);
    return Math.round((totalMinutes / 60) * 100) / 100;
  },

  // Generate invoice number
  generateInvoiceNumber(employeeCode: string, year: number, weekNumber: number): string {
    const initials = employeeCode.replace(/[^A-Z]/gi, '').slice(0, 2).toUpperCase() || 'XX';
    return `${initials} W${weekNumber}`;
  },

  // Get invoices for an employee
  async getInvoicesForEmployee(employeeId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  },

  // Get all invoices (admin)
  async getAllInvoices(): Promise<InvoiceWithEmployee[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        employee:employees(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as InvoiceWithEmployee[];
  },

  // Get invoices by status
  async getInvoicesByStatus(status: Invoice['status']): Promise<InvoiceWithEmployee[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as InvoiceWithEmployee[];
  },

  // Get pending invoices grouped by week
  async getPendingInvoicesGroupedByWeek(): Promise<Map<string, InvoiceWithEmployee[]>> {
    const invoices = await this.getInvoicesByStatus('pending');
    const grouped = new Map<string, InvoiceWithEmployee[]>();

    invoices.forEach(invoice => {
      const key = `${invoice.year}-W${invoice.week_number}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(invoice);
    });

    return grouped;
  },

  // Get single invoice
  async getInvoice(id: string): Promise<InvoiceWithEmployee> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as InvoiceWithEmployee;
  },

  // Check if invoice exists for week
  async invoiceExistsForWeek(employeeId: string, year: number, weekNumber: number): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .maybeSingle();

    if (error) throw error;
    return data as Invoice | null;
  },

  // Create invoice
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Omit<Invoice, 'id' | 'created_at'>>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  // Submit invoice for approval
  async submitInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
  },

  // Approve invoice
  async approveInvoice(id: string, approvedBy: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    });
  },

  // Reject invoice
  async rejectInvoice(id: string, notes?: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'rejected',
      notes: notes || null,
    });
  },

  // Delete invoice (only drafts)
  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('status', 'draft');

    if (error) throw error;
  },

  // Get weeks with hours for an employee (for invoice generation dropdown)
  async getWeeksWithHours(employeeId: string): Promise<{ year: number; week: number; hours: number; start: string; end: string }[]> {
    // Get all completed shifts for this employee
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('clock_in_at, work_minutes')
      .eq('employee_id', employeeId)
      .not('clock_out_at', 'is', null)
      .not('work_minutes', 'is', null)
      .order('clock_in_at', { ascending: false });

    if (error) throw error;

    const weekMap = new Map<string, { year: number; week: number; hours: number }>();

    (shifts || []).forEach(shift => {
      const date = new Date(shift.clock_in_at);
      const year = date.getFullYear();
      const week = dateHelpers.getWeekNumber(date);
      const key = `${year}-${week}`;

      if (!weekMap.has(key)) {
        weekMap.set(key, { year, week, hours: 0 });
      }
      weekMap.get(key)!.hours += (shift.work_minutes || 0) / 60;
    });

    const result = Array.from(weekMap.values()).map(w => {
      const dates = dateHelpers.getWeekDates(w.year, w.week);
      return {
        ...w,
        hours: Math.round(w.hours * 100) / 100,
        start: dateHelpers.formatDate(dates.start),
        end: dateHelpers.formatDate(dates.end),
      };
    });

    // Sort by year and week descending
    result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    return result;
  },

  // Subscribe to invoice changes
  subscribeToInvoices(callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Invoice | null;
    old: { id: string } | null;
  }) => void) {
    return supabase
      .channel('invoices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Invoice | null,
            old: payload.old as { id: string } | null,
          });
        }
      )
      .subscribe();
  },
};

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
      invoices: {
        Row: {
          id: string;
          employee_id: string;
          invoice_number: string;
          week_number: number;
          year: number;
          week_start: string;
          week_end: string;
          total_hours: number;
          hourly_rate: number;
          total_amount: number;
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          company_name: string;
          company_address: string;
          company_website: string;
          company_email: string;
          company_phone: string;
          notes: string | null;
          created_at: string;
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          invoice_number: string;
          week_number: number;
          year: number;
          week_start?: string;
          week_end?: string;
          total_hours?: number;
          hourly_rate?: number;
          total_amount?: number;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          company_name: string;
          company_address: string;
          company_website: string;
          company_email: string;
          company_phone: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          employee_id?: string;
          invoice_number?: string;
          week_number?: number;
          year?: number;
          week_start?: string;
          week_end?: string;
          total_hours?: number;
          hourly_rate?: number;
          total_amount?: number;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          company_name?: string;
          company_address?: string;
          company_website?: string;
          company_email?: string;
          company_phone?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};
