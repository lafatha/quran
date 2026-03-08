"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

interface Surah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
}

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/quran_id.json")
      .then((res) => res.json())
      .then((data: Surah[]) => {
        setSurahs(data);
        setLoading(false);
      });
  }, []);

  const filtered = surahs.filter(
    (s) =>
      s.transliteration.toLowerCase().includes(search.toLowerCase()) ||
      s.translation.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toString() === search
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="pb-24 min-h-screen bg-background"
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Al-Quran</h1>
        <p className="text-sm text-gray-500 mt-1">Baca & pelajari ayat suci</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari surah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-flame-orange/30"
          />
        </div>
      </div>

      {/* Last Read Banner */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Terakhir Dibaca</p>
              <p className="text-lg font-bold mt-1">Al-Baqarah</p>
              <p className="text-xs opacity-80 mt-0.5">Ayat 142 • Juz 2</p>
            </div>
            <BookOpen className="w-10 h-10 opacity-40" />
          </div>
        </div>
      </div>

      {/* Surah List */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">
          Daftar Surah ({filtered.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((surah) => (
              <Link key={surah.id} href={`/quran/${surah.id}`}>
                <div className="bg-white rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
                  {/* Number Badge */}
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center font-bold text-sm text-gray-600">
                    {surah.id}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {surah.transliteration}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 capitalize shrink-0">
                        {surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {surah.translation} • {surah.total_verses} ayat
                    </p>
                  </div>

                  {/* Arabic Name */}
                  <p className="arabic-text text-lg text-gray-700 shrink-0">
                    {surah.name}
                  </p>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
