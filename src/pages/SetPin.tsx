import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetPin() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">PIN Setup</CardTitle>
          <CardDescription>PIN setup will be enabled after basic auth is live.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This screen is a placeholder while the team focuses on the core email/password
            authentication flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
