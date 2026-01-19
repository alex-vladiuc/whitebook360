import { useState } from 'react';
import { AlertTriangle, HandMetal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from 'sonner';

export default function SeeYaLater() {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = confirmText === 'SIGN OUT';

  const handleBulkSignOut = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success('All employees have been signed out');
    setConfirmText('');
    setIsLoading(false);
  };

  return (
    <MainLayout>
      <div className="content-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            See Ya Later <HandMetal className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground mt-1">
            End-of-day bulk sign out for all employees
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Sign Out</CardTitle>
            <CardDescription>
              This will sign out all currently signed-in employees at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Find all employees with open shifts</li>
                <li>Set their clock-out time to now</li>
                <li>Mark the shift as auto-created</li>
                <li>Calculate work hours automatically</li>
              </ul>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="w-full"
              disabled={isLoading || !canSubmit}
              onClick={handleBulkSignOut}
            >
              {isLoading ? 'Signing Out Everyone...' : 'Sign Out Everyone'}
            </Button>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  This action cannot be undone
                </p>
                <p className="text-sm text-muted-foreground">
                  Type <strong>SIGN OUT</strong> below to enable the button
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type SIGN OUT to confirm"
                  className="max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
