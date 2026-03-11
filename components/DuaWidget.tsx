"use client";

import { HandHeart } from "lucide-react";

export default function DuaWidget() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm border border-indigo-100 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-indigo-100 rounded-full">
          <HandHeart className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-medium">Daily</div>
          <div className="text-sm font-bold text-black">Dua</div>
        </div>
      </div>
      
      <div className="space-y-2 mt-2">
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
