"use client";

import { Play, BookOpen, Share2 } from "lucide-react";

export default function DailyAyahCard() {
  return (
    <div className="bg-gradient-to-br from-deen-bg-light to-white rounded-[20px] p-4 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute right-0 top-0 w-32 h-32 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#0F5132" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,32.2C59,42.9,47.1,51.4,34.6,58.6C22.1,65.8,9,71.7,-3.6,77.9C-16.2,84.1,-28.3,90.6,-39.3,86.6C-50.3,82.6,-60.2,68.1,-69.1,54.7C-78,41.3,-85.9,29,-88.3,15.6C-90.7,2.2,-87.6,-12.3,-79.6,-24.6C-71.6,-36.9,-58.7,-47,-45.8,-54.6C-32.9,-62.2,-20,-67.3,-6.7,-55.7L0,-44.1Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Daily Ayah</h3>
            <p className="text-[10px] text-gray-500">Al-Baqarah 2:255</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="arabic-text text-xl text-right leading-loose mb-2 text-gray-800">
            ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ
          </p>
          <p className="text-[10px] text-gray-600 leading-relaxed italic line-clamp-2">
            "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all existence]..."
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
          <button className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 hover:text-black transition-colors">
            <Play className="w-3 h-3" />
            Listen
          </button>
          <button className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 hover:text-black transition-colors">
            <BookOpen className="w-3 h-3" />
            Tafsir
          </button>
          <button className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600 hover:text-black transition-colors ml-auto">
            <Share2 className="w-3 h-3" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
