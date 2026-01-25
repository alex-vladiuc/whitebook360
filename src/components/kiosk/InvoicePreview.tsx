import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  X,
  Download,
  FileEdit,
  Edit,
  Building2,
  Settings,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, invoiceQueries, dateHelpers, Employee } from '@/lib/supabase';

interface InvoicePreviewProps {
  invoice: Invoice | null;
  employee: Employee;
  shiftsByDate: { date: string; hours: number }[];
  onClose: () => void;
  onSubmit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isAdmin?: boolean;
  mode: 'preview' | 'create' | 'review';
}

export function InvoicePreview({
  invoice,
  employee,
  shiftsByDate,
  onClose,
  onSubmit,
  onApprove,
  onReject,
  isAdmin = false,
  mode,
}: InvoicePreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoice_number || '');
  const [companyName, setCompanyName] = useState(invoice?.company_name || 'INSPIRA GROUP LTD');
  const [companyAddress, setCompanyAddress] = useState(invoice?.company_address || 'Manor Farm, Roxhill Rd\nBedford MK43 0QG');
  const [companyWebsite, setCompanyWebsite] = useState(invoice?.company_website || 'www.inspira.london');
  const [companyEmail, setCompanyEmail] = useState(invoice?.company_email || 'office@inspira.london');
  const [companyPhone, setCompanyPhone] = useState(invoice?.company_phone || '0800 048 7721');
  const [hourlyRate, setHourlyRate] = useState(invoice?.hourly_rate || employee.hourly_rate || 0);
  const [isSaving, setIsSaving] = useState(false);

  const totalHours = shiftsByDate.reduce((sum, day) => sum + day.hours, 0);
  const totalAmount = totalHours * hourlyRate;

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate PDF (basic implementation - can be enhanced with jspdf later)
  const handleDownloadPDF = () => {
    // Create a printable version
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html lang="en">
            <head>
              <title>Invoice - ${invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-title { font-size: 36px; font-weight: bold; color: #333; }
                .week-number { color: #666; margin-top: 5px; }
                .divider { border-bottom: 2px solid #e5e7eb; margin: 20px 0; }
                .section { margin-bottom: 20px; }
                .label { color: #666; font-size: 12px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                th { background: #f9fafb; font-weight: 600; }
                .text-right { text-align: right; }
                .totals { margin-top: 20px; }
                .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
                .total-amount { font-size: 24px; font-weight: bold; color: #16a34a; }
                .tax-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-top: 30px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    toast.success('Opening print dialog...');
  };

  const handleSaveInvoice = async () => {
    if (!invoice) return;
    setIsSaving(true);
    try {
      await invoiceQueries.updateInvoice(invoice.id, {
        invoice_number: invoiceNumber,
        company_name: companyName,
        company_address: companyAddress,
        company_website: companyWebsite,
        company_email: companyEmail,
        company_phone: companyPhone,
        hourly_rate: hourlyRate,
        total_amount: totalHours * hourlyRate,
      });
      toast.success('Invoice updated');
      setEditingField(null);
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const issueDate = invoice?.created_at
    ? formatShortDate(invoice.created_at)
    : formatShortDate(new Date().toISOString());

  const periodStart = invoice?.week_start
    ? formatShortDate(invoice.week_start)
    : shiftsByDate.length > 0
    ? formatShortDate(shiftsByDate[0].date)
    : '';

  const periodEnd = invoice?.week_end
    ? formatShortDate(invoice.week_end)
    : shiftsByDate.length > 0
    ? formatShortDate(shiftsByDate[shiftsByDate.length - 1].date)
    : '';

  const weekNum = invoice?.week_number || dateHelpers.getWeekNumber(new Date());
  const year = invoice?.year || new Date().getFullYear();

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              <DialogTitle>Invoice Preview</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingField('invoice')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rename Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingField('invoice')}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingField('company')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Edit Company
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingField('rate')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Rate
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6" id="invoice-content">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                {employee.full_name}
              </h2>
              {employee.address && (
                <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                  {employee.address}
                </p>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-slate-800">INVOICE</h1>
              <p className="text-sm text-muted-foreground mt-1">#</p>
              <p className="text-lg font-semibold">Week {weekNum}, {year}</p>
            </div>
          </div>

          <div className="border-t-2 border-slate-200 my-6" />

          {/* Billed To & Dates */}
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Billed To:</p>
              <p className="font-semibold text-slate-800">{companyName}</p>
              <p className="text-sm text-slate-600 whitespace-pre-line">{companyAddress}</p>
              <div className="mt-2">
                <a href={`https://${companyWebsite}`} className="text-sm text-blue-600 hover:underline block">
                  {companyWebsite}
                </a>
                <p className="text-sm text-slate-600">{companyEmail}</p>
                <p className="text-sm text-slate-600">{companyPhone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                <span className="text-blue-600">Issue Date:</span> {issueDate}
              </p>
              <p className="text-sm text-slate-600">
                <span className="text-blue-600">Period:</span> {periodStart} - {periodEnd}
              </p>
            </div>
          </div>

          {/* Hours Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-700">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-700">Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {shiftsByDate.map((day, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-3 text-slate-700">{formatDisplayDate(day.date)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{day.hours.toFixed(2)}</td>
                  </tr>
                ))}
                {shiftsByDate.length === 0 && (
                  <tr className="border-t">
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                      No hours recorded for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-600">Total Hours:</span>
                <span className="font-semibold">{totalHours.toFixed(2)} h</span>
              </div>
              <div className="flex justify-between py-2 border-b items-center">
                <span className="text-slate-600">Hourly Rate:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">£{hourlyRate.toFixed(2)}</span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                      ○ Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-3 border-b-2">
                <span className="text-lg font-semibold text-slate-800">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">£{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tax Note */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <p className="text-amber-800">
              Tax included. Contractor must ensure all applicable taxes are paid to HMRC.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            {mode === 'create' && onSubmit && (
              <Button onClick={onSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            )}
            {mode === 'review' && isAdmin && (
              <>
                {onReject && (
                  <Button variant="destructive" onClick={onReject}>
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button onClick={onApprove}>
                    Approve
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit Dialogs */}
        {editingField === 'rate' && (
          <Dialog open onOpenChange={() => setEditingField(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Hourly Rate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Hourly Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveInvoice} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editingField === 'company' && (
          <Dialog open onOpenChange={() => setEditingField(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Company Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <textarea
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveInvoice} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editingField === 'invoice' && (
          <Dialog open onOpenChange={() => setEditingField(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Edit Invoice Number</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingField(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveInvoice} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
