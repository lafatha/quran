"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Flag, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { createClient } from "@/lib/supabase/client";

interface ChartPoint {
  month: string;
  actual: number;
  goal: number;
}

interface DailyLog {
  date: string;
  ayat_read: number;
  minutes_read: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

const filters = ["90D", "6M", "1Y", "ALL"];

function getRangeDays(filter: string) {
  if (filter === "90D") {
    return 90;
  }
  if (filter === "6M") {
    return 180;
  }
  if (filter === "1Y") {
    return 365;
  }
  return 730;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-bold">{payload[0].value} Juz</p>
      </div>
    );
  }
  return null;
}

export default function ProgressPage() {
  const [activeFilter, setActiveFilter] = useState("6M");
  const [targetJuz, setTargetJuz] = useState(30);
  const [completedCount, setCompletedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        return;
      }

      const [goalResult, streakResult, logsResult, completedResult] = await Promise.all([
        supabase.from("user_goals").select("target_juz").eq("id", user.id).maybeSingle(),
        supabase.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date, ayat_read, minutes_read")
          .eq("user_id", user.id)
          .order("date", { ascending: true }),
        supabase
          .from("reading_progress")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_completed", true),
      ]);

      setTargetJuz(goalResult.data?.target_juz ?? 30);
      setStreak(streakResult.data?.current_streak ?? 0);
      setLogs(logsResult.data ?? []);
      setCompletedCount(completedResult.count ?? 0);
    });
  }, []);

  const chartData = useMemo(() => {
    const days = getRangeDays(activeFilter);
    const start = new Date();
    start.setDate(start.getDate() - days);

    const filteredLogs = logs.filter((item) => new Date(item.date) >= start);
    const grouped = new Map<string, number>();

    filteredLogs.forEach((item) => {
      const date = new Date(item.date);
      const key = date.toLocaleString("id-ID", { month: "short" });
      const previous = grouped.get(key) ?? 0;
      grouped.set(key, previous + item.ayat_read);
    });

    const points: ChartPoint[] = Array.from(grouped.entries()).map(([month, ayat]) => ({
      month,
      actual: Number((ayat / 148).toFixed(1)),
      goal: targetJuz,
    }));

    return points.length > 0 ? points : [{ month: "-", actual: 0, goal: targetJuz }];
  }, [activeFilter, logs, targetJuz]);

  const dailyAverage = useMemo(() => {
    if (logs.length === 0) {
      return 0;
    }
    const total = logs.reduce((sum, item) => sum + item.minutes_read, 0);
    return Math.round(total / logs.length);
  }, [logs]);

  const currentJuz = Math.min(targetJuz, Math.max(1, Math.round(completedCount / 4)));
  const progressPercentage = Math.min(100, Math.round((currentJuz / targetJuz) * 100));

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.h1 initial="hidden" animate="visible" custom={0} variants={fadeUp} className="text-2xl font-bold px-5 pt-6 pb-4">
        Progress
      </motion.h1>

      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="px-4 flex gap-3">
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-text-secondary">Posisi Kamu</p>
          <p className="text-2xl font-bold mt-1">Juz {currentJuz}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-black rounded-full h-1.5" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-xs text-text-secondary mt-1.5">Target <b>Juz {targetJuz}</b></p>
          <button className="mt-3 bg-black text-white text-xs font-semibold rounded-lg px-3 py-2 flex items-center gap-1">
            Catat Bacaan <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="relative">
            <Flame className="w-10 h-10 text-flame-orange" />
            <span className="absolute -top-1 -right-2 text-yellow-400 text-xs">✦</span>
          </div>
          <p className="text-2xl font-bold text-flame-orange mt-1">{streak}</p>
          <p className="text-xs text-flame-orange font-semibold">Day Streak</p>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Progres Bacaan</h3>
            <span className="text-xs border border-gray-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
              <Flag className="w-3 h-3" /> {progressPercentage}% of goal
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} domain={[0, targetJuz]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="actual" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#22C55E", stroke: "#fff", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="goal" stroke="#000" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-2 mt-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${activeFilter === filter ? "bg-black text-white" : "text-text-secondary hover:bg-gray-100"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-sm">Rata-rata Harian</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold">{dailyAverage}</span>
            <span className="text-lg text-text-secondary">mnt</span>
            <span className="text-sm text-done-green font-semibold">stabil</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
