"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Flame } from "lucide-react";
import WeeklyCalendarStrip from "@/components/WeeklyCalendarStrip";
import CircularProgress from "@/components/CircularProgress";
import MacroCard from "@/components/MacroCard";
import RecentCard from "@/components/RecentCard";
import { createClient } from "@/lib/supabase/client";
import { getQuranData } from "@/lib/quran";
import type { WeekDayItem } from "@/lib/types";

interface DailyProgressState {
  ayatRead: number;
  ayatGoal: number;
  surahRead: number;
  surahGoal: number;
  halamanRead: number;
  halamanGoal: number;
  menitRead: number;
  menitGoal: number;
  streak: number;
}

interface RecentReadState {
  id: number;
  name: string;
  ayatCount: number;
  lastAyatRead: number;
  time: string;
}

const fallbackProgress: DailyProgressState = {
  ayatRead: 0,
  ayatGoal: 2500,
  surahRead: 0,
  surahGoal: 150,
  halamanRead: 0,
  halamanGoal: 275,
  menitRead: 0,
  menitGoal: 70,
  streak: 0,
};

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getWeeklyDays(completedDates: Set<string>) {
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const items: WeekDayItem[] = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const target = new Date(today);
    target.setDate(today.getDate() - index);
    const year = target.getFullYear();
    const month = `${target.getMonth() + 1}`.padStart(2, "0");
    const date = `${target.getDate()}`.padStart(2, "0");
    const isoDate = `${year}-${month}-${date}`;

    const status: WeekDayItem["status"] =
      isoDate === `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`
        ? "today"
        : completedDates.has(isoDate)
          ? "completed"
          : "default";

    items.push({
      day: dayNames[target.getDay()],
      date: target.getDate(),
      status,
    });
  }

  return items;
}

export default function HomePage() {
  const [progress, setProgress] = useState<DailyProgressState>(fallbackProgress);
  const [weekDays, setWeekDays] = useState<WeekDayItem[]>([]);
  const [recentlyRead, setRecentlyRead] = useState<RecentReadState[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = `${today.getMonth() + 1}`.padStart(2, "0");
      const date = `${today.getDate()}`.padStart(2, "0");
      const todayIso = `${year}-${month}-${date}`;

      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      const weekStartIso = `${weekStart.getFullYear()}-${`${weekStart.getMonth() + 1}`.padStart(2, "0")}-${`${weekStart.getDate()}`.padStart(2, "0")}`;

      const [goalsResult, streakResult, todayLogResult, weekLogsResult, progressResult, surahs] = await Promise.all([
        supabase.from("user_goals").select("ayat_goal, surah_goal, halaman_goal, menit_goal").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("daily_logs")
          .select("ayat_read, surah_read, halaman_read, minutes_read")
          .eq("user_id", user.id)
          .eq("date", todayIso)
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date")
          .eq("user_id", user.id)
          .gte("date", weekStartIso)
          .lte("date", todayIso),
        supabase
          .from("reading_progress")
          .select("surah_id, last_ayat_read, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(3),
        getQuranData(),
      ]);

      const goals = goalsResult.data;
      const streak = streakResult.data;
      const todayLog = todayLogResult.data;
      const weekLogs = weekLogsResult.data ?? [];
      const recentRows = progressResult.data ?? [];

      setProgress({
        ayatRead: todayLog?.ayat_read ?? 0,
        ayatGoal: goals?.ayat_goal ?? 2500,
        surahRead: todayLog?.surah_read ?? 0,
        surahGoal: goals?.surah_goal ?? 150,
        halamanRead: todayLog?.halaman_read ?? 0,
        halamanGoal: goals?.halaman_goal ?? 275,
        menitRead: todayLog?.minutes_read ?? 0,
        menitGoal: goals?.menit_goal ?? 70,
        streak: streak?.current_streak ?? 0,
      });

      const completedDates = new Set(weekLogs.map((item) => item.date));
      setWeekDays(getWeeklyDays(completedDates));

      const recentItems = recentRows.map((item) => {
        const surah = surahs.find((row) => row.id === item.surah_id);
        return {
          id: item.surah_id,
          name: surah?.transliteration ?? `Surah ${item.surah_id}`,
          ayatCount: surah?.total_verses ?? 0,
          lastAyatRead: item.last_ayat_read ?? 0,
          time: formatTime(item.updated_at),
        };
      });

      setRecentlyRead(recentItems);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          <span className="text-lg font-bold">Quran AI</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm">
          <Flame className="w-4 h-4 text-flame-orange" />
          <span className="font-bold text-sm">{progress.streak}</span>
        </div>
      </div>

      <div className="px-3">
        <WeeklyCalendarStrip days={weekDays} />
      </div>

      <div className="px-4 mt-2">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-5xl font-bold tracking-tight">{progress.ayatRead}</span>
              <span className="text-lg text-text-secondary font-medium">/{progress.ayatGoal}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1">Ayat dibaca hari ini</p>
          </div>
          <CircularProgress value={progress.ayatRead} max={progress.ayatGoal} size={90} strokeWidth={8} color="#000">
            <Flame className="w-5 h-5 text-black" />
          </CircularProgress>
        </div>
      </div>

      <div className="mt-4 px-4">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-2">
          <MacroCard value={progress.surahRead} goal={progress.surahGoal} label="Surah" icon="📖" color="#EF4444" />
          <MacroCard value={progress.halamanRead} goal={progress.halamanGoal} label="Halaman" icon="📄" color="#F97316" />
          <MacroCard value={progress.menitRead} goal={progress.menitGoal} label="Menit" icon="⏱️" color="#3B82F6" />
        </div>
      </div>

      <div className="px-4 mt-6">
        <h3 className="font-bold text-base mb-3">Terakhir Dibaca</h3>
        {recentlyRead.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-text-secondary">Belum ada bacaan. Mulai dari halaman Quran.</div>
        ) : (
          recentlyRead.map((item) => (
            <RecentCard
              key={item.id}
              id={item.id}
              name={item.name}
              ayatCount={item.ayatCount}
              lastAyatRead={item.lastAyatRead}
              time={item.time}
            />
          ))
        )}
      </div>

    </motion.div>
  );
}
