"use client";

import { motion } from "framer-motion";
import { Flame, Flag, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import BottomNav from "@/components/BottomNav";
import { progressChartData, streakDays } from "@/lib/mock-data";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

const filters = ["90D", "6M", "1Y", "ALL"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { month: string } }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
        <p className="font-bold">{payload[0].value} Juz</p>
        <p className="text-gray-300">Sep 9, 2025</p>
      </div>
    );
  }
  return null;
}

export default function ProgressPage() {
  const [activeFilter, setActiveFilter] = useState("6M");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Title */}
      <motion.h1
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeUp}
        className="text-2xl font-bold px-5 pt-6 pb-4"
      >
        Progress
      </motion.h1>

      {/* Two top cards */}
      <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="px-4 flex gap-3">
        {/* Left — Posisi Baca */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs text-text-secondary">Posisi Kamu</p>
          <p className="text-2xl font-bold mt-1">Juz 15</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-black rounded-full h-1.5 w-1/2" />
          </div>
          <p className="text-xs text-text-secondary mt-1.5">Target <b>Juz 30</b></p>
          <button className="mt-3 bg-black text-white text-xs font-semibold rounded-lg px-3 py-2 flex items-center gap-1">
            Catat Bacaan <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right — Streak */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center">
          <div className="relative">
            <Flame className="w-10 h-10 text-flame-orange" />
            <span className="absolute -top-1 -right-2 text-yellow-400 text-xs">✦</span>
          </div>
          <p className="text-2xl font-bold text-flame-orange mt-1">21</p>
          <p className="text-xs text-flame-orange font-semibold">Day Streak</p>
          <div className="flex gap-1.5 mt-2">
            {streakDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-text-secondary">{d.day}</span>
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    d.completed ? "bg-done-green" : "bg-gray-200"
                  }`}
                >
                  {d.completed && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reading Progress Chart */}
      <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Progres Bacaan</h3>
            <span className="text-xs border border-gray-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
              <Flag className="w-3 h-3" /> 80% of goal
            </span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  domain={[0, 30]}
                  ticks={[0, 5, 10, 15, 20, 25, 30]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#22C55E", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke="#000"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mt-3">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  activeFilter === f
                    ? "bg-black text-white"
                    : "text-text-secondary hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Motivational badge */}
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
            <p className="text-xs text-done-green font-medium">
              Mashaa Allah! Konsistensi adalah kuncimu! 🌙
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily Average */}
      <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-sm">Rata-rata Harian</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold">45</span>
            <span className="text-lg text-text-secondary">mnt</span>
            <span className="text-sm text-done-green font-semibold">↑90%</span>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1.5 mt-3 h-12">
            {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  background: i === 3 ? "#F87171" : "#E5E7EB",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
