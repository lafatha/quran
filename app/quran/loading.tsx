export default function QuranLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28 px-5 pt-6">
      {/* Header */}
      <div className="h-9 w-28 rounded-xl bg-emerald-100/80 animate-pulse mb-1" />
      <div className="mt-1.5 h-4 w-40 rounded-full bg-gray-200 animate-pulse" />
      {/* Search */}
      <div className="mt-4 h-12 rounded-2xl bg-white animate-pulse" />
      {/* Bookmark hero */}
      <div className="mt-5 h-28 rounded-[28px] bg-emerald-100/60 animate-pulse" />
      {/* List items */}
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[20px] bg-white animate-pulse" />
        ))}
      </div>
    </div>
  );
}
