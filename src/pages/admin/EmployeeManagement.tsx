import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { employeeQueries, Employee } from '@/lib/supabase';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    employee_code: '',
    department: '',
    position: '',
    hourly_rate: '',
    address: '',
    sortCode: '',
    accountNumber: '',
  });

  // Fetch employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeQueries.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees:', err);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: '',
      employee_code: '',
      department: '',
      position: '',
      hourly_rate: '',
      address: '',
      sortCode: '',
      accountNumber: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    // Parse bank_account: "XX-XX-XX 12345678" format
    const [sortCode, accountNumber] = (employee.bank_account || '').split(' ');
    setFormData({
      full_name: employee.full_name,
      employee_code: employee.employee_code,
      department: employee.department,
      position: employee.position,
      hourly_rate: employee.hourly_rate.toString(),
      address: employee.address || '',
      sortCode: sortCode || '',
      accountNumber: accountNumber || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Combine sort code and account number into bank_account
      const bankAccount = formData.sortCode && formData.accountNumber
        ? `${formData.sortCode} ${formData.accountNumber}`
        : null;

      if (editingEmployee) {
        // Update existing employee
        await employeeQueries.updateEmployee(editingEmployee.id, {
          full_name: formData.full_name,
          employee_code: formData.employee_code,
          department: formData.department,
          position: formData.position,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          address: formData.address || null,
          bank_account: bankAccount,
        });
        toast.success('Employee updated successfully');
      } else {
        // Create new employee
        await employeeQueries.createEmployee({
          full_name: formData.full_name,
          employee_code: formData.employee_code,
          department: formData.department,
          position: formData.position,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          status: 'active',
          profile_photo_path: null,
          address: formData.address || null,
          bank_account: bankAccount,
        });
        toast.success('Employee added successfully');
      }
      setIsDialogOpen(false);
      loadEmployees(); // Refresh the list
    } catch (err) {
      console.error('Error saving employee:', err);
      toast.error(editingEmployee ? 'Failed to update employee' : 'Failed to add employee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeQueries.deleteEmployee(id);
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        toast.success('Employee deleted');
      } catch (err) {
        console.error('Error deleting employee:', err);
        toast.error('Failed to delete employee');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Add, edit, and manage employee records</p>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg sm:text-xl">All Employees</CardTitle>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{employee.full_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{employee.employee_code}</p>
                      </div>
                      <span className="status-active text-xs">{employee.status}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      <p>{employee.department} • {employee.position}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell className="font-mono text-sm">{employee.employee_code}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>
                        <span className="status-active">{employee.status}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, employee_code: e.target.value }))
                  }
                  placeholder="1234"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, department: e.target.value }))
                    }
                    placeholder="Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="Developer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hourly_rate: e.target.value }))
                  }
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Enter full address"
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Account <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.sortCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      const formatted = value.replace(/(\d{2})(?=\d)/g, '$1-').slice(0, 8);
                      setFormData((prev) => ({ ...prev, sortCode: formatted }));
                    }}
                    placeholder="00-00-00"
                    maxLength={8}
                    className="w-24 sm:w-28"
                  />
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData((prev) => ({ ...prev, accountNumber: value }));
                    }}
                    placeholder="12345678"
                    maxLength={8}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Sort Code - Account Number</p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
