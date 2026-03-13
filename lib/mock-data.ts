// ============================================
// MOCK DATA — Mufasir
// ============================================

export const weekDays = [
  { day: "Sun", date: 10, status: "completed" as const },
  { day: "Mon", date: 11, status: "default" as const },
  { day: "Tue", date: 12, status: "completed" as const },
  { day: "Wed", date: 13, status: "today" as const },
  { day: "Thu", date: 14, status: "future" as const },
  { day: "Fri", date: 15, status: "future" as const },
  { day: "Sat", date: 16, status: "future" as const },
];

export const dailyProgress = {
  ayatRead: 1250,
  ayatGoal: 2500,
  surahRead: 75,
  surahGoal: 150,
  halamanRead: 138,
  halamanGoal: 275,
  menitRead: 35,
  menitGoal: 70,
  streak: 15,
};

export const recentlyRead = [
  {
    id: 1,
    name: "Al-Baqarah",
    ayatCount: 284,
    progress: "35g",
    extra: "40g",
    extra2: "28g",
    calories: 550,
    time: "12:37pm",
    image: "/images/quran1.jpg",
  },
  {
    id: 2,
    name: "Al-Imran",
    ayatCount: 200,
    progress: "25g",
    extra: "30g",
    extra2: "15g",
    calories: 420,
    time: "11:15am",
    image: "/images/quran2.jpg",
  },
  {
    id: 3,
    name: "An-Nisa",
    ayatCount: 176,
    progress: "20g",
    extra: "35g",
    extra2: "22g",
    calories: 380,
    time: "9:30am",
    image: "/images/quran3.jpg",
  },
];

export const progressChartData = [
  { month: "Jun", actual: 5, goal: 5 },
  { month: "Jul", actual: 8, goal: 10 },
  { month: "Aug", actual: 10, goal: 15 },
  { month: "Sep", actual: 15.2, goal: 20 },
  { month: "Oct", actual: 12, goal: 25 },
  { month: "Nov", actual: 18, goal: 30 },
];

export const streakDays = [
  { day: "S", completed: true },
  { day: "M", completed: true },
  { day: "T", completed: false },
  { day: "W", completed: false },
  { day: "T", completed: false },
  { day: "F", completed: false },
  { day: "S", completed: false },
];

export const surahDetail = {
  id: 2,
  name: "Al-Baqarah",
  number: 2,
  totalAyat: 286,
  pahala: 330,
  tafsirAyat: 8,
  haditsTerkait: 20,
  terjemah: "ID",
  time: "6:21 PM",
  ayatList: [
    { number: 1, words: 20, lines: 1.5 },
    { number: 2, words: 35, lines: 2 },
    { number: 3, words: 18, lines: 1 },
    { number: 4, words: 28, lines: 1.5 },
    { number: 5, words: 42, lines: 2.5 },
  ],
};

export const chatMessages = [
  {
    id: 1,
    role: "user" as const,
    text: "Apa ayat tentang kesabaran?",
  },
  {
    id: 2,
    role: "ai" as const,
    text: 'Allah SWT berfirman tentang kesabaran dalam beberapa ayat. Salah satu yang paling terkenal:\n\n"Hai orang-orang yang beriman, jadikanlah sabar dan shalat sebagai penolongmu, sesungguhnya Allah beserta orang-orang yang sabar."\n\nAyat ini mengajarkan bahwa kesabaran adalah salah satu sifat yang paling dicintai Allah SWT.',
    reference: "QS. Al-Baqarah: 153",
  },
  {
    id: 3,
    role: "user" as const,
    text: "Jelaskan lebih detail tafsirnya",
  },
  {
    id: 4,
    role: "ai" as const,
    text: "Dalam tafsir Ibnu Katsir, ayat ini menjelaskan bahwa Allah memerintahkan hamba-Nya untuk meminta pertolongan dalam menghadapi segala urusan dengan bersabar dan mendirikan shalat.\n\nKesabaran ada dua jenis:\n1. **Sabar meninggalkan hal yang haram** — menahan diri dari larangan\n2. **Sabar dalam menjalankan ketaatan** — istiqamah dalam ibadah\n\nSedangkan shalat adalah penghubung antara hamba dengan Rabb-nya, menjadi sumber kekuatan spiritual.",
    reference: "Tafsir Ibnu Katsir · Al-Baqarah: 153",
  },
];

export const quickPrompts = [
  "Hadits tentang sabar",
  "Ayat tentang rezeki",
  "Tafsir Al-Baqarah 286",
  "Doa sebelum tidur",
];

export const userProfile = {
  name: "Gagah Athallah",
  email: "gagah@example.com",
  initials: "GA",
};
