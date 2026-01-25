import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';

export default function PendingApproval() {
  const { signOut, profile } = useAuthContext();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-yellow-100 flex items-center justify-center">
            <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Account Pending Approval</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your account is awaiting administrator review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Signed in as
            </p>
            <p className="font-medium text-sm sm:text-base mt-1">{profile?.full_name}</p>
          </div>

          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
            <p>What happens next:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>An administrator will review your registration</li>
              <li>Once approved, you'll have full access to WhiteBook 360</li>
              <li>You'll be notified when your account is activated</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <Clock className="h-4 w-4 mr-2" />
              Check Status
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Need help? Contact your administrator
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
