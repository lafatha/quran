import CircularProgress from "./CircularProgress";

interface MacroCardProps {
  value: number;
  goal: number;
  label: string;
  icon: string;
  color: string;
}

export default function MacroCard({ value, goal, label, icon, color }: MacroCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 min-w-[110px] flex flex-col items-center gap-2">
      <div className="text-center">
        <span className="text-lg font-bold text-black">{value}</span>
        <span className="text-xs text-text-secondary">/{goal}</span>
      </div>
      <p className="text-xs text-text-secondary">{label}</p>
      <CircularProgress value={value} max={goal} size={48} strokeWidth={4} color={color}>
        <span className="text-sm">{icon}</span>
      </CircularProgress>
    </div>
  );
}
