"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, BookMarked, ChevronRight, Volume2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getQuranData, getReciters } from "@/lib/quran";
import type { Surah } from "@/lib/types";

interface LastRead {
  surahId: number;
  surahName: string;
  ayatNumber: number;
}

export default function QuranPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const reciters = getReciters();

  useEffect(() => {
    const supabase = createClient();

    Promise.all([getQuranData(), supabase.auth.getUser()]).then(
      async ([quran, userResult]) => {
        setSurahs(quran);

        const user = userResult.data.user;
        if (user) {
          const { data } = await supabase
            .from("bookmarks")
            .select("surah_id, ayat_number")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            const target = quran.find((item) => item.id === data.surah_id);
            setLastRead({
              surahId: data.surah_id,
              surahName: target?.transliteration ?? `Surah ${data.surah_id}`,
              ayatNumber: data.ayat_number ?? 1,
            });
          }
        }

        setLoading(false);
      },
    );
  }, []);

  const filtered = surahs.filter(
    (surah) =>
      surah.transliteration.toLowerCase().includes(search.toLowerCase()) ||
      surah.translation.toLowerCase().includes(search.toLowerCase()) ||
      surah.id.toString() === search,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
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
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_36%),linear-gradient(135deg,#0f766e_0%,#115e59_45%,#022c22_100%)] p-5 text-white shadow-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(253,224,71,0.16),_transparent_30%)]" />
          <div className="absolute bottom-3 right-4 opacity-10">
            <BookMarked className="h-20 w-20" />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-50">
                Bookmark Terakhir
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                {lastRead?.surahName ?? "Belum ada bookmark"}
              </p>
              <p className="mt-1 text-sm text-emerald-50">
                {lastRead
                  ? `Ayat ${lastRead.ayatNumber}`
                  : "Simpan ayat favoritmu untuk lanjut baca lebih cepat."}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-emerald-50/90">
                {lastRead && (
                  <Link
                    href={`/quran/${lastRead.surahId}`}
                    className="inline-flex items-center rounded-full bg-white px-3 py-1 font-semibold text-emerald-900 transition-colors hover:bg-emerald-50 shrink-0"
                  >
                    Lanjut ke surah
                  </Link>
                )}
                {!lastRead && (
                  <span className="text-emerald-50/80">Belum ada bookmark</span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur-sm shrink-0">
                  <Volume2 className="w-3 h-3" /> {reciters.length} pilihan qari
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-50/70">
                Koleksi
              </p>
              <p className="text-lg font-bold leading-tight">114</p>
              <p className="text-[11px] text-emerald-50/80">surah lengkap</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">
          Daftar Surah ({filtered.length})
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
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
                <div className="bg-white rounded-[22px] p-4 flex items-center gap-4 active:scale-[0.98] transition-all border border-emerald-100 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-950/5 group">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 relative overflow-hidden group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-colors">
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
                      {surah.translation}{" "}
                      <span className="mx-1 opacity-50">•</span>{" "}
                      {surah.total_verses} ayat
                    </p>
                    <p className="text-[11px] text-emerald-700/70 mt-1 truncate">
                      {surah.revelationPlace}{" "}
                      <span className="mx-1 opacity-40">•</span>{" "}
                      {Object.keys(surah.audioFull).length} pilihan audio
                    </p>
                  </div>

                  <p className="arabic-text text-xl text-emerald-900 shrink-0 font-normal opacity-90 group-hover:text-emerald-600 transition-colors max-w-[92px] truncate">
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
