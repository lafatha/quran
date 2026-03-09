"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCircle2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Waves,
  Headphones,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getQuranData, getReciterById, getReciters } from "@/lib/quran";
import { markSurahAsRead, markSurahAsUnread } from "@/lib/supabase/reading";
import type { Surah } from "@/lib/types";

const DEFAULT_RECITER_ID = "05";

export default function SurahReaderPage() {
  const router = useRouter();
  const params = useParams();
  const surahId = Number(params.surahId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const toastTimerRef = useRef<number | null>(null);
  const resumeAfterReciterChangeRef = useRef(false);

  const [surah, setSurah] = useState<Surah | null>(null);
  const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);
  const [bookmarkedVerse, setBookmarkedVerse] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedReciterId, setSelectedReciterId] =
    useState(DEFAULT_RECITER_ID);
  const [activeVerseId, setActiveVerseId] = useState<number | null>(null);
  const [playingVerseId, setPlayingVerseId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<"verse" | "full">("verse");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const reciters = getReciters();
  const selectedReciter = getReciterById(selectedReciterId);
  const prevSurah = allSurahs.find((item) => item.id === surahId - 1);
  const nextSurah = allSurahs.find((item) => item.id === surahId + 1);
  const activeVerse = useMemo(
    () => surah?.verses.find((verse) => verse.id === activeVerseId) ?? null,
    [activeVerseId, surah],
  );
  const isPlaybackActive = isPlaying || isAudioLoading;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const playAudioSource = useCallback(
    async (
      source: string,
      nextPlayMode: "verse" | "full",
      verseId: number | null,
      resetTime: boolean,
    ) => {
      if (!audioRef.current) {
        return;
      }

      const audio = audioRef.current;
      const currentSource = audio.currentSrc || audio.src;

      setAudioError(null);
      setPlayMode(nextPlayMode);
      setPlayingVerseId(nextPlayMode === "verse" ? verseId : null);
      setActiveVerseId(verseId);
      setIsAudioLoading(true);

      if (currentSource !== source) {
        audio.src = source;
        audio.load();
      }

      if (resetTime || currentSource !== source) {
        audio.currentTime = 0;
      }

      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
        setIsAudioLoading(false);
        setAudioError(
          "Browser menolak autoplay audio. Silakan tap lagi untuk memulai.",
        );
      }
    },
    [],
  );

  const playVerse = useCallback(
    async (verseId: number, preserveTime = false) => {
      if (!surah) {
        return;
      }

      const verse = surah.verses.find((item) => item.id === verseId);
      const source = verse?.audio[selectedReciterId];
      if (!verse || !source) {
        setAudioError("Audio ayat untuk ustadz ini tidak tersedia.");
        return;
      }

      await playAudioSource(source, "verse", verse.id, !preserveTime);
    },
    [playAudioSource, selectedReciterId, surah],
  );

  const playFullSurah = useCallback(
    async (preserveTime = false) => {
      if (!surah) {
        return;
      }

      const source = surah.audioFull[selectedReciterId];
      if (!source) {
        setAudioError("Audio full surah untuk ustadz ini tidak tersedia.");
        return;
      }

      await playAudioSource(
        source,
        "full",
        activeVerseId ?? surah.verses[0]?.id ?? null,
        !preserveTime,
      );
    },
    [activeVerseId, playAudioSource, selectedReciterId, surah],
  );

  useEffect(() => {
    const supabase = createClient();
    const audio = audioRef.current;

    Promise.all([getQuranData(), supabase.auth.getUser()]).then(
      async ([quranData, userResult]) => {
        const foundSurah = quranData.find((item) => item.id === surahId);
        setAllSurahs(quranData);
        setSurah(foundSurah ?? null);
        setActiveVerseId(foundSurah?.verses[0]?.id ?? null);
        setPlayingVerseId(null);
        setIsPlaying(false);
        setPlayMode("verse");
        setAudioError(null);

        const user = userResult.data.user;
        if (user && foundSurah) {
          setUserId(user.id);

          const [bookmarkResult, progressResult] = await Promise.all([
            supabase
              .from("bookmarks")
              .select("ayat_number")
              .eq("user_id", user.id)
              .eq("surah_id", foundSurah.id)
              .maybeSingle(),
            supabase
              .from("reading_progress")
              .select("is_completed, last_ayat_read")
              .eq("user_id", user.id)
              .eq("surah_id", foundSurah.id)
              .maybeSingle(),
          ]);

          const lastAyatRead =
            progressResult.data?.last_ayat_read ??
            foundSurah.verses[0]?.id ??
            null;
          setBookmarkedVerse(bookmarkResult.data?.ayat_number ?? null);
          setMarked(progressResult.data?.is_completed ?? false);
          setActiveVerseId(bookmarkResult.data?.ayat_number ?? lastAyatRead);
        }

        setLoading(false);
      },
    );

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [surahId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    function handleEnded() {
      if (!surah) {
        return;
      }

      if (playMode === "full") {
        setIsPlaying(false);
        return;
      }

      const currentIndex = surah.verses.findIndex(
        (verse) => verse.id === playingVerseId,
      );
      const nextVerse = surah.verses[currentIndex + 1];

      if (!nextVerse) {
        setIsPlaying(false);
        setPlayingVerseId(null);
        showToast("Murattal ayat selesai.");
        return;
      }

      void playVerse(nextVerse.id, true);
    }

    function handlePlay() {
      setIsPlaying(true);
      setIsAudioLoading(false);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleWaiting() {
      setIsAudioLoading(true);
    }

    function handleCanPlay() {
      setIsAudioLoading(false);
    }

    function handleError() {
      setIsPlaying(false);
      setIsAudioLoading(false);
      setAudioError("Audio tidak berhasil diputar. Coba pilih ustadz lain.");
      showToast("Audio gagal diputar.");
    }

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [playMode, playVerse, playingVerseId, showToast, surah]);

  useEffect(() => {
    if (!surah) {
      return;
    }

    const shouldResume = resumeAfterReciterChangeRef.current;
    resumeAfterReciterChangeRef.current = false;

    if (!isPlaying) {
      return;
    }

    if (playMode === "full") {
      void playFullSurah(shouldResume);
      return;
    }

    if (playingVerseId) {
      void playVerse(playingVerseId, shouldResume);
    }
  }, [
    isPlaying,
    playFullSurah,
    playMode,
    playVerse,
    playingVerseId,
    selectedReciterId,
    surah,
  ]);

  useEffect(() => {
    if (!activeVerseId) {
      return;
    }

    const verseElement = verseRefs.current[activeVerseId];
    verseElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeVerseId]);

  function stopPlayback() {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.pause();
    setIsPlaying(false);
    setIsAudioLoading(false);
  }

  function handlePlayPauseVerse() {
    if (!surah) {
      return;
    }

    const targetVerseId = activeVerseId ?? surah.verses[0]?.id;
    if (!targetVerseId) {
      return;
    }

    if (isPlaying && playMode === "verse") {
      stopPlayback();
      return;
    }

    void playVerse(targetVerseId);
  }

  function handlePlayPauseFullSurah() {
    if (!surah) {
      return;
    }

    if (isPlaying && playMode === "full") {
      stopPlayback();
      return;
    }

    void playFullSurah();
  }

  function handleChangeReciter(reciterId: string) {
    resumeAfterReciterChangeRef.current = isPlaying;
    setSelectedReciterId(reciterId);
    showToast(`Qari diubah ke ${getReciterById(reciterId).shortName}`);
  }

  function goToAdjacentVerse(direction: "prev" | "next") {
    if (!surah) {
      return;
    }

    const currentId = activeVerseId ?? surah.verses[0]?.id;
    const currentIndex = surah.verses.findIndex(
      (verse) => verse.id === currentId,
    );
    const nextIndex =
      direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    const targetVerse = surah.verses[nextIndex];

    if (!targetVerse) {
      return;
    }

    setActiveVerseId(targetVerse.id);

    if (isPlaying && playMode === "verse") {
      void playVerse(targetVerse.id);
    }
  }

  async function toggleBookmark(verseId: number) {
    if (!surah || !userId) {
      return;
    }

    const supabase = createClient();
    if (bookmarkedVerse === verseId) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("surah_id", surah.id);
      setBookmarkedVerse(null);
      showToast("Bookmark dihapus.");
      return;
    }

    await supabase.from("bookmarks").upsert(
      {
        user_id: userId,
        surah_id: surah.id,
        ayat_number: verseId,
      },
      { onConflict: "user_id,surah_id" },
    );

    setBookmarkedVerse(verseId);
    setActiveVerseId(verseId);
    showToast(`Bookmark dipindah ke Ayat ${verseId}`);
  }

  async function toggleReadStatus() {
    if (!surah || !userId) {
      return;
    }

    const supabase = createClient();

    if (marked) {
      await markSurahAsUnread(supabase, userId, surah.id);
      setMarked(false);
      return;
    }

    await markSurahAsRead(supabase, {
      userId,
      surahId: surah.id,
      totalVerses: surah.total_verses,
    });
    setMarked(true);
    showToast("Bacaan disimpan.");
  }

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      className="pb-36 min-h-screen bg-background"
    >
      <audio ref={audioRef} preload="none" />

      <div className="sticky top-0 z-40 border-b border-emerald-100 bg-background">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">
              {surah.transliteration}
            </p>
            <p className="text-[11px] text-emerald-700/70 truncate">
              {selectedReciter.name}
            </p>
          </div>
          <button
            onClick={toggleReadStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${marked ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{marked ? "Selesai" : "Tandai"}</span>
          </button>
        </div>

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

      <div className="px-5 mt-2 mb-5">
        <div className="rounded-[28px] border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <div className="w-full flex justify-center mb-3">
            <p
              className="arabic-text text-5xl font-normal leading-relaxed text-emerald-950 text-center"
              dir="ltr"
            >
              {surah.name}
            </p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-gray-950">
            {surah.transliteration}
          </p>
          <p className="mt-1.5 inline-block border-b border-emerald-100 px-3 pb-1.5 text-sm text-emerald-700">
            {surah.translation}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-gray-700">
            <span className="rounded-full bg-emerald-50 px-3 py-1 uppercase tracking-wider text-emerald-700">
              {surah.type === "meccan" ? "Makkiyah" : "Madaniyah"}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 uppercase tracking-wider text-emerald-700">
              {surah.total_verses} Ayat
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 uppercase tracking-wider text-emerald-700">
              <Headphones className="w-3.5 h-3.5" /> {reciters.length} Qari
            </span>
          </div>

          {surah.id !== 1 && surah.id !== 9 && (
            <div className="flex flex-col items-center w-full">
              <div className="mx-auto mt-6 mb-5 h-px w-16 bg-emerald-100" />
              <p className="arabic-text text-3xl leading-relaxed text-emerald-950 text-center">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mb-5">
        <div className="bg-white rounded-[26px] border border-emerald-100/80 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Murattal Interaktif
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Panel ayat aktif hanya muncul saat audio diputar.
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Waves className="w-5 h-5" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {reciters.map((reciter) => (
              <button
                key={reciter.id}
                onClick={() => handleChangeReciter(reciter.id)}
                className={`px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedReciterId === reciter.id ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/10" : "bg-emerald-50/70 text-emerald-700 border-emerald-100 hover:bg-emerald-100"}`}
              >
                {reciter.shortName}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePlayPauseVerse}
              className={`rounded-2xl p-4 text-left border transition-all ${playMode === "verse" && isPlaying ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50/60 text-emerald-900 border-emerald-100"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                    Per ayat
                  </p>
                  <p className="text-sm font-semibold mt-1">Sinkron presisi</p>
                </div>
                {playMode === "verse" && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </div>
            </button>

            <button
              onClick={handlePlayPauseFullSurah}
              className={`rounded-2xl p-4 text-left border transition-all ${playMode === "full" && isPlaying ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-900 border-gray-100"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] opacity-70">
                    Full surah
                  </p>
                  <p className="text-sm font-semibold mt-1">Alur penuh</p>
                </div>
                {playMode === "full" && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToAdjacentVerse("prev")}
              className="w-11 h-11 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 flex items-center justify-center"
              aria-label="Ayat sebelumnya"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPauseVerse}
              className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3.5 font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
            >
              {isPlaying && playMode === "verse" ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isAudioLoading
                ? "Menyiapkan audio..."
                : `Putar Ayat ${activeVerseId ?? 1}`}
            </button>
            <button
              onClick={() => goToAdjacentVerse("next")}
              className="w-11 h-11 rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 flex items-center justify-center"
              aria-label="Ayat berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {audioError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{audioError}</p>
            </div>
          )}

          {activeVerse && isPlaybackActive && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700 font-semibold uppercase tracking-[0.18em]">
                Sedang aktif
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                Ayat {activeVerse.id} · {selectedReciter.shortName}
              </p>
              <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                {activeVerse.translation}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {surah.verses.map((verse) => {
          const isActive = activeVerseId === verse.id;
          const isPlaybackVerse = isActive && isPlaybackActive;
          const isBookmarked = bookmarkedVerse === verse.id;

          return (
            <div
              key={verse.id}
              ref={(element) => {
                verseRefs.current[verse.id] = element;
              }}
              className={`rounded-[24px] p-4 border transition-all duration-300 relative overflow-hidden ${isPlaybackVerse ? "bg-emerald-50 border-emerald-300 shadow-[0_18px_45px_-28px_rgba(13,148,136,0.28)]" : isActive ? "bg-white border-emerald-200" : "bg-white border-gray-100"}`}
            >
              {isPlaybackVerse && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%)]" />
              )}

              <div className="relative z-10 flex items-center justify-between mb-4 gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${isPlaybackVerse ? "bg-emerald-600 border-emerald-600 text-white" : isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-50 border-emerald-100/50 text-emerald-600"}`}
                >
                  <span className="text-xs font-bold">{verse.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveVerseId(verse.id);
                      void playVerse(verse.id);
                    }}
                    className={`p-2 rounded-full transition-all ${isActive && isPlaying && playMode === "verse" && playingVerseId === verse.id ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                    aria-label={`Putar ayat ${verse.id}`}
                  >
                    {isActive &&
                    isPlaying &&
                    playMode === "verse" &&
                    playingVerseId === verse.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleBookmark(verse.id)}
                    className={`p-2 rounded-full transition-all ${isBookmarked ? "bg-flame-orange/10 text-flame-orange" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                    aria-label="Bookmark verse"
                  >
                    <Bookmark
                      className="w-4 h-4"
                      fill={isBookmarked ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              <div className="relative z-10">
                <p
                  className={`arabic-text text-[2rem] leading-loose mb-4 transition-colors ${isActive ? "text-emerald-950" : "text-gray-900"}`}
                >
                  {verse.text}
                </p>
                <p
                  className={`text-xs uppercase tracking-[0.18em] mb-2 ${isActive ? "text-emerald-700" : "text-gray-400"}`}
                >
                  Latin
                </p>
                <p className="text-sm leading-relaxed text-gray-600 italic">
                  {verse.transliteration}
                </p>
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-100 to-transparent my-4" />
                <p className="translation-text text-sm leading-relaxed">
                  {verse.translation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 pb-8 px-5 flex justify-center mt-4">
        <button
          onClick={toggleReadStatus}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-all active:scale-95 ${marked ? "bg-white text-black border-2 border-black" : "bg-black text-white shadow-lg shadow-black/10 hover:-translate-y-1"}`}
        >
          <Check
            className={`w-5 h-5 ${marked ? "text-black" : "text-white"}`}
          />
          <span className="text-sm">
            {marked ? "Tandai Belum Dibaca" : "Selesai & Tandai Dibaca"}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {activeVerse && isPlaybackActive && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="fixed bottom-24 left-0 right-0 z-40 px-4 mx-auto max-w-[390px]"
          >
            <div className="rounded-[24px] border border-emerald-900 bg-emerald-950 px-4 py-3 text-white shadow-2xl shadow-emerald-950/20">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPauseVerse}
                  className="w-11 h-11 rounded-2xl bg-white text-emerald-950 flex items-center justify-center shrink-0"
                  aria-label="Toggle playback"
                >
                  {isPlaying && playMode === "verse" ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">
                    Ayat aktif
                  </p>
                  <p className="text-sm font-semibold truncate">
                    Ayat {activeVerse.id} · {selectedReciter.shortName}
                  </p>
                  <p className="text-xs text-emerald-100/75 truncate mt-1">
                    {activeVerse.translation}
                  </p>
                </div>
                <button
                  onClick={handlePlayPauseFullSurah}
                  className="px-3 py-2 rounded-2xl bg-emerald-900 text-xs font-semibold whitespace-nowrap"
                >
                  {isPlaying && playMode === "full"
                    ? "Pause Full"
                    : "Full Surah"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-[9.5rem] left-0 right-0 z-50 flex justify-center pointer-events-none px-4 mx-auto max-w-[390px]"
          >
            <div className="bg-[#1C1C1E] backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 w-auto border border-white/5">
              <Bookmark
                className="w-4 h-4 text-flame-orange shrink-0"
                fill="currentColor"
              />
              <p className="text-white text-[13px] font-semibold tracking-wide">
                {toastMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
