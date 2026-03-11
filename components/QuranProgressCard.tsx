"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface QuranProgressCardProps {
  surahName?: string;
  juz?: number;
  progressPercentage?: number;
  lastReadAyat?: number;
  totalAyat?: number;
}

export default function QuranProgressCard({
  surahName = "Surah Al-Fatihah",
  juz = 1,
  progressPercentage = 0,
  lastReadAyat = 0,
  totalAyat = 7,
}: QuranProgressCardProps) {
  return (
    <div className="bg-deen-bg-light rounded-[20px] p-5 border border-deen-main/10">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Quran Progress</h3>
        <p className="text-sm text-gray-500">
          Juz {juz}, {surahName}
        </p>
      </div>

      <div className="mb-4">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-deen-main rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-end mt-1.5">
          <span className="text-xs font-medium text-gray-500">
            {progressPercentage}% Complete
          </span>
        </div>
      </div>

      <Link
        href="/quran"
        className="flex items-center justify-center w-full bg-deen-main text-white font-medium py-3 rounded-xl hover:bg-deen-sub transition-colors gap-2 shadow-sm shadow-deen-main/20"
      >
        Continue Reading
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
