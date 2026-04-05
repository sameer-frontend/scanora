"use client";

import { motion } from "framer-motion";

interface WebGuardScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showScoreText?: boolean;
}

export function WebGuardScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  showScoreText = true,
}: WebGuardScoreRingProps) {
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

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>
      {
        showScoreText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-4xl font-bold text-white"
            >
              {score}
            </motion.div>
            <div className="text-xs text-slate-400">out of 100</div>
          </div>
        )
      }
    </div>
  );
}
