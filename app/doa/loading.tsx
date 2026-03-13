export default function DoaLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef7f4_0%,#f7faf8_28%,#ffffff_100%)] pb-28">
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="h-9 w-36 rounded-xl bg-emerald-100/80 animate-pulse mb-1.5" />
        <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse" />
      </div>
      {/* Search */}
      <div className="px-5 pt-3 pb-2">
        <div className="h-12 rounded-2xl bg-white animate-pulse" />
      </div>
      {/* Category chips */}
      <div className="flex gap-2 px-5 py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-white animate-pulse" />
        ))}
      </div>
      {/* Count */}
      <div className="px-5 pt-2 pb-1">
        <div className="h-3.5 w-32 rounded-full bg-gray-200 animate-pulse" />
      </div>
      {/* Doa cards */}
      <div className="px-4 pt-2 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[24px] bg-white p-5 shadow-sm animate-pulse">
            <div className="mb-3 h-3 w-1/3 rounded-full bg-emerald-100" />
            <div className="mb-4 h-4 w-2/3 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-6 w-full rounded-full bg-gray-100" />
              <div className="h-6 w-4/5 rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
