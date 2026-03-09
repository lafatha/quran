import type { Reciter, Surah, SurahSummary, Verse } from "@/lib/types";

let quranDataPromise: Promise<Surah[]> | null = null;

interface RawVerse {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

interface RawSurahSummary {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

interface RawSurah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull: Record<string, string>;
  ayat: RawVerse[];
  suratSelanjutnya?: RawSurahSummary | false;
  suratSebelumnya?: RawSurahSummary | false;
}

const RECITERS: Reciter[] = [
  { id: "05", name: "Misyari Rasyid Al-Afasi", shortName: "Al-Afasi" },
  { id: "03", name: "Abdurrahman As-Sudais", shortName: "As-Sudais" },
  { id: "06", name: "Yasser Al-Dosari", shortName: "Yasser" },
  { id: "01", name: "Abdullah Al-Juhany", shortName: "Al-Juhany" },
  { id: "02", name: "Abdul Muhsin Al-Qasim", shortName: "Al-Qasim" },
  { id: "04", name: "Ibrahim Al-Dossari", shortName: "Ibrahim" },
];

function mapSurahType(place: string): Surah["type"] {
  return place.toLowerCase() === "mekah" ? "meccan" : "medinan";
}

function mapSummary(summary?: RawSurahSummary | false): SurahSummary | null {
  if (!summary) {
    return null;
  }

  return {
    id: summary.nomor,
    name: summary.nama,
    transliteration: summary.namaLatin,
    totalVerses: summary.jumlahAyat,
  };
}

function mapVerse(verse: RawVerse): Verse {
  return {
    id: verse.nomorAyat,
    text: verse.teksArab,
    transliteration: verse.teksLatin.trim(),
    translation: verse.teksIndonesia,
    audio: verse.audio,
  };
}

function mapSurah(rawSurah: RawSurah): Surah {
  return {
    id: rawSurah.nomor,
    name: rawSurah.nama,
    transliteration: rawSurah.namaLatin,
    translation: rawSurah.arti,
    type: mapSurahType(rawSurah.tempatTurun),
    revelationPlace: rawSurah.tempatTurun,
    total_verses: rawSurah.jumlahAyat,
    description: rawSurah.deskripsi,
    audioFull: rawSurah.audioFull,
    verses: rawSurah.ayat.map(mapVerse),
    nextSurah: mapSummary(rawSurah.suratSelanjutnya),
    previousSurah: mapSummary(rawSurah.suratSebelumnya),
  };
}

export async function getQuranData() {
  if (!quranDataPromise) {
    quranDataPromise = fetch("/quran_full.json", { cache: "force-cache" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat data Al-Quran.");
        }

        const payload = (await response.json()) as RawSurah[];
        return payload.map(mapSurah);
      })
      .catch((error) => {
        quranDataPromise = null;
        throw error;
      });
  }

  return quranDataPromise;
}

export function getReciters() {
  return RECITERS;
}

export function getReciterById(reciterId: string) {
  return RECITERS.find((reciter) => reciter.id === reciterId) ?? RECITERS[0];
}

export function getSurahPages(totalVerses: number) {
  return Math.max(1, Math.round(totalVerses / 10));
}

export function getSurahMinutes(totalVerses: number) {
  return Math.max(3, Math.round(totalVerses / 2));
}
