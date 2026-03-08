export default function AIChatLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
        <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
      </div>
      <div className="flex-1 px-4 pt-2 space-y-3">
        <div className="h-16 rounded-2xl bg-white animate-pulse" />
        <div className="h-16 rounded-2xl bg-white animate-pulse" />
        <div className="h-24 rounded-2xl bg-white animate-pulse" />
      </div>
      <div className="px-3 pb-4 pt-2">
        <div className="h-14 rounded-[24px] bg-white border border-gray-200 animate-pulse" />
      </div>
    </div>
  );
}
