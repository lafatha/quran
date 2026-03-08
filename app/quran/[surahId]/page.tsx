"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Share2, Check } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Verse {
  id: number;
  text: string;
  translation: string;
}

interface Surah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: Verse[];
}

export default function SurahReaderPage() {
  const router = useRouter();
  const params = useParams();
  const surahId = Number(params.surahId);

  const [surah, setSurah] = useState<Surah | null>(null);
  const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    fetch("/quran_id.json")
      .then((res) => res.json())
      .then((data: Surah[]) => {
        setAllSurahs(data);
        const found = data.find((s) => s.id === surahId);
        setSurah(found || null);
        setLoading(false);
      });
  }, [surahId]);

  const prevSurah = allSurahs.find((s) => s.id === surahId - 1);
  const nextSurah = allSurahs.find((s) => s.id === surahId + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!surah) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Surah tidak ditemukan</p>
        <button
          onClick={() => router.push("/quran")}
          className="text-sm text-flame-orange font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="pb-24 min-h-screen bg-background"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">{surah.transliteration}</p>
          </div>
          <Share2 className="w-5 h-5 text-gray-400" />
        </div>

        {/* Adjacent Surah Pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
          {prevSurah && (
            <button
              onClick={() => router.push(`/quran/${prevSurah.id}`)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap"
            >
              ← {prevSurah.transliteration}
            </button>
          )}
          <div className="text-xs px-3 py-1.5 rounded-full bg-black text-white whitespace-nowrap">
            {surah.transliteration}
          </div>
          {nextSurah && (
            <button
              onClick={() => router.push(`/quran/${nextSurah.id}`)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap"
            >
              {nextSurah.transliteration} →
            </button>
          )}
        </div>
      </div>

      {/* Surah Header Card */}
      <div className="px-5 mt-4 mb-5">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white text-center">
          <p className="arabic-text text-3xl mb-2">{surah.name}</p>
          <p className="text-lg font-bold">{surah.transliteration}</p>
          <p className="text-sm opacity-80 mt-1">{surah.translation}</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs opacity-70">
            <span className="capitalize">
              {surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}
            </span>
            <span>•</span>
            <span>{surah.total_verses} Ayat</span>
          </div>

          {/* Bismillah */}
          {surah.id !== 1 && surah.id !== 9 && (
            <p className="arabic-text text-xl mt-4 opacity-90">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          )}
        </div>
      </div>

      {/* Ayat List */}
      <div className="px-5 space-y-4">
        {surah.verses.map((verse) => (
          <div
            key={verse.id}
            className="bg-white rounded-xl p-4 border border-gray-50"
          >
            {/* Ayat Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600">
                  {verse.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-300" />
              </div>
            </div>

            {/* Arabic Text */}
            <p className="arabic-text text-2xl leading-loose text-gray-900 mb-4">
              {verse.text}
            </p>

            {/* Translation */}
            <p className="translation-text text-sm leading-relaxed">
              {verse.translation}
            </p>
          </div>
        ))}
      </div>

      {/* Mark as Read FAB */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMarked(!marked)}
          className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-all ${
            marked
              ? "bg-done-green text-white"
              : "bg-black text-white"
          }`}
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-semibold">
            {marked ? "Sudah Dibaca ✓" : "Tandai Dibaca"}
          </span>
        </button>
      </div>

      <BottomNav />
    </motion.div>
  );
}
