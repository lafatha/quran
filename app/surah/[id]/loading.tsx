export default function SurahDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="h-72 bg-emerald-100 rounded-b-3xl animate-pulse" />
      <div className="px-4 -mt-16 relative z-10 space-y-3">
        <div className="h-24 rounded-2xl bg-white animate-pulse" />
        <div className="h-20 rounded-2xl bg-white animate-pulse" />
        <div className="h-24 rounded-2xl bg-white animate-pulse" />
        <div className="h-40 rounded-2xl bg-white animate-pulse" />
      </div>
    </div>
  );
}
