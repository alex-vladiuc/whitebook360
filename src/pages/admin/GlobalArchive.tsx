import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Archive,
  Users,
  Clock,
  FileText,
  Eye,
  Download,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  supabase,
  employeeQueries,
  invoiceQueries,
  visitorQueries,
  Employee,
  Shift,
  Invoice,
  InvoiceWithEmployee,
  VisitorWithHost,
} from '@/lib/supabase';
import { InvoicePreview } from '@/components/kiosk/InvoicePreview';

// Extended types for archive data
type ShiftWithEmployee = Shift & {
  employee?: Employee;
};

type ArchiveStats = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalShifts: number;
  totalHoursWorked: number;
  totalInvoices: number;
  totalInvoiceAmount: number;
  approvedInvoices: number;
  pendingInvoices: number;
  totalVisitors: number;
  activeVisitors: number;
};

export default function GlobalArchive() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<ArchiveStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalShifts: 0,
    totalHoursWorked: 0,
    totalInvoices: 0,
    totalInvoiceAmount: 0,
    approvedInvoices: 0,
    pendingInvoices: 0,
    totalVisitors: 0,
    activeVisitors: 0,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftWithEmployee[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithEmployee[]>([]);
  const [visitors, setVisitors] = useState<VisitorWithHost[]>([]);

  // Preview state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewShifts, setPreviewShifts] = useState<{ date: string; hours: number }[]>([]);
  const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

  // Fetch all archive data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch employees
        const employeesData = await employeeQueries.getEmployees();
        setEmployees(employeesData);

        // Fetch all shifts with employee info
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select(`
            *,
            employee:employees(*)
          `)
          .order('clock_in_at', { ascending: false })
          .limit(100);

        if (shiftsError) throw shiftsError;
        setShifts(shiftsData as ShiftWithEmployee[]);

        // Fetch invoices
        const invoicesData = await invoiceQueries.getAllInvoices();
        setInvoices(invoicesData);

        // Fetch visitors
        const visitorsData = await visitorQueries.getVisitors();
        setVisitors(visitorsData);

        // Calculate stats
        const activeEmps = employeesData.filter((e) => e.status === 'active').length;
        const inactiveEmps = employeesData.filter((e) => e.status === 'inactive').length;
        const totalHours = (shiftsData || []).reduce(
          (sum, s) => sum + ((s.work_minutes || 0) / 60),
          0
        );
        const totalInvAmount = invoicesData.reduce((sum, inv) => sum + inv.total_amount, 0);
        const approvedInvs = invoicesData.filter((inv) => inv.status === 'approved').length;
        const pendingInvs = invoicesData.filter((inv) => inv.status === 'pending').length;
        const activeVisitorsCount = visitorsData.filter((v) => !v.sign_out_at).length;

        setStats({
          totalEmployees: employeesData.length,
          activeEmployees: activeEmps,
          inactiveEmployees: inactiveEmps,
          totalShifts: (shiftsData || []).length,
          totalHoursWorked: Math.round(totalHours * 100) / 100,
          totalInvoices: invoicesData.length,
          totalInvoiceAmount: totalInvAmount,
          approvedInvoices: approvedInvs,
          pendingInvoices: pendingInvs,
          totalVisitors: visitorsData.length,
          activeVisitors: activeVisitorsCount,
        });
      } catch (err) {
        console.error('Error fetching archive data:', err);
        toast.error('Failed to load archive data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePreviewInvoice = async (invoice: InvoiceWithEmployee) => {
    try {
      const shifts = await invoiceQueries.getShiftsByDateForInvoice(
        invoice.employee_id,
        invoice.week_start,
        invoice.week_end
      );
      setPreviewInvoice(invoice);
      setPreviewShifts(shifts);
      setPreviewEmployee(invoice.employee || null);
      setShowInvoicePreview(true);
    } catch (err) {
      console.error('Error loading invoice:', err);
      toast.error('Failed to load invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-muted-foreground">Loading archive...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Archive className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Global Archive</h1>
            <p className="text-sm text-muted-foreground">
              Complete historical records of all system data
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview Cards - Only showing most necessary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('employees')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-600" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Active Employees</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('invoices')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-emerald-600" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('invoices')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-green-600" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-2 text-green-600">
              £{stats.totalInvoiceAmount.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Invoice Total</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('visitors')}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <UserCheck className="h-5 w-5 text-teal-600" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-2">{stats.totalVisitors}</div>
            <p className="text-xs text-muted-foreground">Total Visitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different archive sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/invoice-archive')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">Invoice Archive</CardTitle>
                    <CardDescription>View all invoices with filters</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{stats.totalInvoices}</span>
                    <span className="text-sm text-muted-foreground ml-2">invoices</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/employee-management')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">Employee Records</CardTitle>
                    <CardDescription>Active and former employees</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{stats.totalEmployees}</span>
                    <span className="text-sm text-muted-foreground ml-2">employees</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Manage <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/dashboard')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-base">Shift History</CardTitle>
                    <CardDescription>All clock in/out records</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">{stats.totalHoursWorked.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground ml-2">hours logged</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Dashboard <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest shifts and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shifts.slice(0, 5).map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {shift.employee?.full_name || 'Unknown'} - Shift
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(shift.clock_in_at)}
                          {shift.clock_out_at && ` - ${formatDateTime(shift.clock_out_at)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {shift.work_minutes && (
                        <Badge variant="outline">{(shift.work_minutes / 60).toFixed(1)}h</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Employees</CardTitle>
                  <CardDescription>
                    {stats.activeEmployees} active, {stats.inactiveEmployees} inactive
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/employee-management')}>
                  Manage Employees
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell>{emp.employee_code}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>£{emp.hourly_rate.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>{formatDate(emp.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shift History</CardTitle>
                  <CardDescription>
                    {stats.totalShifts} total shifts, {stats.totalHoursWorked.toFixed(1)} hours worked
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
                  View Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Overtime</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {shift.employee?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDateTime(shift.clock_in_at)}</TableCell>
                      <TableCell>
                        {shift.clock_out_at ? formatDateTime(shift.clock_out_at) : (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shift.work_minutes ? `${(shift.work_minutes / 60).toFixed(1)}h` : '-'}
                      </TableCell>
                      <TableCell>{shift.break_minutes}m</TableCell>
                      <TableCell>
                        {shift.overtime_minutes ? `${(shift.overtime_minutes / 60).toFixed(1)}h` : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                        {shift.device_info}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Invoices</CardTitle>
                  <CardDescription>
                    {stats.approvedInvoices} approved, {stats.pendingInvoices} pending
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/invoice-archive')}>
                  Full Invoice Archive
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 20).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.employee?.full_name || 'Unknown'}</TableCell>
                      <TableCell>W{invoice.week_number}/{invoice.year}</TableCell>
                      <TableCell>{invoice.total_hours.toFixed(1)}h</TableCell>
                      <TableCell>£{invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {invoices.length > 20 && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => navigate('/admin/invoice-archive')}>
                    View All {invoices.length} Invoices
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visitor Log</CardTitle>
                  <CardDescription>
                    {stats.totalVisitors} total visitors, {stats.activeVisitors} currently on site
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/visitor-log')}>
                  Manage Visitors
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Signed In</TableHead>
                    <TableHead>Signed Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.slice(0, 20).map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.full_name}</TableCell>
                      <TableCell>{visitor.purpose}</TableCell>
                      <TableCell>{visitor.car_registration || '—'}</TableCell>
                      <TableCell>{visitor.host_employee?.full_name || '—'}</TableCell>
                      <TableCell>{formatDateTime(visitor.sign_in_at)}</TableCell>
                      <TableCell>
                        {visitor.sign_out_at ? formatDateTime(visitor.sign_out_at) : '—'}
                      </TableCell>
                      <TableCell>
                        {visitor.sign_out_at ? (
                          <Badge variant="secondary">Left</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">On Site</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {visitors.length > 20 && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => navigate('/visitor-log')}>
                    View All {visitors.length} Visitors
                  </Button>
                </div>
              )}
              {visitors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No visitor records found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Modal */}
      {showInvoicePreview && previewInvoice && previewEmployee && (
        <InvoicePreview
          invoice={previewInvoice}
          employee={previewEmployee}
          shiftsByDate={previewShifts}
          onClose={() => {
            setShowInvoicePreview(false);
            setPreviewInvoice(null);
          }}
          mode="preview"
          isAdmin={true}
        />
      )}
    </div>
  );
}
