"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getQuranData } from "@/lib/quran";
import type { Surah } from "@/lib/types";

interface LastRead {
  surahName: string;
  ayatNumber: number;
}

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      getQuranData(),
      supabase.auth.getUser(),
    ]).then(async ([quran, userResult]) => {
      setSurahs(quran);

      const user = userResult.data.user;
      if (user) {
        const { data } = await supabase
          .from("reading_progress")
          .select("surah_id, last_ayat_read")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const target = quran.find((item) => item.id === data.surah_id);
          setLastRead({
            surahName: target?.transliteration ?? `Surah ${data.surah_id}`,
            ayatNumber: data.last_ayat_read ?? 1,
          });
        }
      }

      setLoading(false);
    });
  }, []);

  const filtered = surahs.filter(
    (surah) =>
      surah.transliteration.toLowerCase().includes(search.toLowerCase()) ||
      surah.translation.toLowerCase().includes(search.toLowerCase()) ||
      surah.id.toString() === search,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className="pb-24 min-h-screen bg-background"
    >
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold">Al-Quran</h1>
        <p className="text-sm text-gray-500 mt-1">Baca & pelajari ayat suci</p>
      </div>

      <div className="px-5 mb-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <input
            type="text"
            placeholder="Cari surah..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-white rounded-xl pl-10 pr-4 py-3.5 text-sm border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm shadow-emerald-500/5 transition-all"
          />
        </div>
      </div>

      <div className="px-5 mb-7">
        <div className="rounded-2xl p-5 text-white shadow-sm relative overflow-hidden bg-emerald-600">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <BookOpen className="w-16 h-16 -mt-2 -mr-2" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-50 font-bold mb-1">Terakhir Dibaca</p>
              <p className="text-xl font-bold tracking-tight mt-1">{lastRead?.surahName ?? "Belum ada"}</p>
              <p className="text-sm text-emerald-50 mt-1">
                {lastRead ? `Ayat ${lastRead.ayatNumber}` : "Mulai bacaan pertamamu"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Daftar Surah ({filtered.length})</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-3">
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
                <div className="bg-white rounded-xl p-4 flex items-center gap-4 hover:bg-emerald-50/50 active:scale-[0.98] transition-all border border-emerald-50 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-emerald-600 bg-emerald-50 border border-emerald-100/50 relative overflow-hidden group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span className="relative z-10">{surah.id}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-[15px] tracking-tight truncate text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {surah.transliteration}
                      </p>
                      <span
                        className={`text-[9px] px-2 py-0.5 font-bold rounded-full uppercase tracking-widest shrink-0 ${surah.type === "meccan" ? "bg-cyan-50 text-cyan-600" : "bg-teal-50 text-teal-600"}`}
                      >
                        {surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-emerald-600/70 transition-colors">
                      {surah.translation} <span className="mx-1 opacity-50">•</span> {surah.total_verses} ayat
                    </p>
                  </div>

                  <p className="arabic-text text-xl text-emerald-900 shrink-0 font-normal opacity-90 group-hover:text-emerald-600 transition-colors">
                    {surah.name}
                  </p>

                  <ChevronRight className="w-4 h-4 text-emerald-200 shrink-0 group-hover:text-emerald-500 transition-colors group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}
