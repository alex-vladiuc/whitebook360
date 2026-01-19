import { useState, useMemo } from 'react';
import { Search, User, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LiveClock, DateDisplay } from '@/components/kiosk/LiveClock';
import { EmployeeCard } from '@/components/kiosk/EmployeeCard';
import { PinKeypad } from '@/components/kiosk/PinKeypad';
import { CameraCapture } from '@/components/kiosk/CameraCapture';
import { VisitorSignIn } from '@/components/kiosk/VisitorSignIn';
import { toast } from 'sonner';

// Mock data - will be replaced with Supabase queries
const mockEmployees = [
  {
    id: '1',
    full_name: 'John Baker',
    department: 'Engineering',
    position: 'Developer',
    employee_code: '1111',
    profile_photo_path: null,
    hasOpenShift: false,
  },
  {
    id: '2',
    full_name: 'Sarah Miller',
    department: 'Design',
    position: 'UI Designer',
    employee_code: '2222',
    profile_photo_path: null,
    hasOpenShift: true,
  },
  {
    id: '3',
    full_name: 'Mike Johnson',
    department: 'Operations',
    position: 'Manager',
    employee_code: '3333',
    profile_photo_path: null,
    hasOpenShift: false,
  },
];

type FlowStep = 'idle' | 'pin' | 'camera' | 'visitor';

interface SelectedEmployee {
  id: string;
  full_name: string;
  hasOpenShift: boolean;
}

export default function Kiosk() {
  const [searchQuery, setSearchQuery] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return mockEmployees;
    const query = searchQuery.toLowerCase();
    return mockEmployees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(query) ||
        emp.department.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSignInClick = (employee: typeof mockEmployees[0]) => {
    setSelectedEmployee({
      id: employee.id,
      full_name: employee.full_name,
      hasOpenShift: employee.hasOpenShift || false,
    });
    setPinError(null);
    setFlowStep('pin');
  };

  const handlePinSubmit = async (pin: string) => {
    setIsLoading(true);
    setPinError(null);

    // Simulate PIN verification (replace with real Supabase call)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock: Accept any 4-digit PIN for demo
    if (pin.length === 4) {
      setIsLoading(false);
      setFlowStep('camera');
    } else {
      setPinError('Invalid PIN. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCameraCapture = async (imageBlob: Blob) => {
    setIsLoading(true);

    // Simulate upload and clock in/out (replace with real Supabase call)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const action = selectedEmployee?.hasOpenShift ? 'signed out' : 'signed in';
    toast.success(`${selectedEmployee?.full_name} ${action} successfully!`);
    
    setFlowStep('idle');
    setSelectedEmployee(null);
    setIsLoading(false);
  };

  const handleVisitorSubmit = async (data: { name: string; purpose: string; carReg: string }) => {
    setIsLoading(true);

    // Simulate visitor sign in
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast.success(`Welcome, ${data.name}!`);
    setFlowStep('idle');
    setIsLoading(false);
  };

  const handleMySpace = (employee: typeof mockEmployees[0]) => {
    toast.info('My Space feature coming soon!');
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
      <div className="p-6 flex justify-center">
        <Card className="inline-flex items-center gap-4 px-6 py-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">TimeTracker Pro</h1>
            <p className="text-sm text-muted-foreground">Select Your Profile</p>
          </div>
        </Card>
      </div>

      {/* Date & Time */}
      <div className="text-center space-y-2 mb-8">
        <DateDisplay />
        <LiveClock />
      </div>

      {/* Search Bar */}
      <div className="px-6 max-w-md mx-auto w-full mb-8">
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
      <div className="flex-1 px-6 pb-8">
        <div className="flex flex-wrap justify-center gap-4">
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
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Visitor</h3>
              <p className="text-xs text-muted-foreground">Sign in as guest</p>
            </div>
            <Button variant="outline" className="w-full mt-2">
              Sign In
            </Button>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 TimeTracker Pro • All rights reserved
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
    </div>
  );
}
