import { useEffect, useState } from 'react';
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, Employee, Shift, employeeQueries, shiftQueries } from '@/lib/supabase';

type EmployeeWithHours = Employee & {
  weeklyMinutes: number;
  yearlyMinutes: number;
  currentShift: Shift | null;
  status: 'active' | 'inactive';
};

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to get start of current week (Monday)
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get start of year
function getStartOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

// Get employee status label
function getStatusLabel(employee: EmployeeWithHours): { label: string; type: 'working' | 'pending' | 'off' } {
  if (employee.currentShift) {
    return { label: 'Working', type: 'working' };
  }
  // Check if they have shifts today
  return { label: 'Off', type: 'off' };
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<EmployeeWithHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    weeklyHours: 0,
    yearlyHours: 0,
    currentlyWorking: 0,
    weeklyAvg: 0,
  });

  const currentWeek = getWeekNumber(new Date());

  useEffect(() => {
    loadDashboardData();

    // Subscribe to shift changes for real-time updates
    const subscription = shiftQueries.subscribeToShifts(() => {
      loadDashboardData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Fetch all employees
      const employeeData = await employeeQueries.getEmployees();

      // Fetch all open shifts
      const openShifts = await shiftQueries.getAllOpenShifts();
      const openShiftsByEmployee = new Map<string, Shift>();
      openShifts.forEach(shift => {
        openShiftsByEmployee.set(shift.employee_id, shift);
      });

      // Fetch shift data for weekly and yearly totals
      const startOfWeek = getStartOfWeek(new Date()).toISOString();
      const startOfYear = getStartOfYear(new Date()).toISOString();

      // Fetch weekly shifts
      const { data: weeklyShifts } = await supabase
        .from('shifts')
        .select('employee_id, work_minutes')
        .gte('clock_in_at', startOfWeek)
        .not('work_minutes', 'is', null);

      // Fetch yearly shifts
      const { data: yearlyShifts } = await supabase
        .from('shifts')
        .select('employee_id, work_minutes')
        .gte('clock_in_at', startOfYear)
        .not('work_minutes', 'is', null);

      // Calculate minutes per employee
      const weeklyMinutesByEmployee = new Map<string, number>();
      const yearlyMinutesByEmployee = new Map<string, number>();

      weeklyShifts?.forEach(shift => {
        const current = weeklyMinutesByEmployee.get(shift.employee_id) || 0;
        weeklyMinutesByEmployee.set(shift.employee_id, current + (shift.work_minutes || 0));
      });

      yearlyShifts?.forEach(shift => {
        const current = yearlyMinutesByEmployee.get(shift.employee_id) || 0;
        yearlyMinutesByEmployee.set(shift.employee_id, current + (shift.work_minutes || 0));
      });

      // Combine all data
      const employeesWithHours: EmployeeWithHours[] = employeeData.map(emp => ({
        ...emp,
        weeklyMinutes: weeklyMinutesByEmployee.get(emp.id) || 0,
        yearlyMinutes: yearlyMinutesByEmployee.get(emp.id) || 0,
        currentShift: openShiftsByEmployee.get(emp.id) || null,
      }));

      // Calculate stats
      const totalWeeklyMinutes = employeesWithHours.reduce((sum, e) => sum + e.weeklyMinutes, 0);
      const totalYearlyMinutes = employeesWithHours.reduce((sum, e) => sum + e.yearlyMinutes, 0);
      const currentlyWorking = employeesWithHours.filter(e => e.currentShift).length;
      const activeEmployees = employeesWithHours.filter(e => e.status === 'active').length;

      setStats({
        totalEmployees: activeEmployees,
        weeklyHours: Math.round(totalWeeklyMinutes / 60 * 10) / 10,
        yearlyHours: Math.round(totalYearlyMinutes / 60 * 10) / 10,
        currentlyWorking,
        weeklyAvg: activeEmployees > 0 ? Math.round((totalWeeklyMinutes / 60 / activeEmployees) * 10) / 10 : 0,
      });

      setEmployees(employeesWithHours);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees.toString(),
      subLabel: 'registered',
      icon: Users,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'This Week',
      value: `${stats.weeklyHours}h`,
      badge: `WN ${currentWeek}`,
      subLabel: 'total hours',
      icon: Clock,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Year Total',
      value: `${stats.yearlyHours}h`,
      subLabel: 'past 52 weeks',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Currently Working',
      value: stats.currentlyWorking.toString(),
      subLabel: 'employees',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Weekly Avg',
      value: `${stats.weeklyAvg}h`,
      subLabel: 'per week',
      icon: Clock,
      color: 'text-green-600 bg-green-100'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">HR Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Monitor employee attendance and work hours</p>
        </div>

        {/* Stats Grid - scrollable on mobile */}
        <div className="mb-6 md:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="bg-white min-w-0">
                  <CardContent className="p-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2 flex items-center justify-between gap-1">
                      <span className="truncate">{stat.label}</span>
                      {stat.badge && (
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium whitespace-nowrap">
                          {stat.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${stat.color}`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.subLabel}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Employee Status Grid */}
        <Card className="bg-white">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Employee Status</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {employees.map((employee) => {
                  const initials = employee.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();
                  const status = getStatusLabel(employee);
                  const weeklyHours = Math.round(employee.weeklyMinutes / 60);
                  const yearlyHours = Math.round(employee.yearlyMinutes / 60);

                  return (
                    <Card key={employee.id} className="bg-gray-50/80 border-0 shadow-sm">
                      <CardContent className="p-3 sm:p-5">
                        {/* Header row with avatar, name/dept, and status badge */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
                          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
                            {employee.profile_photo_path ? (
                              <AvatarImage src={employee.profile_photo_path} alt={employee.full_name} />
                            ) : null}
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm sm:text-base">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm sm:text-[15px] truncate">{employee.full_name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.department}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                            status.type === 'working' 
                              ? 'bg-green-100 text-green-700' 
                              : status.type === 'pending'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                              status.type === 'working' 
                                ? 'bg-green-500' 
                                : status.type === 'pending'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`} />
                            {status.label}
                          </span>
                        </div>

                        {/* Hours stats row */}
                        <div className="flex gap-2 sm:gap-3">
                          <div className="flex-1 bg-white rounded-lg py-2 px-3 sm:py-3 sm:px-4">
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Week {currentWeek}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Total H {weeklyHours}</p>
                          </div>
                          <div className="flex-1 bg-blue-50 rounded-lg py-2 px-3 sm:py-3 sm:px-4">
                            <p className="text-xs sm:text-sm font-medium text-blue-600">Year Total</p>
                            <p className="text-sm sm:text-base font-semibold text-blue-600">{yearlyHours}h</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
