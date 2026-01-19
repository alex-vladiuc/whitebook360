import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Clock } from 'lucide-react';

export default function Index() {
  const { isAuthenticated, loading, needsPin } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/auth');
      } else if (needsPin) {
        navigate('/set-pin');
      } else {
        navigate('/kiosk');
      }
    }
  }, [isAuthenticated, loading, needsPin, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary flex items-center justify-center animate-pulse-ring">
          <Clock className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">TimeTracker Pro</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
