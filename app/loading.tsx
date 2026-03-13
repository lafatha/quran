export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="h-9 w-28 rounded-xl bg-emerald-100/80 animate-pulse" />
        <div className="h-10 w-16 rounded-2xl bg-emerald-100/80 animate-pulse" />
      </div>
      {/* Weekly strip */}
      <div className="h-20 rounded-2xl bg-white/70 animate-pulse mb-4" />
      {/* Prayer card */}
      <div className="h-48 rounded-[28px] bg-emerald-900/20 animate-pulse mb-5" />
      {/* Shortcuts grid */}
      <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="h-32 rounded-[26px] bg-emerald-100/60 animate-pulse" />
        <div className="h-32 rounded-[26px] bg-amber-100/60 animate-pulse" />
        <div className="h-32 rounded-[26px] bg-indigo-100/60 animate-pulse" />
        <div className="h-32 rounded-[26px] bg-slate-100/60 animate-pulse" />
      </div>
      {/* Progress card */}
      <div className="h-4 w-32 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-36 rounded-[28px] bg-white animate-pulse" />
    </div>
  );
}
