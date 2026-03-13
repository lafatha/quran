export default function AIChatLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-gray-100 animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse" />
      </div>
      {/* Messages */}
      <div className="flex-1 px-4 pt-4 space-y-3">
        <div className="flex justify-start">
          <div className="h-16 w-3/4 rounded-2xl rounded-tl-sm bg-gray-100 animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-1/2 rounded-2xl rounded-tr-sm bg-emerald-100/60 animate-pulse" />
        </div>
        <div className="flex justify-start">
          <div className="h-24 w-4/5 rounded-2xl rounded-tl-sm bg-gray-100 animate-pulse" />
        </div>
      </div>
      {/* Input bar */}
      <div className="px-3 pb-4 pt-2">
        <div className="h-14 rounded-[24px] bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
