"use client";

import { Moon, Landmark } from "lucide-react";

export default function PrayerTimeWidget() {
  // Mock data for now
  const nextPrayer = "Maghrib";
  const time = "6:45";
  const countdown = "12m";

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-deen-bg-light to-white p-4 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
      {/* Mosque Background */}
      <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-5 pointer-events-none">
        <Landmark className="w-full h-full text-deen-main" strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col items-start mb-2">
        <div className="text-xs text-gray-500 font-medium">Next</div>
        <div className="text-sm font-bold text-black">{nextPrayer}</div>
      </div>
      
      <div className="relative z-10">
        <div className="text-3xl font-bold text-gray-800 tracking-tight mb-1">{time}</div>
        <div className="text-xs font-medium text-gray-500 bg-white/50 inline-block px-2 py-1 rounded-lg">
          - {countdown} left
        </div>
      </div>
    </div>
  );
}
