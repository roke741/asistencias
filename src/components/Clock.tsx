import { useState, useEffect } from 'react';

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const date = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-baseline">
        <span className="text-6xl font-bold tabular-nums tracking-tight text-slate-800 dark:text-white sm:text-7xl">
          {time}
        </span>
        <span className="ml-1 text-2xl font-semibold tabular-nums text-primary/60 sm:text-3xl">
          :{seconds}
        </span>
      </div>
      <span className="mt-1 text-sm font-medium capitalize text-slate-500 dark:text-slate-400 sm:text-base">
        {date}
      </span>
    </div>
  );
}
