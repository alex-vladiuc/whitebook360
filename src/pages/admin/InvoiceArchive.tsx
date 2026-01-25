import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ArrowLeft,
  Search,
  Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  invoiceQueries,
  employeeQueries,
  Invoice,
  InvoiceWithEmployee,
  Employee,
} from '@/lib/supabase';
import { InvoicePreview } from '@/components/kiosk/InvoicePreview';

export default function InvoiceArchive() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewShifts, setPreviewShifts] = useState<{ date: string; hours: number }[]>([]);
  const [previewEmployeeData, setPreviewEmployeeData] = useState<Employee | null>(null);

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
  }, []);

  // Get unique years from invoices
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    invoices.forEach((inv) => yearSet.add(inv.year));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [invoices]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          inv.invoice_number.toLowerCase().includes(search) ||
          inv.employee?.full_name.toLowerCase().includes(search) ||
          inv.total_amount.toString().includes(search);
        if (!matchesSearch) return false;
      }

      // Employee filter
      if (filterEmployee !== 'all' && inv.employee_id !== filterEmployee) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all' && inv.status !== filterStatus) {
        return false;
      }

      // Year filter
      if (filterYear !== 'all' && inv.year !== parseInt(filterYear)) {
        return false;
      }

      return true;
    });
  }, [invoices, searchTerm, filterEmployee, filterStatus, filterYear]);

  // Group filtered invoices by year and week
  const groupedInvoices = useMemo(() => {
    const grouped = new Map<string, InvoiceWithEmployee[]>();

    filteredInvoices.forEach((invoice) => {
      const key = `Week ${invoice.week_number}/${invoice.year}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(invoice);
    });

    // Sort by year and week descending
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
  }, [filteredInvoices]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEmployee('all');
    setFilterStatus('all');
    setFilterYear('all');
  };

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalHours = filteredInvoices.reduce((sum, inv) => sum + inv.total_hours, 0);

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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/invoice-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Invoice Archive</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">£{totalAmount.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Employee */}
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
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

            {/* Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Year */}
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Invoices</CardTitle>
          <CardDescription>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedInvoices.size === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No invoices found matching your filters.
            </p>
          )}

          {Array.from(groupedInvoices.entries()).map(([weekKey, weekInvoices]) => (
            <Card key={weekKey} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">{weekKey}</CardTitle>
                  <Badge variant="secondary">
                    {weekInvoices.length} invoice{weekInvoices.length !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline">
                    £{weekInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
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
                        <TableCell>{invoice.total_hours.toFixed(1)}h</TableCell>
                        <TableCell>£{invoice.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {new Date(invoice.created_at).toLocaleDateString('en-GB')}
                        </TableCell>
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
          mode="preview"
          isAdmin={true}
        />
      )}
    </div>
  );
}
