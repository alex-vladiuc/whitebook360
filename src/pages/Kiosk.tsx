import { useState, useMemo, useEffect } from 'react';
import { Search, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LiveClock, DateDisplay } from '@/components/kiosk/LiveClock';
import { EmployeeCard } from '@/components/kiosk/EmployeeCard';
import { PinKeypad } from '@/components/kiosk/PinKeypad';
import { CameraCapture } from '@/components/kiosk/CameraCapture';
import { VisitorSignIn } from '@/components/kiosk/VisitorSignIn';
import { EmployeeDetailScreen } from '@/components/kiosk/EmployeeDetailScreen';
import { MySpace } from '@/components/kiosk/MySpace';
import { toast } from 'sonner';
import { employeeQueries, authQueries, shiftQueries, visitorQueries, Employee, Shift } from '@/lib/supabase';
import { KIOSK_SETTINGS, BREAK_SETTINGS, formatDuration } from '@/lib/settings';

type FlowStep = 'idle' | 'pin' | 'detail' | 'camera' | 'visitor' | 'myspace-pin' | 'myspace';

type EmployeeWithShift = Employee & {
  hasOpenShift: boolean;
  openShift?: Shift | null;
};

interface SelectedEmployee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  profile_photo_path: string | null;
  hasOpenShift: boolean;
  openShiftId?: string;
  openShift?: Shift | null;
}

