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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 sm:mb-6 h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-primary flex items-center justify-center animate-pulse-ring">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">WhiteBook 360</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
