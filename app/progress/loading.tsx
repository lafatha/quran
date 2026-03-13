export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28 px-4 pt-6">
      {/* Header */}
      <div className="h-9 w-28 rounded-xl bg-emerald-100/80 animate-pulse mb-5" />
      {/* Stat cards */}
      <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="flex gap-3 mb-4">
        <div className="flex-1 h-36 rounded-[28px] bg-white animate-pulse" />
        <div className="w-[120px] h-36 rounded-[28px] bg-white animate-pulse" />
      </div>
      {/* Annual progress */}
      <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-28 rounded-[28px] bg-white animate-pulse mb-4" />
      {/* Chart */}
      <div className="h-4 w-24 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-64 rounded-[28px] bg-white animate-pulse" />
    </div>
  );
}
