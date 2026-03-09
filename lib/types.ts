export interface Reciter {
  id: string;
  name: string;
  shortName: string;
}

export interface VerseAudioMap {
  [key: string]: string;
}

export interface Verse {
  id: number;
  text: string;
  transliteration: string;
  translation: string;
  audio: VerseAudioMap;
}

export interface SurahSummary {
  id: number;
  name: string;
  transliteration: string;
  totalVerses: number;
}

export interface Surah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: "meccan" | "medinan";
  revelationPlace: string;
  total_verses: number;
  description: string;
  audioFull: VerseAudioMap;
  verses: Verse[];
  nextSurah: SurahSummary | null;
  previousSurah: SurahSummary | null;
}

export interface WeekDayItem {
  day: string;
  date: number;
  status: "completed" | "default" | "today" | "future";
}
