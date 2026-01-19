import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="live-clock">
      {format(time, 'HH:mm:ss')}
    </div>
  );
}

export function DateDisplay() {
  const today = new Date();
  const dayName = format(today, 'EEEE');
  const date = format(today, 'MMMM do, yyyy');
  const week = format(today, "'Week' w");

  return (
    <p className="text-muted-foreground">
      {dayName}, {date} • {week}
    </p>
  );
}
