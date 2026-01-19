import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Employee {
  id: string;
  full_name: string;
  department: string;
  position: string;
  profile_photo_path: string | null;
  hasOpenShift?: boolean;
}

interface EmployeeCardProps {
  employee: Employee;
  onSignIn: (employee: Employee) => void;
  onMySpace: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onSignIn, onMySpace }: EmployeeCardProps) {
  const initials = employee.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const isSignedIn = employee.hasOpenShift;

  return (
    <div className="employee-kiosk-card">
      <Avatar className="h-16 w-16">
        <AvatarImage src={employee.profile_photo_path || ''} />
        <AvatarFallback className="bg-primary/10 text-primary text-lg">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium text-foreground">{employee.full_name}</h3>
        <p className="text-xs text-muted-foreground">{employee.department}</p>
      </div>
      <div className="flex flex-col gap-2 w-full mt-2">
        <Button
          onClick={() => onSignIn(employee)}
          variant={isSignedIn ? 'destructive' : 'default'}
          className="w-full"
        >
          {isSignedIn ? 'Sign Out' : 'Sign In'}
        </Button>
        <Button
          onClick={() => onMySpace(employee)}
          variant="outline"
          className="w-full"
        >
          My Space
        </Button>
      </div>
    </div>
  );
}
