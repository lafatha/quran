import type { Surah } from "@/lib/types";

let quranDataPromise: Promise<Surah[]> | null = null;

export async function getQuranData() {
  if (!quranDataPromise) {
    quranDataPromise = fetch("/quran_id.json", { cache: "force-cache" })
      .then((response) => response.json() as Promise<Surah[]>)
      .catch((error) => {
        quranDataPromise = null;
        throw error;
      });
  }

  return quranDataPromise;
}

export function getSurahPages(totalVerses: number) {
  return Math.max(1, Math.round(totalVerses / 10));
}

export function getSurahMinutes(totalVerses: number) {
  return Math.max(3, Math.round(totalVerses / 2));
}
