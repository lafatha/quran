"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MoreHorizontal, Bookmark, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getQuranData, getSurahPages } from "@/lib/quran";
import { markSurahAsRead } from "@/lib/supabase/reading";
import type { Surah } from "@/lib/types";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function SurahDetailPage() {
  const params = useParams();
  const surahId = Number(params.id);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([getQuranData(), supabase.auth.getUser()]).then(([quranData, userResult]) => {
      const target = quranData.find((item) => item.id === surahId) ?? null;
      setSurah(target);
      setUserId(userResult.data.user?.id ?? null);
    });
  }, [surahId]);

  async function handleFinishReading() {
    if (!surah || !userId) {
      return;
    }

    const supabase = createClient();
    await markSurahAsRead(supabase, {
      userId,
      surahId: surah.id,
      totalVerses: surah.total_verses,
    });
  }

  if (!surah) {
    return <div className="min-h-screen bg-background" />;
  }

  const pages = getSurahPages(surah.total_verses);

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="relative h-72 bg-emerald-900 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <span className="text-[120px]">🕌</span>
        </div>
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

      <div className="px-4 -mt-16 relative z-10">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-text-secondary text-xs mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            <span>{surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}</span>
          </div>
          <h2 className="text-lg font-bold">{surah.transliteration} · Surah ke-{surah.id}</h2>
          <p className="text-xs text-text-secondary mt-1">{surah.translation}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="bg-white rounded-2xl shadow-sm p-4 mt-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Flame className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total Ayat</p>
            <p className="text-2xl font-bold">{surah.total_verses}</p>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="flex gap-2 mt-3">
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">📄</span>
            <p className="text-xs text-text-secondary mt-1">Halaman</p>
            <p className="text-sm font-bold">{pages}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">🔤</span>
            <p className="text-xs text-text-secondary mt-1">Nama Arab</p>
            <p className="text-sm font-bold arabic-text" dir="ltr">{surah.name}</p>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-3 text-center">
            <span className="text-sm">🌐</span>
            <p className="text-xs text-text-secondary mt-1">Bahasa</p>
            <p className="text-sm font-bold">ID</p>
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="mt-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base">Daftar Ayat</h3>
            <Link href={`/quran/${surah.id}`} className="text-sm text-done-green font-medium">Buka Reader</Link>
          </div>
          {surah.verses.slice(0, 5).map((ayat) => (
            <div key={ayat.id} className="bg-gray-100 rounded-xl px-4 py-3 mb-2 flex justify-between items-center">
              <span className="text-sm font-medium">Ayat {ayat.id}</span>
              <span className="text-xs text-text-secondary">{ayat.text.split(" ").length} kata</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="flex gap-3 mt-5">
          <Link
            href="/ai-chat"
            className="flex-1 border-2 border-black rounded-xl py-3 text-center font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> Tanya AI
          </Link>
          <Link
            href="/"
            onClick={handleFinishReading}
            className="flex-1 bg-black text-white rounded-xl py-3 text-center font-semibold text-sm"
          >
            Selesai
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
