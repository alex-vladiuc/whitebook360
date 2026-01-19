import { useState } from 'react';
import { X, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PinKeypadProps {
  title: string;
  subtitle?: string;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function PinKeypad({
  title,
  subtitle,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: PinKeypadProps) {
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        onSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="bg-card rounded-2xl shadow-modal p-8 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-200',
                i < pin.length ? 'bg-primary scale-110' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-destructive text-sm mb-4">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 justify-items-center">
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
      </div>
    </div>
  );
}
