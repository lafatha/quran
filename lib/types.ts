export interface Verse {
  id: number;
  text: string;
  translation: string;
}

export interface Surah {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: string;
  total_verses: number;
  verses: Verse[];
}

export interface WeekDayItem {
  day: string;
  date: number;
  status: "completed" | "default" | "today" | "future";
}
