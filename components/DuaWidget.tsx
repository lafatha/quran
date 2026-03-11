"use client";

import { HandHeart } from "lucide-react";

export default function DuaWidget() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm border border-indigo-100 h-full flex flex-col justify-between">
      {/* Praying Hands Background */}
      <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 opacity-5 pointer-events-none">
        <HandHeart className="w-full h-full text-indigo-600" strokeWidth={1} />
      </div>

      <div className="relative z-10 flex flex-col items-start mb-2">
        <div className="text-xs text-gray-500 font-medium">Daily</div>
        <div className="text-sm font-bold text-black">Dua</div>
      </div>
      
      <div className="relative z-10 space-y-2 mt-2">
        <p className="text-xl font-amiri text-right leading-relaxed text-black" dir="rtl">
          رَبِّ زِدْنِي عِلْمًا
        </p>
        <p className="text-[10px] text-gray-600 font-medium line-clamp-2">
          "My Lord, increase me in knowledge."
        </p>
      </div>
    </div>
  );
}
