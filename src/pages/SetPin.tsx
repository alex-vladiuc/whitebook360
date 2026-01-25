import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Clock, Delete } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authQueries } from '@/lib/supabase';

export default function SetPin() {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updatePin, profile } = useAuthContext();
  const navigate = useNavigate();
  if (profile?.approval_status !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }

  const currentPin = step === 'create' ? pin : confirmPin;
  const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

  const handleDigit = (digit: string) => {
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      setCurrentPin(newPin);
      setError(null);

      if (newPin.length === 4) {
        if (step === 'create') {
          setTimeout(() => setStep('confirm'), 300);
        } else {
          handleConfirm(newPin);
        }
      }
    }
  };

  const handleDelete = () => {
    setCurrentPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setCurrentPin('');
    setError(null);
  };

  const handleConfirm = async (confirmedPin: string) => {
    if (pin !== confirmedPin) {
      setError("PINs don't match. Please try again.");
      setConfirmPin('');
      setStep('create');
      setPin('');
      return;
    }

    setIsLoading(true);
    try {
      const pinHash = await authQueries.hashPin(pin);
      const { error } = await updatePin(pinHash);

      if (error) {
        toast.error('Failed to set PIN. Please try again.');
        setConfirmPin('');
        setStep('create');
        setPin('');
      } else {
        toast.success('PIN set successfully!');
        navigate('/kiosk');
      }
    } catch (err) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary flex items-center justify-center">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">
            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </CardTitle>
          <CardDescription className="text-sm">
            {step === 'create'
              ? 'Enter a 4-digit PIN for quick sign in'
              : 'Re-enter your PIN to confirm'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-4 sm:mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-200',
                  i < currentPin.length ? 'bg-primary scale-110' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-destructive text-xs sm:text-sm mb-4">{error}</p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 justify-items-center">
            {digits.map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                disabled={isLoading}
                className="keypad-button"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="keypad-button text-sm font-normal"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit('0')}
              disabled={isLoading}
              className="keypad-button"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="keypad-button"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {step === 'confirm' && (
            <Button
              variant="ghost"
              className="w-full mt-6"
              onClick={() => {
                setStep('create');
                setPin('');
                setConfirmPin('');
                setError(null);
              }}
            >
              Start Over
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
