"use client";

import { useEffect, useState } from "react";
import { Flame, Plus, MoreVertical } from "lucide-react";
import WeeklyCalendarStrip from "@/components/WeeklyCalendarStrip";
import PrayerTimeWidget from "@/components/PrayerTimeWidget";
import DuaWidget from "@/components/DuaWidget";
import FeatureGrid from "@/components/FeatureGrid";
import DailyAyahCard from "@/components/DailyAyahCard";
import QuranProgressCard from "@/components/QuranProgressCard";
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

function getWeeklyDays(weekLogs: any[], goals: any) {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const items: WeekDayItem[] = [];
  const today = new Date();
  
  // Create a map of date -> progress percentage
  const progressMap = new Map<string, number>();
  weekLogs.forEach(log => {
    // Calculate progress based on ayat read vs goal
    // Default goal is 20 if not set (just a fallback)
    const goal = goals?.ayat_goal || 20; 
    const read = log.ayat_read || 0;
    const percentage = Math.min(100, Math.round((read / goal) * 100));
    progressMap.set(log.date, percentage);
  });

  for (let index = 3; index >= -3; index -= 1) {
    const target = new Date(today);
    target.setDate(today.getDate() - index);
    const year = target.getFullYear();
    const month = `${target.getMonth() + 1}`.padStart(2, "0");
    const date = `${target.getDate()}`.padStart(2, "0");
    const isoDate = `${year}-${month}-${date}`;

    const todayStr = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
    const isToday = isoDate === todayStr;
    const progress = progressMap.get(isoDate) || 0;
    
    let status: WeekDayItem["status"] = "default";
    if (isToday) {
      status = "today";
    } else if (progress >= 100) {
      status = "completed";
    }

    items.push({
      day: dayNames[target.getDay()],
      date: target.getDate(),
      status,
      progress
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
        // Generate default week days even if not logged in
        setWeekDays(getWeeklyDays([], null));
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

      setWeekDays(getWeeklyDays(weekLogs, goals));

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
    <div className="min-h-screen bg-gray-50 pb-32 relative font-sans pt-6">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-black tracking-tight">Mufassir</span>
        </div>
        <button className="p-2 -mr-2 text-gray-600 hover:text-black transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="px-4 mb-4">
        <WeeklyCalendarStrip days={weekDays} />
      </div>

      {/* Prayer Time Widget & Dua Widget */}
      <div className="px-6 mb-4 grid grid-cols-2 gap-3">
        <div className="col-span-1">
          <PrayerTimeWidget />
        </div>
        <div className="col-span-1">
          <DuaWidget />
        </div>
      </div>

      {/* Feature Grid */}
      <div className="px-6 mb-4">
        <FeatureGrid />
      </div>

      {/* Daily Ayah Card */}
      <div className="px-6 mb-4">
        <DailyAyahCard />
      </div>

      {/* Quran Progress */}
      <div className="px-6 mb-4">
        <QuranProgressCard
          surahName={recentlyRead[0]?.name}
          juz={2} // Mocked for now
          progressPercentage={73} // Mocked for now
        />
      </div>

      {/* Floating Action Button (Plus) */}
    </div>
  );
}
