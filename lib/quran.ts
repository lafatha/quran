import type { Surah } from "@/lib/types";

export async function getQuranData() {
  const response = await fetch("/quran_id.json");
  const data = (await response.json()) as Surah[];
  return data;
}

export function getSurahPages(totalVerses: number) {
  return Math.max(1, Math.round(totalVerses / 10));
}

export function getSurahMinutes(totalVerses: number) {
  return Math.max(3, Math.round(totalVerses / 2));
}
