import { useState } from 'react';
import { Search, Download, User } from 'lucide-react';
import { format } from 'date-fns';
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
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';

// Mock data
const mockVisitors = [
  {
    id: '1',
    name: 'Alice Johnson',
    purpose: 'Meeting',
    car_reg: 'ABC 123',
    signed_in_at: new Date(2026, 0, 19, 9, 30),
    signed_out_at: new Date(2026, 0, 19, 11, 45),
    status: 'signed_out',
  },
  {
    id: '2',
    name: 'Bob Smith',
    purpose: 'Delivery',
    car_reg: 'XYZ 789',
    signed_in_at: new Date(2026, 0, 19, 10, 15),
    signed_out_at: null,
    status: 'signed_in',
  },
];

export default function VisitorLog() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVisitors = mockVisitors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="content-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Visitor Log</h1>
          <p className="text-muted-foreground mt-1">Track and manage visitor check-ins</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Visitor Records</CardTitle>
            <Button
              variant="outline"
              onClick={() => toast.info('Export feature coming soon!')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search visitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredVisitors.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No visitors found</h3>
                <p className="text-muted-foreground text-sm">
                  Visitors will appear here once they sign in
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Signed In</TableHead>
                    <TableHead>Signed Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.name}</TableCell>
                      <TableCell>{visitor.purpose}</TableCell>
                      <TableCell>{visitor.car_reg || '—'}</TableCell>
                      <TableCell>
                        {format(visitor.signed_in_at, 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {visitor.signed_out_at
                          ? format(visitor.signed_out_at, 'MMM d, HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            visitor.status === 'signed_in'
                              ? 'status-working'
                              : 'status-pill bg-muted text-muted-foreground'
                          }
                        >
                          {visitor.status === 'signed_in' ? 'On Site' : 'Left'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
