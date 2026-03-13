export default function SurahReaderLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28">
      {/* Sticky header bar */}
      <div className="sticky top-0 z-40 border-b border-emerald-100/60 bg-white/90 backdrop-blur-sm px-4 pt-4 pb-3">
        <div className="h-8 w-full rounded-xl bg-gray-100 animate-pulse" />
      </div>
      {/* Surah hero card */}
      <div className="px-4 mt-4">
        <div className="h-52 rounded-[28px] bg-emerald-100/60 animate-pulse" />
      </div>
      {/* Verse cards */}
      <div className="px-4 mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-[24px] bg-white animate-pulse" />
        ))}
      </div>
    </div>
  );
}
