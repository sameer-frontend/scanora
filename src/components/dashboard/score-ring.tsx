"use client";

import { useId } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showScoreText?: boolean;
}

export function ScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  showScoreText = true,
}: ScoreRingProps) {
  const id = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getColor = (score: number) => {
    if (score >= 90) return { start: "#10b981", end: "#06b6d4" };
    if (score >= 70) return { start: "#f59e0b", end: "#f97316" };
    return { start: "#ef4444", end: "#f97316" };
  };

  const colors = getColor(score);
  const gradientId = `scoreGradient-${id}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgb(30 41 59 / 0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showScoreText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-white">{score}</div>
          <div className="text-xs text-slate-400">out of 100</div>
        </div>
      )}
    </div>
  );
}
