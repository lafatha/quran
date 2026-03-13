export interface PrayerDaySchedule {
  tanggal: number;
  tanggal_lengkap: string;
  hari: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export interface PrayerMonthSchedule {
  provinsi: string;
  kabkota: string;
  bulan: number;
  tahun: number;
  bulan_nama: string;
  jadwal: PrayerDaySchedule[];
}

export interface PrayerScheduleItem {
  label: string;
  time: string;
}

export interface PrayerState {
  currentTime: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  countdown: string;
}

export interface PrayerLocationState {
  province: string;
  city: string;
}

export const EMPTY_PRAYER_STATE: PrayerState = {
  currentTime: "--:--",
  nextPrayerName: "-",
  nextPrayerTime: "--:--",
  countdown: "Atur lokasi terlebih dahulu",
};

export function getPrayerScheduleForDay(daySchedule: PrayerDaySchedule | null) {
  if (!daySchedule) {
    return [] as PrayerScheduleItem[];
  }

  return [
    { label: "Subuh", time: daySchedule.subuh },
    { label: "Dzuhur", time: daySchedule.dzuhur },
    { label: "Ashar", time: daySchedule.ashar },
    { label: "Maghrib", time: daySchedule.maghrib },
    { label: "Isya", time: daySchedule.isya },
  ];
}

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTimeInMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatCountdown(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes} menit lagi`;
  }

  return `${hours}j ${minutes}m lagi`;
}

export function getPrayerState(date: Date, schedule: PrayerScheduleItem[]) {
  if (!schedule.length) {
    return EMPTY_PRAYER_STATE;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const nextPrayer =
    schedule.find((item) => getTimeInMinutes(item.time) >= currentMinutes) ??
    schedule[0];
  let remainingMinutes = getTimeInMinutes(nextPrayer.time) - currentMinutes;

  if (remainingMinutes < 0) {
    remainingMinutes += 24 * 60;
  }

  return {
    currentTime: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    nextPrayerName: nextPrayer.label,
    nextPrayerTime: nextPrayer.time,
    countdown: formatCountdown(remainingMinutes),
  };
}
