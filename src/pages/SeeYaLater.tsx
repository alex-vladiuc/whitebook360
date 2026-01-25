import { useState } from 'react';
import { AlertTriangle, HandMetal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            See Ya Later <HandMetal className="h-5 w-5 sm:h-6 sm:w-6" />
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            End-of-day bulk sign out for all employees
          </p>
        </div>

        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Bulk Sign Out</CardTitle>
            <CardDescription className="text-sm">
              This will sign out all currently signed-in employees at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
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
              className="w-full text-sm sm:text-base"
              disabled={isLoading || !canSubmit}
              onClick={handleBulkSignOut}
            >
              {isLoading ? 'Signing Out Everyone...' : 'Sign Out Everyone'}
            </Button>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 sm:p-4 flex gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-foreground">
                  This action cannot be undone
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Type <strong>SIGN OUT</strong> below to enable the button
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type SIGN OUT to confirm"
                  className="max-w-full sm:max-w-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
