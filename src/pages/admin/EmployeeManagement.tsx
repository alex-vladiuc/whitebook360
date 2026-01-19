import { useState } from 'react';
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
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';

// Mock data
const mockEmployees = [
  {
    id: '1',
    full_name: 'John Baker',
    employee_code: '1111',
    department: 'Engineering',
    position: 'Developer',
    status: 'active',
    hourly_rate: 25,
  },
  {
    id: '2',
    full_name: 'Sarah Miller',
    employee_code: '2222',
    department: 'Design',
    position: 'UI Designer',
    status: 'active',
    hourly_rate: 28,
  },
  {
    id: '3',
    full_name: 'Mike Johnson',
    employee_code: '3333',
    department: 'Operations',
    position: 'Manager',
    status: 'active',
    hourly_rate: 35,
  },
];

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState(mockEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof mockEmployees[0] | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    employee_code: '',
    department: '',
    position: '',
    hourly_rate: '',
  });

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
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: typeof mockEmployees[0]) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      employee_code: employee.employee_code,
      department: employee.department,
      position: employee.position,
      hourly_rate: employee.hourly_rate.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id
            ? { ...e, ...formData, hourly_rate: parseFloat(formData.hourly_rate) || 0 }
            : e
        )
      );
      toast.success('Employee updated successfully');
    } else {
      const newEmployee = {
        id: Date.now().toString(),
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        status: 'active' as const,
      };
      setEmployees((prev) => [...prev, newEmployee]);
      toast.success('Employee added successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast.success('Employee deleted');
    }
  };

  return (
    <MainLayout>
      <div className="content-container-wide">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage employee records</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Employees</CardTitle>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEmployee ? 'Save Changes' : 'Add Employee'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
