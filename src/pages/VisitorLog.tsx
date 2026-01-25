import { useState, useEffect } from 'react';
import { Search, Download, User, LogOut } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { visitorQueries, VisitorWithHost } from '@/lib/supabase';

export default function VisitorLog() {
  const [visitors, setVisitors] = useState<VisitorWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch visitors on mount
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        setLoading(true);
        const data = await visitorQueries.getVisitors();
        setVisitors(data);
      } catch (err) {
        console.error('Error fetching visitors:', err);
        toast.error('Failed to load visitors');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();

    // Subscribe to real-time changes
    const subscription = visitorQueries.subscribeToVisitors(async () => {
      // Refetch all visitors on any change
      const updated = await visitorQueries.getVisitors();
      setVisitors(updated);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async (visitorId: string, visitorName: string) => {
    try {
      await visitorQueries.signOutVisitor(visitorId);
      toast.success(`${visitorName} has been signed out`);

      // Update local state
      setVisitors((prev) =>
        prev.map((v) =>
          v.id === visitorId
            ? { ...v, sign_out_at: new Date().toISOString() }
            : v
        )
      );
    } catch (err) {
      console.error('Error signing out visitor:', err);
      toast.error('Failed to sign out visitor');
    }
  };

  const filteredVisitors = visitors.filter(
    (v) =>
      v.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.car_registration && v.car_registration.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeVisitors = visitors.filter((v) => !v.sign_out_at).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Visitor Log</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Track and manage visitor check-ins • {activeVisitors} currently on site
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Visitor Records</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              {visitors.length} total
            </Badge>
            <Badge className="bg-green-100 text-green-800 text-sm">
              {activeVisitors} on site
            </Badge>
            <Button
              variant="outline"
              onClick={() => toast.info('Export feature coming soon!')}
              className="ml-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading visitors...</p>
            </div>
          )}

          {!loading && filteredVisitors.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No visitors found</h3>
              <p className="text-muted-foreground text-sm">
                Visitors will appear here once they sign in via the kiosk
              </p>
            </div>
          )}

          {!loading && filteredVisitors.length > 0 && (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {filteredVisitors.map((visitor) => (
                  <Card key={visitor.id} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{visitor.full_name}</p>
                          <p className="text-xs text-muted-foreground">{visitor.purpose}</p>
                        </div>
                        {visitor.sign_out_at ? (
                          <Badge variant="secondary">Left</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">On Site</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {visitor.car_registration && <p>Vehicle: {visitor.car_registration}</p>}
                        <p>In: {format(new Date(visitor.sign_in_at), 'MMM d, HH:mm')}</p>
                        {visitor.sign_out_at && (
                          <p>Out: {format(new Date(visitor.sign_out_at), 'MMM d, HH:mm')}</p>
                        )}
                      </div>
                      {!visitor.sign_out_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => handleSignOut(visitor.id, visitor.full_name)}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block">
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={visitor.id}>
                        <TableCell className="font-medium">{visitor.full_name}</TableCell>
                        <TableCell>{visitor.purpose}</TableCell>
                        <TableCell>{visitor.car_registration || '—'}</TableCell>
                        <TableCell>{visitor.host_employee?.full_name || '—'}</TableCell>
                        <TableCell>
                          {format(new Date(visitor.sign_in_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {visitor.sign_out_at
                            ? format(new Date(visitor.sign_out_at), 'MMM d, HH:mm')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {visitor.sign_out_at ? (
                            <Badge variant="secondary">Left</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">On Site</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!visitor.sign_out_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSignOut(visitor.id, visitor.full_name)}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Sign Out
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
