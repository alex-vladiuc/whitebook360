import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogIn, LogOut, Clock, Calendar, User, Coffee, Timer } from 'lucide-react';

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

interface EmployeeDetailScreenProps {
  employee: Employee;
  onBack: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onBreak?: () => void;
}

function formatHoursWorked(clockInAt: string): { hours: number; display: string } {
  const clockIn = new Date(clockInAt);
  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = diffMins / 60;
  return {
    hours: Math.round(hours * 10) / 10,
    display: `${Math.floor(hours)}.${Math.round((hours % 1) * 10)}`
  };
}

function formatLastAction(clockInAt: string): { time: string; relative: string } {
  const clockIn = new Date(clockInAt);
  const now = new Date();
  const diffMs = now.getTime() - clockIn.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  const time = clockIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  let relative: string;
  if (diffMins < 1) {
    relative = 'less than a minute ago';
  } else if (diffMins < 60) {
    relative = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(diffMins / 60);
    relative = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  return { time, relative };
}

export function EmployeeDetailScreen({
  employee,
  onBack,
  onSignIn,
  onSignOut,
  onBreak
}: EmployeeDetailScreenProps) {
  const [hoursWorked, setHoursWorked] = useState({ hours: 0, display: '0.0' });
  const [lastAction, setLastAction] = useState({ time: '', relative: '' });

  const isSignedIn = employee.hasOpenShift;
  const initials = employee.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!isSignedIn || !employee.openShift?.clock_in_at) {
      setHoursWorked({ hours: 0, display: '0.0' });
      return;
    }

    const clockInAt = employee.openShift.clock_in_at;
    setHoursWorked(formatHoursWorked(clockInAt));
    setLastAction(formatLastAction(clockInAt));

    const interval = setInterval(() => {
      setHoursWorked(formatHoursWorked(clockInAt));
      setLastAction(formatLastAction(clockInAt));
    }, 60000);

    return () => clearInterval(interval);
  }, [isSignedIn, employee.openShift]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50 p-6 overflow-auto">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack} className="mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Kiosk
      </Button>

      {/* Employee Name & Position */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">{employee.full_name.split(' ')[0]}</h1>
        <p className="text-lg text-slate-500">{employee.position}</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
        {/* Current Status Card */}
        <div className={`rounded-2xl p-6 ${isSignedIn ? 'bg-green-50 border-2 border-green-200' : 'bg-white border border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Current Status</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={employee.profile_photo_path || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-slate-800">{employee.full_name.split(' ')[0]}</p>
                <p className="text-sm text-slate-500">{employee.department}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isSignedIn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full ${isSignedIn ? 'bg-green-500' : 'bg-slate-400'}`} />
              <span className="text-sm font-medium">
                {isSignedIn ? 'Currently Working' : 'Off Duty'}
              </span>
            </div>
          </div>

          {isSignedIn && employee.openShift?.clock_in_at && (
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Last action: {lastAction.time}</span>
                <span className="text-slate-400">({lastAction.relative})</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>Verified via camera</span>
              </div>
            </div>
          )}
        </div>

        {/* Work Time Card */}
        <div className="rounded-2xl p-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Today's Work Time</span>
            <span className="text-xs text-slate-400">(Break deducted)</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-xl bg-white flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-800">{hoursWorked.display}</p>
              <p className="text-sm text-slate-500">
                {isSignedIn ? 'hours worked so far' : 'total hours worked'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {isSignedIn ? (
              <>
                <Timer className="h-4 w-4 text-orange-500" />
                <span className="text-blue-600">Timer is running - you're currently signed in</span>
              </>
            ) : (
              <>
                <span className="text-lg">⏸️</span>
                <span className="text-slate-600">Ready to start your work day</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
        {isSignedIn ? (
          <>
            <Button
              onClick={onSignOut}
              className="w-64 h-16 text-lg bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
            {onBreak && (
              <Button
                onClick={onBreak}
                variant="outline"
                className="w-64 h-14 text-lg rounded-xl"
              >
                <Coffee className="h-5 w-5 mr-2" />
                Take a Break
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={onSignIn}
            className="w-64 h-16 text-lg bg-green-500 hover:bg-green-600 text-white rounded-xl"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
