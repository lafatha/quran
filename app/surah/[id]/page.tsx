"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Share2, MoreHorizontal, Bookmark, Flame, Minus, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { surahDetail } from "@/lib/mock-data";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function SurahDetailPage() {
  const s = surahDetail;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Full-bleed top image */}
      <div className="relative h-72 bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-900 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <span className="text-[120px]">🕌</span>
        </div>
        {/* Top nav overlay */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-4">
          <Link href="/" className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <span className="text-white font-semibold text-sm">Surah</span>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content overlapping the image */}
      <div className="px-4 -mt-16 relative z-10">
        {/* Title Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="bg-white rounded-2xl shadow-sm p-4"
        >
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            <span>{s.time}</span>
          </div>
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold">
              {s.name} · Surah ke-{s.number}
            </h2>
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
              <button className="w-6 h-6 flex items-center justify-center text-text-secondary">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold w-4 text-center">1</span>
              <button className="w-6 h-6 flex items-center justify-center text-text-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pahala Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="bg-white rounded-2xl shadow-sm p-4 mt-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Pahala</p>
            <p className="text-2xl font-bold">{s.pahala} pts</p>
          </div>
        </motion.div>

        {/* Macro pills */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="flex gap-2 mt-3"
        >
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">🥩</span>
            <p className="text-xs text-text-secondary mt-1">Tafsir</p>
            <p className="text-sm font-bold">{s.tafsirAyat} ayat</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">🌾</span>
            <p className="text-xs text-text-secondary mt-1">Hadits</p>
            <p className="text-sm font-bold">{s.haditsTerkait} terkait</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">💧</span>
            <p className="text-xs text-text-secondary mt-1">Terjemah</p>
            <p className="text-sm font-bold">{s.terjemah}</p>
          </div>
        </motion.div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Daftar Ayat */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="mt-5"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base">Daftar Ayat</h3>
            <button className="text-sm text-done-green font-medium">+ Tandai</button>
          </div>
          {s.ayatList.map((ayat) => (
            <div
              key={ayat.number}
              className="bg-gray-100 rounded-xl px-4 py-3 mb-2 flex justify-between items-center"
            >
              <span className="text-sm font-medium">Ayat {ayat.number} · {ayat.words} kata</span>
              <span className="text-xs text-text-secondary">{ayat.lines} baris</span>
            </div>
          ))}
        </motion.div>

        {/* Bottom CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
          className="flex gap-3 mt-5"
        >
          <Link
            href="/ai-chat"
            className="flex-1 border-2 border-black rounded-xl py-3 text-center font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Tanya AI
          </Link>
          <Link
            href="/"
            className="flex-1 bg-black text-white rounded-xl py-3 text-center font-semibold text-sm"
          >
            Selesai
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
