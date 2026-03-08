export default function SurahReaderLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-background border-b border-gray-100 px-4 pt-12 pb-3">
        <div className="h-8 w-full rounded-xl bg-gray-200 animate-pulse" />
      </div>
      <div className="px-5 mt-4">
        <div className="h-52 rounded-2xl bg-emerald-100 animate-pulse" />
      </div>
      <div className="px-5 mt-4 space-y-4">
        <div className="h-40 rounded-xl bg-white animate-pulse" />
        <div className="h-40 rounded-xl bg-white animate-pulse" />
        <div className="h-40 rounded-xl bg-white animate-pulse" />
      </div>
    </div>
  );
}
