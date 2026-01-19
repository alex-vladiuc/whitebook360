import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock leave data
const mockLeaveRequests = [
  { date: new Date(2026, 0, 15), status: 'approved', employee: 'John Baker' },
  { date: new Date(2026, 0, 16), status: 'approved', employee: 'John Baker' },
  { date: new Date(2026, 0, 22), status: 'pending', employee: 'Sarah Miller' },
  { date: new Date(2026, 0, 23), status: 'pending', employee: 'Sarah Miller' },
];

export default function LeaveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start from Sunday
  const startDay = monthStart.getDay();
  const paddedDays = Array(startDay).fill(null).concat(days);

  const getLeaveForDate = (date: Date) => {
    return mockLeaveRequests.filter((req) => isSameDay(req.date, date));
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <MainLayout>
      <div className="content-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Leave & Holiday Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage leave requests</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => toast.info('Request Leave form coming soon!')}>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Rejected</span>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const leaves = getLeaveForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasApproved = leaves.some((l) => l.status === 'approved');
                const hasPending = leaves.some((l) => l.status === 'pending');

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'aspect-square p-1 rounded-lg border border-transparent transition-all',
                      'hover:bg-muted flex flex-col items-center justify-start',
                      isToday(day) && 'bg-primary/5 font-semibold',
                      isSelected && 'ring-2 ring-primary border-primary',
                      !isSameMonth(day, currentDate) && 'text-muted-foreground'
                    )}
                  >
                    <span className="text-sm">{format(day, 'd')}</span>
                    {leaves.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {hasApproved && (
                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        )}
                        {hasPending && (
                          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
