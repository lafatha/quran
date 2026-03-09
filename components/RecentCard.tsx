import { Flame } from "lucide-react";
import Link from "next/link";

interface RecentCardProps {
  id: number;
  name: string;
  ayatCount: number;
  lastAyatRead: number;
  time: string;
}

export default function RecentCard({ id, name, ayatCount, lastAyatRead, time }: RecentCardProps) {
  const progress = ayatCount > 0 ? Math.min(100, Math.round((lastAyatRead / ayatCount) * 100)) : 0;

  return (
    <Link href={`/surah/${id}`}>
      <div className="flex gap-3 bg-white rounded-2xl shadow-sm p-3 mb-3 border border-emerald-100/70">
        <div
          className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex-shrink-0 flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_42%)]" />
          <span className="text-3xl">📖</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-black text-sm">{name}</h4>
            <span className="text-xs text-text-secondary">{time}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Flame className="w-3.5 h-3.5 text-flame-orange" />
            <span className="font-bold text-sm">Ayat {lastAyatRead}/{ayatCount}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-emerald-50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-2 mt-2 text-xs text-text-secondary">
            <span>{progress}% selesai</span>
            <span>•</span>
            <span>{ayatCount} ayat</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
