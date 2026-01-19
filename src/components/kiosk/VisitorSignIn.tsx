import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VisitorSignInProps {
  onSubmit: (data: { name: string; purpose: string; carReg: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VisitorSignIn({ onSubmit, onCancel, isLoading }: VisitorSignInProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [carReg, setCarReg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, purpose, carReg });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="bg-card rounded-2xl shadow-modal p-6 w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Visitor Sign In</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Visit</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Meeting, Delivery, Interview"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carReg">Vehicle Registration (Optional)</Label>
            <Input
              id="carReg"
              value={carReg}
              onChange={(e) => setCarReg(e.target.value)}
              placeholder="e.g., ABC 123"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