export default function Kiosk() {
  const [employees, setEmployees] = useState<EmployeeWithShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees and their open shifts on mount
  useEffect(() => {
    const fetchEmployeesAndShifts = async () => {
      try {
        setLoading(true);
        // Fetch both employees and open shifts in parallel
        const [employeesData, openShifts] = await Promise.all([
          employeeQueries.getActiveEmployees(),
          shiftQueries.getAllOpenShifts(),
        ]);

        // Create a map of employee_id to open shift
        const openShiftMap = new Map<string, Shift>();
        openShifts.forEach((shift) => {
          openShiftMap.set(shift.employee_id, shift);
        });

        // Merge employees with their open shift status
        const employeesWithShift = employeesData.map((emp) => ({
          ...emp,
          hasOpenShift: openShiftMap.has(emp.id),
          openShift: openShiftMap.get(emp.id) || null,
        }));

        setEmployees(employeesWithShift);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeesAndShifts();

    // Subscribe to employee changes
    const employeeSubscription = employeeQueries.subscribeToEmployees((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newEmp = { ...payload.new, hasOpenShift: false, openShift: null };
        if (newEmp.status === 'active') {
          setEmployees((prev) => [...prev, newEmp]);
        }
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setEmployees((prev) => {
          if (payload.new!.status !== 'active') {
            return prev.filter((emp) => emp.id !== payload.new!.id);
          }
          const exists = prev.find((emp) => emp.id === payload.new!.id);
          if (exists) {
            return prev.map((emp) =>
              emp.id === payload.new!.id
                ? { ...payload.new!, hasOpenShift: emp.hasOpenShift, openShift: emp.openShift }
                : emp
            );
          }
          return [...prev, { ...payload.new!, hasOpenShift: false, openShift: null }];
        });
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setEmployees((prev) => prev.filter((emp) => emp.id !== payload.old!.id));
      }
    });

    // Subscribe to shift changes
    const shiftSubscription = shiftQueries.subscribeToShifts((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        // Someone clocked in
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === payload.new!.employee_id
              ? { ...emp, hasOpenShift: true, openShift: payload.new }
              : emp
          )
        );
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        // Check if this is a clock out (clock_out_at is now set)
        if (payload.new.clock_out_at) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === payload.new!.employee_id
                ? { ...emp, hasOpenShift: false, openShift: null }
                : emp
            )
          );
        }
      }
    });

    return () => {
      employeeSubscription.unsubscribe();
      shiftSubscription.unsubscribe();
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
    );
  }, [searchQuery, employees]);

  const handleSignInClick = (employee: EmployeeWithShift) => {
    setSelectedEmployee({
      id: employee.id,
      full_name: employee.full_name,
      department: employee.department,
      position: employee.position,
      profile_photo_path: employee.profile_photo_path,
      hasOpenShift: employee.hasOpenShift || false,
      openShiftId: employee.openShift?.id,
      openShift: employee.openShift,
    });
    setPinError(null);
    setFlowStep('pin');
  };

  const handlePinSubmit = async (pin: string) => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    setPinError(null);

    try {
      const isValid = await authQueries.verifyEmployeePin(selectedEmployee.id, pin);

      if (isValid) {
        setFlowStep('detail');
      } else {
        setPinError('Invalid PIN. Please try again.');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setPinError('Error verifying PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailSignIn = () => {
    setFlowStep('camera');
  };

  const handleDetailSignOut = () => {
    setFlowStep('camera');
  };

  const handleDetailBack = () => {
    setFlowStep('idle');
    setSelectedEmployee(null);
  };

  const handleBreak = async (breakMinutes: number) => {
    if (!selectedEmployee || !selectedEmployee.openShiftId) {
      toast.error('No active shift found');
      return;
    }

    setIsLoading(true);
    try {
      const updatedShift = await shiftQueries.addBreak(selectedEmployee.openShiftId, breakMinutes);

      // Update local state
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === selectedEmployee.id
            ? { ...emp, openShift: updatedShift }
            : emp
        )
      );

      // Update selected employee
      setSelectedEmployee((prev) =>
        prev ? { ...prev, openShift: updatedShift } : null
      );

      const breakType = BREAK_SETTINGS.BREAKS_ARE_PAID ? 'paid' : 'unpaid';
      toast.success(`${formatDuration(breakMinutes)} ${breakType} break recorded for ${selectedEmployee.full_name}`);
    } catch (err) {
      console.error('Break error:', err);
      toast.error('Failed to record break. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async (imageBlob: Blob) => {
    if (!selectedEmployee) return;

    setIsLoading(true);

    try {
      // TODO: Upload imageBlob to Supabase storage and get photoPath
      // For now, we skip the photo upload
      const photoPath = undefined;

      // Get device info
      const deviceInfo = `${navigator.userAgent.substring(0, 100)} - Kiosk`;

      if (selectedEmployee.hasOpenShift && selectedEmployee.openShiftId) {
        // Clock out
        await shiftQueries.clockOut(selectedEmployee.openShiftId, photoPath);

        // Immediately update local state
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === selectedEmployee.id
              ? { ...emp, hasOpenShift: false, openShift: null }
              : emp
          )
        );

        toast.success(`${selectedEmployee.full_name} signed out successfully!`);
      } else {
        // Clock in
        const newShift = await shiftQueries.clockIn(selectedEmployee.id, deviceInfo, photoPath);

        // Immediately update local state
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === selectedEmployee.id
              ? { ...emp, hasOpenShift: true, openShift: newShift }
              : emp
          )
        );

        toast.success(`${selectedEmployee.full_name} signed in successfully!`);
      }

      setFlowStep('idle');
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Clock in/out error:', err);
      toast.error(`Failed to ${selectedEmployee.hasOpenShift ? 'sign out' : 'sign in'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitorSubmit = async (data: { name: string; purpose: string; carReg: string }) => {
    setIsLoading(true);

    try {
      await visitorQueries.signInVisitor({
        full_name: data.name,
        purpose: data.purpose,
        car_registration: data.carReg || undefined,
      });

      toast.success(`Welcome, ${data.name}! You have been signed in.`);
      setFlowStep('idle');
    } catch (err) {
      console.error('Visitor sign in error:', err);
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMySpace = (employee: EmployeeWithShift) => {
    setSelectedEmployee({
      id: employee.id,
      full_name: employee.full_name,
      department: employee.department,
      position: employee.position,
      profile_photo_path: employee.profile_photo_path,
      hasOpenShift: employee.hasOpenShift || false,
      openShiftId: employee.openShift?.id,
      openShift: employee.openShift,
    });
    setPinError(null);
    setFlowStep('myspace-pin');
  };

  const handleMySpacePinSubmit = async (pin: string) => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    setPinError(null);

    try {
      const isValid = await authQueries.verifyEmployeePin(selectedEmployee.id, pin);

      if (isValid) {
        setFlowStep('myspace');
      } else {
        setPinError('Invalid PIN. Please try again.');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setPinError('Error verifying PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMySpaceBack = () => {
    setFlowStep('idle');
    setSelectedEmployee(null);
  };

  const cancelFlow = () => {
    setFlowStep('idle');
    setSelectedEmployee(null);
    setPinError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Card */}
      <div className="p-4 sm:p-6 flex justify-center">
        <Card className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary flex items-center justify-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{KIOSK_SETTINGS.APP_NAME}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{KIOSK_SETTINGS.APP_TAGLINE}</p>
          </div>
        </Card>
      </div>

      {/* Date & Time */}
      <div className="text-center space-y-1 sm:space-y-2 mb-6 sm:mb-8">
        <DateDisplay />
        <LiveClock />
      </div>

      {/* Search Bar */}
      <div className="px-4 sm:px-6 max-w-md mx-auto w-full mb-6 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or department…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Grid & Visitor Card */}
      <div className="flex-1 px-4 sm:px-6 pb-6 sm:pb-8">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center py-12">
            <p className="text-destructive">Error: {error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onSignIn={handleSignInClick}
                onMySpace={handleMySpace}
              />
            ))}

            {/* Visitor Sign In Card */}
            <Card
              className="employee-kiosk-card cursor-pointer hover:shadow-card-hover"
              onClick={() => setFlowStep('visitor')}
            >
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm sm:text-base">Visitor</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Sign in as guest</p>
              </div>
              <Button variant="outline" className="w-full mt-2 text-sm">
                Sign In
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 sm:py-6 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} {KIOSK_SETTINGS.FOOTER_COMPANY_NAME} • All rights reserved
        </p>
      </footer>

      {/* Modals */}
      {flowStep === 'pin' && selectedEmployee && (
        <PinKeypad
          title="Enter PIN"
          subtitle={`Signing ${selectedEmployee.hasOpenShift ? 'out' : 'in'} as ${selectedEmployee.full_name}`}
          onSubmit={handlePinSubmit}
          onCancel={cancelFlow}
          isLoading={isLoading}
          error={pinError}
        />
      )}

      {flowStep === 'detail' && selectedEmployee && (
        <EmployeeDetailScreen
          employee={{
            id: selectedEmployee.id,
            full_name: selectedEmployee.full_name,
            department: selectedEmployee.department,
            position: selectedEmployee.position,
            profile_photo_path: selectedEmployee.profile_photo_path,
            hasOpenShift: selectedEmployee.hasOpenShift,
            openShift: selectedEmployee.openShift,
          }}
          onBack={handleDetailBack}
          onSignIn={handleDetailSignIn}
          onSignOut={handleDetailSignOut}
          onBreak={handleBreak}
        />
      )}

      {flowStep === 'camera' && selectedEmployee && (
        <CameraCapture
          title={`Verification Photo - ${selectedEmployee.hasOpenShift ? 'Sign Out' : 'Sign In'}`}
          onCapture={handleCameraCapture}
          onCancel={cancelFlow}
          isLoading={isLoading}
        />
      )}

      {flowStep === 'visitor' && (
        <VisitorSignIn
          onSubmit={handleVisitorSubmit}
          onCancel={cancelFlow}
          isLoading={isLoading}
        />
      )}

      {flowStep === 'myspace-pin' && selectedEmployee && (
        <PinKeypad
          title="Enter PIN"
          subtitle={`Access My Space as ${selectedEmployee.full_name}`}
          onSubmit={handleMySpacePinSubmit}
          onCancel={cancelFlow}
          isLoading={isLoading}
          error={pinError}
        />
      )}

      {flowStep === 'myspace' && selectedEmployee && (
        <MySpace
          employee={{
            id: selectedEmployee.id,
            full_name: selectedEmployee.full_name,
            department: selectedEmployee.department,
            position: selectedEmployee.position,
            profile_photo_path: selectedEmployee.profile_photo_path,
          }}
          onBack={handleMySpaceBack}
        />
      )}
    </div>
  );
}
