"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  onExpired?: () => void;
}

export default function CountdownTimer({
  targetDate,
  label = "Ballot closes in",
  onExpired,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    function update() {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpired?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg">
        <span className="text-red-400 font-semibold text-sm">
          🔒 Ballot Closed
        </span>
      </div>
    );
  }

  const segments = [
    { value: timeLeft.days, label: "D" },
    { value: timeLeft.hours, label: "H" },
    { value: timeLeft.minutes, label: "M" },
    { value: timeLeft.seconds, label: "S" },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-cinema-300 text-xs font-medium">{label}</span>
      <div className="flex gap-1">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="flex items-center gap-0.5 bg-cinema-800 border border-cinema-600/30 rounded px-2 py-1"
          >
            <span className="text-gold-400 font-mono font-bold text-sm min-w-[1.5ch] text-center">
              {String(seg.value).padStart(2, "0")}
            </span>
            <span className="text-cinema-400 text-[10px]">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
