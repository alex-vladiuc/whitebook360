import { useState, useEffect, useCallback } from 'react';
import { Check, X, Clock, Users, UserCheck, UserX, Search } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { profileQueries, Profile } from '@/lib/supabase';

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');

  // Counts for stats cards
  const [counts, setCounts] = useState({ pending: 0, approved: 0, denied: 0 });

  // Approval dialog state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Approval form data
  const [formData, setFormData] = useState({
    employee_code: '',
    department: '',
    position: '',
    hourly_rate: '',
  });

  // Deny dialog state
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);

  // Load counts for all statuses
  const loadCounts = useCallback(async () => {
    try {
      const [pending, approved, denied] = await Promise.all([
        profileQueries.getProfilesByStatus('pending'),
        profileQueries.getProfilesByStatus('approved'),
        profileQueries.getProfilesByStatus('denied'),
      ]);
      setCounts({
        pending: pending.length,
        approved: approved.length,
        denied: denied.length,
      });
    } catch (err) {
      console.error('Error loading counts:', err);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileQueries.getProfilesByStatus(activeTab);
      setProfiles(data);
    } catch (err) {
      console.error('Error loading profiles:', err);
      toast.error('Failed to load user profiles');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch counts on mount
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Fetch profiles on mount and tab change
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const filteredProfiles = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const openApproveDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormData({
      employee_code: '',
      department: '',
      position: '',
      hourly_rate: '',
    });
    setIsApproveDialogOpen(true);
  };

  const openDenyDialog = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsDenyDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedProfile) return;

    if (!formData.employee_code || !formData.department || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await profileQueries.approveUser(selectedProfile.user_id, {
        full_name: selectedProfile.full_name,
        employee_code: formData.employee_code,
        department: formData.department,
        position: formData.position,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
      });

      toast.success(`${selectedProfile.full_name} has been approved`);
      setIsApproveDialogOpen(false);
      setSelectedProfile(null);
      loadProfiles();
      loadCounts();
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error('Failed to approve user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedProfile) return;

    setIsSaving(true);
    try {
      await profileQueries.denyUser(selectedProfile.user_id);
      toast.success(`${selectedProfile.full_name} has been denied`);
      setIsDenyDialogOpen(false);
      setSelectedProfile(null);
      loadProfiles();
      loadCounts();
    } catch (err) {
      console.error('Error denying user:', err);
      toast.error('Failed to deny user');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Review and manage user registration requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'pending' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Pending</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{counts.pending}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'approved' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Approved</CardTitle>
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{counts.approved}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Active employees</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'denied' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab('denied')}
          >
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium truncate">Denied</CardTitle>
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{counts.denied}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Rejected applications</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-3 sm:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <div className="flex flex-col gap-4">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Pending</span>
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Approved</span>
                  </TabsTrigger>
                  <TabsTrigger value="denied" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Denied</span>
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'No users found matching your search'
                    : `No ${activeTab} requests`}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {filteredProfiles.map((profile) => (
                    <Card key={profile.user_id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{profile.full_name}</p>
                            <p className="text-xs text-muted-foreground">{profile.role}</p>
                          </div>
                          {getStatusBadge(profile.approval_status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Registered: {formatDate(profile.created_at)}
                        </p>
                        {activeTab === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => openApproveDialog(profile)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openDenyDialog(profile)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Deny
                            </Button>
                          </div>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        {activeTab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((profile) => (
                        <TableRow key={profile.user_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{profile.full_name}</p>
                              <p className="text-xs text-muted-foreground">{profile.role}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(profile.approval_status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(profile.created_at)}
                          </TableCell>
                          {activeTab === 'pending' && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openApproveDialog(profile)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openDenyDialog(profile)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Deny
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">Approve User</DialogTitle>
              <DialogDescription>
                Set up employee details for {selectedProfile?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code *</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, employee_code: e.target.value }))}
                  placeholder="e.g., EMP001"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g., Developer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isSaving} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={isSaving} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                {isSaving ? 'Approving...' : 'Approve User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deny Dialog */}
        <Dialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Deny User Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to deny the registration request from {selectedProfile?.full_name}?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDenyDialogOpen(false)} disabled={isSaving} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeny} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'Denying...' : 'Deny Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
