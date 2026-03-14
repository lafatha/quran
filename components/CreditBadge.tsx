"use client";

import { Infinity, Zap } from "lucide-react";

interface CreditBadgeProps {
  isPremium: boolean;
  creditsUsed: number;
  creditsMax: number;
}

export default function CreditBadge({ isPremium, creditsUsed, creditsMax }: CreditBadgeProps) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 rounded-full px-2.5 py-1">
        <Infinity className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[10px] font-bold text-amber-700">PRO</span>
      </div>
    );
  }

  const remaining = Math.max(0, creditsMax - creditsUsed);
  const isLow = remaining <= 3;
  const isExhausted = remaining === 0;

  return (
    <div
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 border ${
        isExhausted
          ? "bg-red-50 border-red-200/60"
          : isLow
            ? "bg-amber-50 border-amber-200/60"
            : "bg-emerald-50 border-emerald-200/60"
      }`}
    >
      <Zap
        className={`w-3 h-3 ${
          isExhausted
            ? "text-red-500"
            : isLow
              ? "text-amber-500"
              : "text-emerald-500"
        }`}
      />
      <span
        className={`text-[10px] font-bold ${
          isExhausted
            ? "text-red-600"
            : isLow
              ? "text-amber-600"
              : "text-emerald-600"
        }`}
      >
        {remaining}/{creditsMax}
      </span>
    </div>
  );
}
