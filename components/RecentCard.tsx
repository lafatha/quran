import { Flame } from "lucide-react";
import Link from "next/link";

interface RecentCardProps {
  name: string;
  ayatCount: number;
  calories: number;
  time: string;
  image: string;
  id: number;
}

export default function RecentCard({ name, ayatCount, calories, time, id }: RecentCardProps) {
  return (
    <Link href={`/surah/${id}`}>
      <div className="flex gap-3 bg-white rounded-2xl shadow-sm p-3 mb-3">
        <div
          className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex-shrink-0 flex items-center justify-center"
        >
          <span className="text-3xl">📖</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-black text-sm">{name}</h4>
            <span className="text-xs text-text-secondary">{time}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Flame className="w-3.5 h-3.5 text-flame-orange" />
            <span className="font-bold text-sm">{calories} Ayat</span>
          </div>
          <div className="flex gap-2 mt-1 text-xs text-text-secondary">
            <span>🥩 {ayatCount > 200 ? "35g" : "25g"}</span>
            <span>🌾 {ayatCount > 200 ? "40g" : "30g"}</span>
            <span>💧 {ayatCount > 200 ? "28g" : "15g"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
