import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Edit2,
  User,
  CreditCard,
  Calendar,
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { employeeQueries, Employee, invoiceQueries, Invoice, dateHelpers, leaveRequestQueries, LeaveRequest } from '@/lib/supabase';
import { InvoicePreview } from './InvoicePreview';

interface MySpaceProps {
  employee: {
    id: string;
    full_name: string;
    department: string;
    position: string;
    profile_photo_path: string | null;
    address?: string | null;
    bank_account?: string | null;
  };
  onBack: () => void;
  isAdmin?: boolean;
}

// Helper to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to get calendar grid (includes padding days from prev/next months)
function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const grid: (Date | null)[] = [];

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  // Adjust so Monday is first (0)
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  // Add nulls for days before the month starts
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month, -startDay + i + 1);
    grid.push(prevDate);
  }

  // Add all days in the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    grid.push(new Date(year, month, day));
  }

  // Add days to fill the last week
  const remaining = 7 - (grid.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      grid.push(new Date(year, month + 1, i));
    }
  }

  return grid;
}

export function MySpace({ employee, onBack, isAdmin = false }: MySpaceProps) {
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for personal details
  const [address, setAddress] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Collapsible states
  const [invoiceOpen, setInvoiceOpen] = useState(true);
  const [weekOpen, setWeekOpen] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(true);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Leave request state
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Invoice state
  const [weeksWithHours, setWeeksWithHours] = useState<{ year: number; week: number; hours: number; start: string; end: string }[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewShifts, setPreviewShifts] = useState<{ date: string; hours: number }[]>([]);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Current week number
  const currentWeek = useMemo(() => getWeekNumber(new Date()), []);

  // Calendar grid
  const calendarGrid = useMemo(() => {
    return getCalendarGrid(calendarDate.getFullYear(), calendarDate.getMonth());
  }, [calendarDate]);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await employeeQueries.getEmployee(employee.id);
        setEmployeeData(data);

        // Parse bank account if exists
        if (data.bank_account) {
          const parts = data.bank_account.split(' ');
          if (parts.length >= 2) {
            setSortCode(parts[0]);
            setAccountNumber(parts[1]);
          }
        }
        setAddress(data.address || '');
      } catch (err) {
        console.error('Error fetching employee data:', err);
        toast.error('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employee.id]);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoadingInvoices(true);
        const [weeks, invoices] = await Promise.all([
          invoiceQueries.getWeeksWithHours(employee.id),
          invoiceQueries.getInvoicesForEmployee(employee.id),
        ]);
        setWeeksWithHours(weeks);
        setMyInvoices(invoices);
      } catch (err) {
        console.error('Error fetching invoice data:', err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoiceData();
  }, [employee.id]);

  // Fetch leave requests
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const requests = await leaveRequestQueries.getLeaveRequestsForEmployee(employee.id);
        setMyLeaveRequests(requests);
      } catch (err) {
        console.error('Error fetching leave requests:', err);
      }
    };

    fetchLeaveRequests();
  }, [employee.id]);

  const handleSavePersonalDetails = async () => {
    setIsSaving(true);
    try {
      const bankAccount = sortCode && accountNumber
        ? `${sortCode} ${accountNumber}`
        : null;

      await employeeQueries.updateEmployee(employee.id, {
        address: address || null,
        bank_account: bankAccount,
      });

      setIsEditingPersonal(false);
      toast.success('Personal details updated');

      // Update local state
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          address: address || null,
          bank_account: bankAccount,
        });
      }
    } catch (err) {
      console.error('Error saving personal details:', err);
      toast.error('Failed to save personal details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!leaveStartDate || !leaveEndDate) {
      toast.error('Please select start and end dates');
      return;
    }

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(leaveStartDate);
    const endDate = new Date(leaveEndDate);

    if (startDate < today) {
      toast.error('Start date cannot be in the past');
      return;
    }

    if (endDate < startDate) {
      toast.error('End date must be after start date');
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const newRequest = await leaveRequestQueries.createLeaveRequest({
        employee_id: employee.id,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        reason: leaveReason || undefined,
      });

      // Update local state
      setMyLeaveRequests((prev) => [newRequest, ...prev]);

      toast.success('Leave request submitted for approval');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
    } catch (err) {
      console.error('Error submitting leave request:', err);
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const getLeaveStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  // Get minimum date for leave (today)
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const handleGenerateInvoice = async () => {
    if (!selectedWeek || !employeeData) {
      toast.error('Please select a week');
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const [yearStr, weekStr] = selectedWeek.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);

      // Check if invoice already exists
      const existing = await invoiceQueries.invoiceExistsForWeek(employee.id, year, week);
      if (existing) {
        toast.error('An invoice already exists for this week');
        setIsGeneratingInvoice(false);
        return;
      }

      // Get week dates and shifts
      const { start, end } = dateHelpers.getWeekDates(year, week);
      const startStr = dateHelpers.formatDate(start);
      const endStr = dateHelpers.formatDate(end);

      const shifts = await invoiceQueries.getShiftsByDateForInvoice(employee.id, startStr, endStr);
      const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);

      // Create draft invoice
      const invoiceNumber = invoiceQueries.generateInvoiceNumber(
        employeeData.employee_code || employeeData.full_name,
        year,
        week
      );

      const newInvoice = await invoiceQueries.createInvoice({
        employee_id: employee.id,
        invoice_number: invoiceNumber,
        week_number: week,
        year: year,
        week_start: startStr,
        week_end: endStr,
        total_hours: totalHours,
        hourly_rate: employeeData.hourly_rate || 0,
        total_amount: totalHours * (employeeData.hourly_rate || 0),
        status: 'draft',
        company_name: 'INSPIRA GROUP LTD',
        company_address: 'Manor Farm, Roxhill Rd\nBedford MK43 0QG',
        company_website: 'www.inspira.london',
        company_email: 'office@inspira.london',
        company_phone: '0800 048 7721',
        notes: null,
        submitted_at: null,
        approved_at: null,
        approved_by: null,
      });

      // Show preview
      setPreviewInvoice(newInvoice);
      setPreviewShifts(shifts);
      setShowInvoicePreview(true);

      // Refresh invoices list
      const invoices = await invoiceQueries.getInvoicesForEmployee(employee.id);
      setMyInvoices(invoices);

      toast.success('Invoice created! Review and submit for approval.');
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handlePreviewInvoice = async (invoice: Invoice) => {
    try {
      const shifts = await invoiceQueries.getShiftsByDateForInvoice(
        invoice.employee_id,
        invoice.week_start,
        invoice.week_end
      );
      setPreviewInvoice(invoice);
      setPreviewShifts(shifts);
      setShowInvoicePreview(true);
    } catch (err) {
      console.error('Error loading invoice:', err);
      toast.error('Failed to load invoice');
    }
  };

  const handleSubmitInvoice = async () => {
    if (!previewInvoice) return;

    try {
      await invoiceQueries.submitInvoice(previewInvoice.id);
      toast.success('Invoice submitted for approval!');
      setShowInvoicePreview(false);

      // Refresh invoices list
      const invoices = await invoiceQueries.getInvoicesForEmployee(employee.id);
      setMyInvoices(invoices);
    } catch (err) {
      console.error('Error submitting invoice:', err);
      toast.error('Failed to submit invoice');
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const isCurrentMonth = (date: Date | null): boolean => {
    if (!date) return false;
    return date.getMonth() === calendarDate.getMonth();
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold italic text-slate-800">My Space</h1>
            {isAdmin && (
              <span className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                ○ Admin Access
              </span>
            )}
          </div>
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Kiosk
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Personal Details Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Personal Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isEditingPersonal ? handleSavePersonalDetails() : setIsEditingPersonal(true)}
                  disabled={isSaving}
                >
                  {isEditingPersonal ? (
                    isSaving ? 'Saving...' : 'Save'
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <User className="h-4 w-4" />
                    Address Information
                  </div>
                  {isEditingPersonal ? (
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic pl-6">
                      {employeeData?.address || 'No address information added yet'}
                    </p>
                  )}
                </div>

                {/* Banking Details */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <CreditCard className="h-4 w-4" />
                    Banking Details
                  </div>
                  {isEditingPersonal ? (
                    <div className="pl-6 space-y-2">
                      <div className="flex gap-2">
                        <div className="w-32">
                          <Label className="text-xs text-muted-foreground">Sort Code</Label>
                          <Input
                            value={sortCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              const formatted = value.replace(/(\d{2})(?=\d)/g, '$1-').slice(0, 8);
                              setSortCode(formatted);
                            }}
                            placeholder="00-00-00"
                            maxLength={8}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Account Number</Label>
                          <Input
                            value={accountNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                              setAccountNumber(value);
                            }}
                            placeholder="12345678"
                            maxLength={8}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic pl-6">
                      {employeeData?.bank_account || 'No banking details added yet'}
                    </p>
                  )}
                </div>

                {isEditingPersonal && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingPersonal(false);
                        // Reset to original values
                        setAddress(employeeData?.address || '');
                        if (employeeData?.bank_account) {
                          const parts = employeeData.bank_account.split(' ');
                          setSortCode(parts[0] || '');
                          setAccountNumber(parts[1] || '');
                        } else {
                          setSortCode('');
                          setAccountNumber('');
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Week Numbers Card */}
            <Collapsible open={weekOpen} onOpenChange={setWeekOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week Numbers 2026
                  </CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {weekOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {weekOpen ? 'Collapse' : 'Expand'}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-10 gap-2">
                      {Array.from({ length: 53 }, (_, i) => i + 1).map((week) => (
                        <Button
                          key={week}
                          variant={week === currentWeek ? 'default' : 'outline'}
                          size="sm"
                          className={`h-9 ${week === currentWeek ? 'bg-primary text-primary-foreground' : ''}`}
                        >
                          W{week}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Current Week: <span className="text-primary font-semibold">W{currentWeek}</span>
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Request Leave Card */}
            <Collapsible open={leaveOpen} onOpenChange={setLeaveOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">Request Leave</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {leaveOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {leaveOpen ? 'Collapse' : 'Expand'}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={leaveStartDate}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          min={minDate}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          min={leaveStartDate || minDate}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Reason (Optional)</Label>
                      <textarea
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="Brief reason for leave..."
                        rows={3}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSubmitLeave}
                      disabled={isSubmittingLeave}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isSubmittingLeave ? 'Submitting...' : 'Submit Request'}
                    </Button>

                    {/* My Leave Requests List */}
                    {myLeaveRequests.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">My Leave Requests</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {myLeaveRequests.map((request) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {new Date(request.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(request.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                {request.reason && (
                                  <p className="text-xs text-muted-foreground">{request.reason}</p>
                                )}
                              </div>
                              {getLeaveStatusBadge(request.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Invoice Generator Card */}
            <Collapsible open={invoiceOpen} onOpenChange={setInvoiceOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">Invoice Generator</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {invoiceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {invoiceOpen ? 'Collapse' : 'Expand'}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Week Selector */}
                    <div className="space-y-2">
                      <Label>Select Week</Label>
                      <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a week with hours" />
                        </SelectTrigger>
                        <SelectContent>
                          {weeksWithHours.length === 0 && (
                            <SelectItem value="none" disabled>
                              No weeks with recorded hours
                            </SelectItem>
                          )}
                          {weeksWithHours.map((w) => {
                            const startDate = new Date(w.start);
                            const endDate = new Date(w.end);
                            const label = `Week ${w.week}, ${w.year} (${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}) - ${w.hours.toFixed(1)}h`;
                            return (
                              <SelectItem key={`${w.year}-W${w.week}`} value={`${w.year}-W${w.week}`}>
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateInvoice}
                      disabled={!selectedWeek || isGeneratingInvoice}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                    </Button>

                    {/* My Invoices List */}
                    {myInvoices.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">My Invoices</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {myInvoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <div>
                                  <p className="text-sm font-medium">{invoice.invoice_number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Week {invoice.week_number}, {invoice.year} • £{invoice.total_amount.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(invoice.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePreviewInvoice(invoice)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {myInvoices.length === 0 && !loadingInvoices && (
                      <p className="text-sm text-center text-muted-foreground py-4">
                        No invoices yet. Generate your first invoice above!
                      </p>
                    )}

                    {loadingInvoices && (
                      <p className="text-sm text-center text-muted-foreground py-4">
                        Loading invoices...
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Project Calendar Card */}
            <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">Project Calendar</CardTitle>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {calendarOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {calendarOpen ? 'Collapse' : 'Expand'}
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="border rounded-lg p-4">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          <span className="font-semibold">Project Calendar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="font-medium min-w-[120px] text-center">
                            {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                          </span>
                          <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                            {day}
                          </div>
                        ))}

                        {/* Calendar days */}
                        {calendarGrid.map((date, index) => (
                          <div
                            key={index}
                            className={`text-center py-2 text-sm rounded cursor-pointer hover:bg-muted ${
                              !isCurrentMonth(date) ? 'text-muted-foreground/50' : ''
                            } ${isToday(date) ? 'bg-primary text-primary-foreground font-bold' : ''}`}
                          >
                            {date?.getDate()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && previewInvoice && employeeData && (
        <InvoicePreview
          invoice={previewInvoice}
          employee={employeeData}
          shiftsByDate={previewShifts}
          onClose={() => {
            setShowInvoicePreview(false);
            setPreviewInvoice(null);
          }}
          onSubmit={previewInvoice.status === 'draft' ? handleSubmitInvoice : undefined}
          mode={previewInvoice.status === 'draft' ? 'create' : 'preview'}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
