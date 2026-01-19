import { Users, Clock, Calendar, TrendingUp, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MainLayout } from '@/components/layout/MainLayout';

// Mock data
const stats = [
  { label: 'Total Employees', value: '24', icon: Users, color: 'text-primary' },
  { label: 'This Week', value: '156h', subLabel: 'W4', icon: Clock, color: 'text-success' },
  { label: 'Year Total', value: '4,892h', icon: Calendar, color: 'text-warning' },
  { label: 'Currently Working', value: '8', icon: Briefcase, color: 'text-primary' },
  { label: 'Weekly Avg', value: '38.5h', icon: TrendingUp, color: 'text-muted-foreground' },
];

const currentlyWorking = [
  { name: 'John Baker', department: 'Engineering', signedInAt: '08:45' },
  { name: 'Sarah Miller', department: 'Design', signedInAt: '09:15' },
  { name: 'Mike Johnson', department: 'Operations', signedInAt: '09:30' },
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="content-container-wide">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of employee activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                        {stat.subLabel && (
                          <span className="text-xs ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                            {stat.subLabel}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Currently Working */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              Employee Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentlyWorking.map((employee) => {
                const initials = employee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('');
                return (
                  <div
                    key={employee.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="status-working">Working</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-card px-2 py-1 rounded border">
                          <span className="text-muted-foreground">In:</span>{' '}
                          <span className="font-medium">{employee.signedInAt}</span>
                        </div>
                        <div className="bg-card px-2 py-1 rounded border">
                          <span className="text-muted-foreground">Hours:</span>{' '}
                          <span className="font-medium">—</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
