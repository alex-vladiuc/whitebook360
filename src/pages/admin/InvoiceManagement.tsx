import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Eye,
  Download,
  Send,
  X,
  Archive,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  invoiceQueries,
  employeeQueries,
  Invoice,
  InvoiceWithEmployee,
  Employee,
  dateHelpers,
} from '@/lib/supabase';
import { InvoicePreview } from '@/components/kiosk/InvoicePreview';
import { useAuthContext } from '@/contexts/AuthContext';

export default function InvoiceManagement() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedWeekForPreview, setSelectedWeekForPreview] = useState<string>('');
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewShifts, setPreviewShifts] = useState<{ date: string; hours: number }[]>([]);
  const [previewEmployeeData, setPreviewEmployeeData] = useState<Employee | null>(null);

  // Weeks with hours for employee
  const [weeksWithHours, setWeeksWithHours] = useState<
    { year: number; week: number; hours: number; start: string; end: string }[]
  >([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoicesData, employeesData] = await Promise.all([
          invoiceQueries.getAllInvoices(),
          employeeQueries.getActiveEmployees(),
        ]);
        setInvoices(invoicesData);
        setEmployees(employeesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to changes
    const subscription = invoiceQueries.subscribeToInvoices(async () => {
      const updated = await invoiceQueries.getAllInvoices();
      setInvoices(updated);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // When employee selected for preview, fetch their weeks
  useEffect(() => {
    const fetchWeeks = async () => {
      if (selectedEmployee && selectedEmployee !== 'all') {
        try {
          const weeks = await invoiceQueries.getWeeksWithHours(selectedEmployee);
          setWeeksWithHours(weeks);
          const emp = employees.find((e) => e.id === selectedEmployee);
          setPreviewEmployee(emp || null);
        } catch (err) {
          console.error('Error fetching weeks:', err);
        }
      } else {
        setWeeksWithHours([]);
        setPreviewEmployee(null);
      }
    };

    fetchWeeks();
    setSelectedWeekForPreview('');
  }, [selectedEmployee, employees]);

  // Group pending invoices by week
  const pendingInvoicesByWeek = useMemo(() => {
    const pending = invoices.filter((inv) => inv.status === 'pending');
    const grouped = new Map<string, InvoiceWithEmployee[]>();

    pending.forEach((invoice) => {
      const key = `Week ${invoice.week_number}/${invoice.year}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(invoice);
    });

    // Sort by year and week descending
    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const [aKey] = a;
      const [bKey] = b;
      const aMatch = aKey.match(/Week (\d+)\/(\d+)/);
      const bMatch = bKey.match(/Week (\d+)\/(\d+)/);
      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[2]);
        const bYear = parseInt(bMatch[2]);
        if (aYear !== bYear) return bYear - aYear;
        return parseInt(bMatch[1]) - parseInt(aMatch[1]);
      }
      return 0;
    });

    return new Map(sortedEntries);
  }, [invoices]);

  // Group approved invoices by week
  const approvedInvoicesByWeek = useMemo(() => {
    const approved = invoices.filter((inv) => inv.status === 'approved');
    const grouped = new Map<string, InvoiceWithEmployee[]>();

    approved.forEach((invoice) => {
      const key = `Week ${invoice.week_number}/${invoice.year}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(invoice);
    });

    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const aMatch = a[0].match(/Week (\d+)\/(\d+)/);
      const bMatch = b[0].match(/Week (\d+)\/(\d+)/);
      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[2]);
        const bYear = parseInt(bMatch[2]);
        if (aYear !== bYear) return bYear - aYear;
        return parseInt(bMatch[1]) - parseInt(aMatch[1]);
      }
      return 0;
    });

    return new Map(sortedEntries);
  }, [invoices]);

  // Group rejected invoices by week
  const rejectedInvoicesByWeek = useMemo(() => {
    const rejected = invoices.filter((inv) => inv.status === 'rejected');
    const grouped = new Map<string, InvoiceWithEmployee[]>();

    rejected.forEach((invoice) => {
      const key = `Week ${invoice.week_number}/${invoice.year}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(invoice);
    });

    const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
      const aMatch = a[0].match(/Week (\d+)\/(\d+)/);
      const bMatch = b[0].match(/Week (\d+)\/(\d+)/);
      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[2]);
        const bYear = parseInt(bMatch[2]);
        if (aYear !== bYear) return bYear - aYear;
        return parseInt(bMatch[1]) - parseInt(aMatch[1]);
      }
      return 0;
    });

    return new Map(sortedEntries);
  }, [invoices]);

  const pendingCount = invoices.filter((inv) => inv.status === 'pending').length;
  const approvedCount = invoices.filter((inv) => inv.status === 'approved').length;
  const rejectedCount = invoices.filter((inv) => inv.status === 'rejected').length;

  const handlePreviewInvoice = async (invoice: InvoiceWithEmployee) => {
    try {
      const shifts = await invoiceQueries.getShiftsByDateForInvoice(
        invoice.employee_id,
        invoice.week_start,
        invoice.week_end
      );
      setPreviewInvoice(invoice);
      setPreviewShifts(shifts);
      setPreviewEmployeeData(invoice.employee || null);
      setShowPreview(true);
    } catch (err) {
      console.error('Error loading invoice:', err);
      toast.error('Failed to load invoice');
    }
  };

  const handlePreviewNewInvoice = async () => {
    if (!selectedEmployee || selectedEmployee === 'all' || !selectedWeekForPreview || !previewEmployee) {
      toast.error('Please select an employee and week');
      return;
    }

    try {
      const [yearStr, weekStr] = selectedWeekForPreview.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      const { start, end } = dateHelpers.getWeekDates(year, week);
      const startStr = dateHelpers.formatDate(start);
      const endStr = dateHelpers.formatDate(end);

      const shifts = await invoiceQueries.getShiftsByDateForInvoice(
        selectedEmployee,
        startStr,
        endStr
      );
      const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);

      // Create a temporary invoice object for preview
      const tempInvoice: Invoice = {
        id: 'temp',
        employee_id: selectedEmployee,
        invoice_number: invoiceQueries.generateInvoiceNumber(
          previewEmployee.employee_code || previewEmployee.full_name,
          year,
          week
        ),
        week_number: week,
        year: year,
        week_start: startStr,
        week_end: endStr,
        total_hours: totalHours,
        hourly_rate: previewEmployee.hourly_rate || 0,
        total_amount: totalHours * (previewEmployee.hourly_rate || 0),
        status: 'draft',
        company_name: 'INSPIRA GROUP LTD',
        company_address: 'Manor Farm, Roxhill Rd\nBedford MK43 0QG',
        company_website: 'www.inspira.london',
        company_email: 'office@inspira.london',
        company_phone: '0800 048 7721',
        notes: null,
        created_at: new Date().toISOString(),
        submitted_at: null,
        approved_at: null,
        approved_by: null,
        updated_at: new Date().toISOString(),
      };

      setPreviewInvoice(tempInvoice);
      setPreviewShifts(shifts);
      setPreviewEmployeeData(previewEmployee);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generating preview:', err);
      toast.error('Failed to generate preview');
    }
  };

  const handleApprove = async () => {
    if (!previewInvoice || !user) return;

    try {
      await invoiceQueries.approveInvoice(previewInvoice.id, user.id);
      toast.success('Invoice approved!');
      setShowPreview(false);

      // Refresh invoices
      const updated = await invoiceQueries.getAllInvoices();
      setInvoices(updated);
    } catch (err) {
      console.error('Error approving invoice:', err);
      toast.error('Failed to approve invoice');
    }
  };

  const handleReject = async () => {
    if (!previewInvoice) return;

    try {
      await invoiceQueries.rejectInvoice(previewInvoice.id);
      toast.success('Invoice rejected');
      setShowPreview(false);

      // Refresh invoices
      const updated = await invoiceQueries.getAllInvoices();
      setInvoices(updated);
    } catch (err) {
      console.error('Error rejecting invoice:', err);
      toast.error('Failed to reject invoice');
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const clearFilter = () => {
    setSelectedEmployee('all');
    setSelectedWeekForPreview('');
  };

  // Filter invoices by selected employee
  const filteredPendingByWeek = useMemo(() => {
    if (selectedEmployee === 'all') {
      return pendingInvoicesByWeek;
    }

    const filtered = new Map<string, InvoiceWithEmployee[]>();
    pendingInvoicesByWeek.forEach((invs, key) => {
      const matching = invs.filter((inv) => inv.employee_id === selectedEmployee);
      if (matching.length > 0) {
        filtered.set(key, matching);
      }
    });
    return filtered;
  }, [pendingInvoicesByWeek, selectedEmployee]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Invoice Management</h1>
        <Button variant="outline" onClick={() => navigate('/admin/invoice-archive')}>
          <Archive className="h-4 w-4 mr-2" />
          View Archive
        </Button>
      </div>

      {/* Invoice Preview & Testing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Invoice Preview & Testing</CardTitle>
          <CardDescription>
            Preview any operative's invoice for any week with recorded work hours.
            {selectedEmployee !== 'all' && previewEmployee && (
              <span className="text-blue-600 ml-1">
                Showing only {previewEmployee.full_name}'s invoices.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-64">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-80">
              <Select
                value={selectedWeekForPreview}
                onValueChange={setSelectedWeekForPreview}
                disabled={!selectedEmployee || selectedEmployee === 'all'}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedEmployee === 'all'
                        ? 'Select employee first'
                        : 'Select a week'
                    }
                  />
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
              onClick={handlePreviewNewInvoice}
              disabled={!selectedEmployee || selectedEmployee === 'all' || !selectedWeekForPreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </Button>

            {selectedEmployee !== 'all' && (
              <Button variant="outline" onClick={clearFilter}>
                <X className="h-4 w-4 mr-2" />
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pending Invoices</CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {pendingCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {filteredPendingByWeek.size === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No pending invoices to review.
            </p>
          )}

          {Array.from(filteredPendingByWeek.entries()).map(([weekKey, weekInvoices]) => (
            <Card key={weekKey} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">{weekKey}</CardTitle>
                  <Badge variant="secondary">{weekInvoices.length} invoice{weekInvoices.length !== 1 ? 's' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.employee?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>£{invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Approved Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Approved Invoices</CardTitle>
            </div>
            <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
              {approvedCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {approvedInvoicesByWeek.size === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No approved invoices.
            </p>
          )}

          {Array.from(approvedInvoicesByWeek.entries()).map(([weekKey, weekInvoices]) => (
            <Card key={weekKey} className="border-dashed border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base font-semibold">{weekKey}</CardTitle>
                  <Badge className="bg-green-100 text-green-800">{weekInvoices.length} invoice{weekInvoices.length !== 1 ? 's' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.employee?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>£{invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Rejected Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Rejected Invoices</CardTitle>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {rejectedCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {rejectedInvoicesByWeek.size === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No rejected invoices.
            </p>
          )}

          {Array.from(rejectedInvoicesByWeek.entries()).map(([weekKey, weekInvoices]) => (
            <Card key={weekKey} className="border-dashed border-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base font-semibold">{weekKey}</CardTitle>
                  <Badge variant="destructive">{weekInvoices.length} invoice{weekInvoices.length !== 1 ? 's' : ''}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.employee?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>£{invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      {showPreview && previewInvoice && previewEmployeeData && (
        <InvoicePreview
          invoice={previewInvoice}
          employee={previewEmployeeData}
          shiftsByDate={previewShifts}
          onClose={() => {
            setShowPreview(false);
            setPreviewInvoice(null);
          }}
          onApprove={previewInvoice.status === 'pending' ? handleApprove : undefined}
          onReject={previewInvoice.status === 'pending' ? handleReject : undefined}
          mode={previewInvoice.status === 'pending' ? 'review' : 'preview'}
          isAdmin={true}
        />
      )}
    </div>
  );
}
