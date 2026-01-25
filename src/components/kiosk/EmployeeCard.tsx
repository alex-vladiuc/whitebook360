import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface OpenShift {
  id: string;
  clock_in_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  profile_photo_path: string | null;
  hasOpenShift?: boolean;
  openShift?: OpenShift | null;
}

interface EmployeeCardProps {
  employee: Employee;
  onSignIn: (employee: Employee) => void;
  onMySpace: (employee: Employee) => void;
}

// Helper to format hours worked
function formatHoursWorked(clockInAt: string): string {
  const clockIn = new Date(clockInAt);
  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();

  // Handle edge case where clock_in is in the future (shouldn't happen, but safety check)
  if (diffMs < 0) {
    return '0m';
  }

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
}

export function EmployeeCard({ employee, onSignIn, onMySpace }: EmployeeCardProps) {
  const [hoursWorked, setHoursWorked] = useState<string>('');

  const initials = employee.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const isSignedIn = employee.hasOpenShift;

  // Update hours worked every minute
  useEffect(() => {
    if (!isSignedIn || !employee.openShift?.clock_in_at) {
      setHoursWorked('');
      return;
    }

    const clockInAt = employee.openShift.clock_in_at;

    // Initial calculation
    setHoursWorked(formatHoursWorked(clockInAt));

    // Update every minute
    const interval = setInterval(() => {
      setHoursWorked(formatHoursWorked(clockInAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [isSignedIn, employee.openShift]);

  return (
    <div className="employee-kiosk-card">
      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
        <AvatarImage src={employee.profile_photo_path || ''} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm sm:text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium text-foreground text-sm sm:text-base">{employee.full_name}</h3>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{employee.department}</p>
        {isSignedIn && hoursWorked && (
          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-green-600 mt-1">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>Working: {hoursWorked}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2 w-full mt-1 sm:mt-2">
        <Button
          onClick={() => onSignIn(employee)}
          variant={isSignedIn ? 'destructive' : 'default'}
          className="w-full text-xs sm:text-sm h-8 sm:h-9"
        >
          {isSignedIn ? 'Sign Out' : 'Sign In'}
        </Button>
        <Button
          onClick={() => onMySpace(employee)}
          variant="outline"
          className="w-full text-xs sm:text-sm h-8 sm:h-9"
        >
          My Space
        </Button>
      </div>
    </div>
  );
}
