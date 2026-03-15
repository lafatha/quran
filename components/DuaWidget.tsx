"use client";

import { UtensilsCrossed } from "lucide-react";

export default function DuaWidget() {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-indigo-50 p-4 shadow-sm border border-indigo-100 h-full flex flex-col justify-between">
      {/* Doa Buka Puasa icon */}
      <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 opacity-10 pointer-events-none">
        <UtensilsCrossed className="w-full h-full text-indigo-600" strokeWidth={1.5} />
      </div>

      <div className="relative z-10 flex flex-col items-start mb-2">
        <div className="text-xs text-gray-500 font-medium">Doa</div>
        <div className="text-sm font-bold text-black">Doa Buka Puasa</div>
      </div>

      <div className="relative z-10 space-y-2 mt-2">
        <p className="text-lg font-amiri text-right leading-relaxed text-black" dir="rtl">
          ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ
        </p>
        <p className="text-[10px] text-gray-600 font-medium line-clamp-3">
          Dhahaba al-zama&apos;u wa abtalat al-&apos;uruqu wa thabata al-ajru in syaa Allah. &ldquo;Telah hilang dahaga, urat-urat telah basah, dan pahala telah tetap, insya Allah.&rdquo;
        </p>
      </div>
    </div>
  );
}
