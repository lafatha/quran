"use client";

import { motion } from "framer-motion";
import { BookOpen, Flame } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WeeklyCalendarStrip from "@/components/WeeklyCalendarStrip";
import CircularProgress from "@/components/CircularProgress";
import MacroCard from "@/components/MacroCard";
import RecentCard from "@/components/RecentCard";
import { dailyProgress, recentlyRead } from "@/lib/mock-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  const p = dailyProgress;
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="flex justify-between items-center px-5 pt-5 pb-2"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          <span className="text-lg font-bold">Quran AI</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm">
          <Flame className="w-4 h-4 text-flame-orange" />
          <span className="font-bold text-sm">{p.streak}</span>
        </div>
      </motion.div>

      {/* Weekly Calendar */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="px-3">
        <WeeklyCalendarStrip />
      </motion.div>

      {/* Main Progress Card */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="px-4 mt-2">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-5xl font-bold tracking-tight">{p.ayatRead}</span>
              <span className="text-lg text-text-secondary font-medium">/{p.ayatGoal}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Ayat dibaca</p>
          </div>
          <CircularProgress value={p.ayatRead} max={p.ayatGoal} size={90} strokeWidth={8} color="#000">
            <Flame className="w-5 h-5 text-black" />
          </CircularProgress>
        </div>
      </motion.div>

      {/* Macro Breakdown */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="mt-4 px-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-2">
          <MacroCard value={p.surahRead} goal={p.surahGoal} label="Surah" icon="📖" color="#EF4444" />
          <MacroCard value={p.halamanRead} goal={p.halamanGoal} label="Halaman" icon="📄" color="#F97316" />
          <MacroCard value={p.menitRead} goal={p.menitGoal} label="Menit" icon="⏱️" color="#3B82F6" />
        </div>
        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </motion.div>

      {/* Recently Read */}
      <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="px-4 mt-6">
        <h3 className="font-bold text-base mb-3">Terakhir Dibaca</h3>
        {recentlyRead.map((item) => (
          <RecentCard
            key={item.id}
            id={item.id}
            name={item.name}
            ayatCount={item.ayatCount}
            calories={item.calories}
            time={item.time}
            image={item.image}
          />
        ))}
      </motion.div>

      <BottomNav />
    </div>
  );
}
