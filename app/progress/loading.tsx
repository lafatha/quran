export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-background pb-24 px-4 pt-6">
      <div className="h-8 w-28 rounded-lg bg-gray-200 animate-pulse" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-36 rounded-2xl bg-white animate-pulse" />
        <div className="h-36 rounded-2xl bg-white animate-pulse" />
      </div>
      <div className="mt-4 h-64 rounded-2xl bg-white animate-pulse" />
      <div className="mt-4 h-28 rounded-2xl bg-white animate-pulse" />
    </div>
  );
}
