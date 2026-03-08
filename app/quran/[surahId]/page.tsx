"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bookmark, Share2, Check, CheckCircle2 } from "lucide-react";
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
  const [bookmarkedVerse, setBookmarkedVerse] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleBookmark = (verseId: number) => {
    if (bookmarkedVerse === verseId) {
      setBookmarkedVerse(null);
      showToast("Bookmark dihapus.");
    } else {
      setBookmarkedVerse(verseId);
      showToast(`Bookmark dipindah ke Ayat ${verseId}`);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

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
          <button
            onClick={() => setMarked(!marked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${marked ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{marked ? "Selesai" : "Tandai"}</span>
          </button>
        </div>

        {/* Adjacent Surah Pills */}
        <div className="flex justify-center gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
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
      <div className="px-5 mt-2 mb-6">
        <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white text-center relative shadow-xl shadow-teal-500/20 overflow-hidden flex flex-col items-center">
          {/* Decorative glowing overlay effect */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          {/* Subtle top glare effect */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="w-full flex justify-center mb-3">
            <p
              className="arabic-text text-5xl font-normal opacity-95 leading-relaxed drop-shadow-sm text-center"
              dir="ltr"
            >
              {surah.name}
            </p>
          </div>
          <p className="text-2xl font-bold tracking-tight drop-shadow-sm">{surah.transliteration}</p>
          <p className="text-sm text-emerald-50 border-b border-white/20 inline-block pb-1.5 mt-1.5 px-3">{surah.translation}</p>

          <div className="flex items-center justify-center gap-3 mt-5 text-xs font-semibold text-white">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
              {surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider">
              {surah.total_verses} Ayat
            </span>
          </div>

          {/* Bismillah */}
          {surah.id !== 1 && surah.id !== 9 && (
            <div className="flex flex-col items-center w-full">
              <div className="w-16 h-px bg-white/30 mx-auto mt-6 mb-5" />
              <p
                className="arabic-text text-3xl opacity-95 leading-relaxed drop-shadow-sm"
                style={{ textAlign: "center" }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100/50">
                <span className="text-xs font-bold text-emerald-600">
                  {verse.id}
                </span>
              </div>
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={() => toggleBookmark(verse.id)}
                  className={`p-2 rounded-full transition-all ${bookmarkedVerse === verse.id
                    ? "bg-flame-orange/10 text-flame-orange"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  aria-label="Bookmark verse"
                >
                  <Bookmark
                    className="w-4 h-4"
                    fill={bookmarkedVerse === verse.id ? "currentColor" : "none"}
                  />
                </button>
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

      {/* Mark as Read Button (Inline flow to prevent overlap UX issues) */}
      <div className="pt-6 pb-8 px-5 flex justify-center mt-4">
        <button
          onClick={() => setMarked(!marked)}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-all active:scale-95 ${marked
            ? "bg-white text-black border-2 border-black"
            : "bg-black text-white shadow-lg shadow-black/10 hover:-translate-y-1"
            }`}
        >
          <Check className={`w-5 h-5 ${marked ? "text-black" : "text-white"}`} />
          <span className="text-sm">
            {marked ? "Tandai Belum Dibaca" : "Selesai & Tandai Dibaca"}
          </span>
        </button>
      </div>

      {/* Minimalism Toast Popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="fixed bottom-24 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 mx-auto max-w-[390px]"
          >
            <div className="bg-[#1C1C1E] backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 w-auto border border-white/5">
              <Bookmark className="w-4 h-4 text-flame-orange shrink-0" fill="currentColor" />
              <p className="text-white text-[13px] font-semibold tracking-wide">
                {toastMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </motion.div>
  );
}
