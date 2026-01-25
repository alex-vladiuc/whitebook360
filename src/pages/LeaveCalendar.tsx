import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { leaveRequestQueries, LeaveRequestWithEmployee } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function LeaveCalendar() {
  const { user, profile } = useAuthContext();
  const isAdmin = profile?.role === 'admin';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  // Request leave dialog
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestStartDate, setRequestStartDate] = useState('');
  const [requestEndDate, setRequestEndDate] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        const requests = await leaveRequestQueries.getAllLeaveRequests();
        setLeaveRequests(requests);
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        toast.error('Failed to load leave requests');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();

    // Subscribe to changes
    const subscription = leaveRequestQueries.subscribeToLeaveRequests(async () => {
      const updated = await leaveRequestQueries.getAllLeaveRequests();
      setLeaveRequests(updated);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get calendar grid including days from prev/next month to fill the weeks
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get leave requests for a specific date
  const getLeaveForDate = (date: Date) => {
    return leaveRequests.filter((req) => {
      const startDate = new Date(req.start_date);
      const endDate = new Date(req.end_date);
      // Reset time to compare dates only
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const compareStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const compareEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return compareDate >= compareStart && compareDate <= compareEnd;
    });
  };

  // Get pending requests
  const pendingRequests = useMemo(() => {
    return leaveRequests.filter((req) => req.status === 'pending');
  }, [leaveRequests]);

  // Get leave for selected date
  const selectedDateLeave = useMemo(() => {
    if (!selectedDate) return [];
    return getLeaveForDate(selectedDate);
  }, [selectedDate, leaveRequests]);

  // Determine day background color based on bookings
  const getDayStyle = (date: Date) => {
    const leaves = getLeaveForDate(date);
    if (leaves.length === 0) return '';

    const approvedCount = leaves.filter(l => l.status === 'approved').length;

    if (approvedCount >= 2) {
      return 'bg-red-50 border-red-200'; // 2+ Bookings
    } else if (approvedCount === 1) {
      // Check if adjacent days also have bookings
      const prevDay = new Date(date);
      prevDay.setDate(prevDay.getDate() - 1);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const prevLeaves = getLeaveForDate(prevDay).filter(l => l.status === 'approved');
      const nextLeaves = getLeaveForDate(nextDay).filter(l => l.status === 'approved');

      if (prevLeaves.length > 0 || nextLeaves.length > 0) {
        return 'bg-yellow-50 border-yellow-200'; // Adjacent Bookings
      }
      return 'bg-green-50 border-green-200'; // Spaced Bookings
    }

    return '';
  };

  const handleApprove = async (id: string) => {
    if (!user) return;
    try {
      await leaveRequestQueries.approveLeaveRequest(id, user.id);
      toast.success('Leave request approved');
    } catch (err) {
      console.error('Error approving leave:', err);
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await leaveRequestQueries.rejectLeaveRequest(id);
      toast.success('Leave request rejected');
    } catch (err) {
      console.error('Error rejecting leave:', err);
      toast.error('Failed to reject leave request');
    }
  };

  const handleRequestLeave = async () => {
    if (!requestStartDate || !requestEndDate) {
      toast.error('Please select start and end dates');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(requestStartDate);
    const endDate = new Date(requestEndDate);

    if (startDate < today) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (endDate < startDate) {
      toast.error('End date must be after start date');
      return;
    }

    if (!profile?.employee_id) {
      toast.error('Employee not linked to profile');
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveRequestQueries.createLeaveRequest({
        employee_id: profile.employee_id,
        start_date: requestStartDate,
        end_date: requestEndDate,
        reason: requestReason || undefined,
      });

      toast.success('Leave request submitted for approval');
      setShowRequestDialog(false);
      setRequestStartDate('');
      setRequestEndDate('');
      setRequestReason('');
    } catch (err) {
      console.error('Error submitting leave request:', err);
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get minimum date for leave request (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Leave & Holiday Calendar</h1>
      </div>

      {/* Pending Requests Section (Admin Only) */}
      {isAdmin && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Approval</CardTitle>
                <CardDescription>{pendingRequests.length} request(s) awaiting approval</CardDescription>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 text-lg px-3 py-1">
                {pendingRequests.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.employee?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.reason || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApprove(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleReject(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Calendar Card */}
      <Card>
        <CardContent className="p-6">
          {/* Header with navigation and Request Leave button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <Button onClick={() => setShowRequestDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Day Color:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                <span>2+ Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                <span>Adjacent Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                <span>Spaced Bookings</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground font-medium">Status:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Rejected</span>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-12 text-muted-foreground">
              Loading leave requests...
            </div>
          )}

          {!loading && (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-muted-foreground py-3"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const leaves = getLeaveForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const hasApproved = leaves.some((l) => l.status === 'approved');
                  const hasPending = leaves.some((l) => l.status === 'pending');
                  const hasRejected = leaves.some((l) => l.status === 'rejected');
                  const dayStyle = getDayStyle(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'min-h-[100px] p-2 border border-gray-100 transition-all text-left align-top',
                        'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                        isSelected && 'ring-2 ring-primary ring-inset',
                        !isCurrentMonth && 'text-muted-foreground/50 bg-gray-50/50',
                        isToday(day) && 'font-bold',
                        dayStyle
                      )}
                    >
                      <span className={cn(
                        'text-sm',
                        isToday(day) && 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                      )}>
                        {format(day, 'd')}
                      </span>
                      {/* Status indicators */}
                      {leaves.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {hasApproved && (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                          {hasPending && (
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          )}
                          {hasRejected && (
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>
                      )}
                      {/* Show employee names on larger screens */}
                      <div className="hidden lg:block mt-1 space-y-1">
                        {leaves.slice(0, 2).map((leave) => (
                          <div
                            key={leave.id}
                            className={cn(
                              'text-xs truncate px-1 py-0.5 rounded',
                              leave.status === 'approved' && 'bg-green-100 text-green-800',
                              leave.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                              leave.status === 'rejected' && 'bg-red-100 text-red-800'
                            )}
                          >
                            {leave.employee?.full_name?.split(' ')[0] || 'Unknown'}
                          </div>
                        ))}
                        {leaves.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{leaves.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Details */}
              {selectedDate && selectedDateLeave.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold mb-3">
                    Leave on {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-2">
                    {selectedDateLeave.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <span className="font-medium">{leave.employee?.full_name || 'Unknown'}</span>
                          {leave.reason && (
                            <p className="text-sm text-muted-foreground">{leave.reason}</p>
                          )}
                        </div>
                        {getStatusBadge(leave.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Leave Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={requestStartDate}
                  onChange={(e) => setRequestStartDate(e.target.value)}
                  min={minDate}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={requestEndDate}
                  onChange={(e) => setRequestEndDate(e.target.value)}
                  min={requestStartDate || minDate}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Brief reason for leave..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestLeave} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
