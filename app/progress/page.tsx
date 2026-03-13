"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, BookOpen, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ChartPoint {
  label: string;
  actual: number;
  goal: number;
}

interface DailyLog {
  date: string;
  ayat_read: number;
  minutes_read: number;
}

const filters = ["90D", "6M", "1Y", "ALL"];

function getRangeDays(filter: string) {
  if (filter === "90D") return 90;
  if (filter === "6M") return 180;
  if (filter === "1Y") return 365;
  return 730;
}

function formatMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("id-ID", { month: "short", year: "2-digit" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-gray-950 px-3 py-2 shadow-lg">
        <p className="mb-1 text-[11px] font-semibold text-white/60">{label}</p>
        {payload.map((entry) => (
          <p
            key={entry.dataKey}
            className={entry.dataKey === "actual" ? "text-xs font-bold text-white" : "text-xs text-white/40"}
          >
            {entry.dataKey === "actual" ? `${entry.value} ayat` : `Target: ${entry.value} ayat`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ProgressPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState("6M");
  const [ayatGoal, setAyatGoal] = useState(2500);
  const [completedSurahCount, setCompletedSurahCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      const [goalResult, streakResult, logsResult, completedResult] = await Promise.all([
        supabase.from("user_goals").select("ayat_goal").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date, ayat_read, minutes_read")
          .eq("user_id", user.id)
          .order("date", { ascending: true }),
        supabase
          .from("reading_state")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_completed", true),
      ]);

      setAyatGoal(goalResult.data?.ayat_goal ?? 2500);
      setStreak(streakResult.data?.current_streak ?? 0);
      setLogs(logsResult.data ?? []);
      setCompletedSurahCount(completedResult.count ?? 0);
    });
  }, []);

  const rangeDays = getRangeDays(activeFilter);

  const chartData = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - rangeDays);

    const filteredLogs = logs.filter((item) => new Date(item.date) >= start);
    const grouped = new Map<string, number>();

    filteredLogs.forEach((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;
      grouped.set(key, (grouped.get(key) ?? 0) + item.ayat_read);
    });

    const monthlyGoal = Math.round(ayatGoal / 12);

    const points: ChartPoint[] = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, ayat]) => ({
        label: formatMonthLabel(yearMonth),
        actual: ayat,
        goal: monthlyGoal,
      }));

    return points.length > 0 ? points : [{ label: "-", actual: 0, goal: monthlyGoal }];
  }, [logs, ayatGoal, rangeDays]);

  const dailyAverage = useMemo(() => {
    if (logs.length === 0) return 0;
    const totalMinutes = logs.reduce((sum, item) => sum + item.minutes_read, 0);
    return Math.round(totalMinutes / rangeDays);
  }, [logs, rangeDays]);

  const totalAyatRead = useMemo(
    () => logs.reduce((sum, item) => sum + item.ayat_read, 0),
    [logs],
  );

  const annualProgressPct = Math.min(100, Math.round((totalAyatRead / Math.max(1, ayatGoal)) * 100));
  const surahProgressPct = Math.min(100, Math.round((completedSurahCount / 114) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-[1.9rem] font-bold tracking-tight leading-none text-emerald-950">
          Progress
        </h1>
      </div>

      {/* Top stat cards */}
      <div className="mt-5 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Ringkasan
        </p>
        <div className="flex gap-3">
          {/* Surah selesai */}
          <div className="flex-1 rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Surah Selesai
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-[2rem] font-bold leading-none text-gray-950">{completedSurahCount}</p>
              <span className="text-sm text-gray-300">/ 114</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700"
                style={{ width: `${surahProgressPct}%` }}
              />
            </div>
            <Link
              href="/quran"
              className="mt-3 flex h-9 w-fit items-center gap-1.5 rounded-xl bg-gray-950 px-3 text-xs font-semibold text-white"
            >
              Baca <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Streak */}
          <div className="flex w-[120px] shrink-0 flex-col items-center justify-center rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
            <div className="relative">
              <Flame className="h-10 w-10 text-orange-500" />
              <span className="absolute -right-2 -top-1 text-xs text-yellow-400">✦</span>
            </div>
            <p className="mt-1 text-[2rem] font-bold leading-none text-orange-500">{streak}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Hari Berturut
            </p>
          </div>
        </div>
      </div>

      {/* Total ayat progress */}
      <div className="mt-4 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Target Tahunan
        </p>
        <div className="rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[2.4rem] font-bold tracking-tight leading-none text-gray-950">
                {totalAyatRead.toLocaleString("id-ID")}
                <span className="ml-1.5 text-base font-semibold text-gray-300">ayat</span>
              </p>
              <p className="mt-1.5 text-[13px] text-gray-400">
                dari target{" "}
                <span className="font-semibold text-gray-600">
                  {ayatGoal.toLocaleString("id-ID")}
                </span>{" "}
                ayat
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">
                Tercapai
              </p>
              <p className="mt-0.5 text-2xl font-bold leading-tight text-emerald-700">
                {annualProgressPct}%
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700"
              style={{ width: `${annualProgressPct}%` }}
            />
          </div>
          {/* mini stats */}
          <div className="mt-4 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-gray-300" />
            <p className="text-[11px] text-gray-400">
              Rata-rata harian:{" "}
              <span className="font-semibold text-gray-600">{dailyAverage} mnt</span>
              {" · "}dalam {rangeDays} hari terakhir
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Grafik Bacaan
        </p>
        <div className="rounded-[28px] border border-emerald-100/80 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-gray-900" />
                <span className="text-[11px] text-gray-400">Aktual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded bg-gray-200" style={{ backgroundImage: "repeating-linear-gradient(to right,#D1D5DB 0,#D1D5DB 4px,transparent 4px,transparent 8px)" }} />
                <span className="text-[11px] text-gray-400">Target</span>
              </div>
            </div>
            <span className="text-[11px] text-gray-400">Ayat / bulan</span>
          </div>

          <div className="h-44 min-w-0">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: "#111827", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke="#D1D5DB"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-gray-50" />
            )}
          </div>

          {/* Filter pills */}
          <div className="mt-4 flex justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-gray-950 text-white"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
