"use client";

import { Moon } from "lucide-react";

export default function PrayerTimeWidget() {
  // Mock data for now
  const nextPrayer = "Maghrib";
  const time = "6:45";
  const countdown = "12m";

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-deen-bg-light to-white p-5 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-deen-main/10 rounded-full">
          <Moon className="w-5 h-5 text-deen-main" />
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-medium">Next</div>
          <div className="text-sm font-bold text-black">{nextPrayer}</div>
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-bold text-gray-800 tracking-tight mb-1">{time}</div>
        <div className="text-xs font-medium text-gray-500 bg-white/50 inline-block px-2 py-1 rounded-lg">
          - {countdown} left
        </div>
      </div>
    </div>
  );
}
