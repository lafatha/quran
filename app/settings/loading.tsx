export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eaf5f0_0%,#f4f9f6_30%,#ffffff_100%)] pb-28 px-4 pt-6">
      {/* Header */}
      <div className="h-9 w-36 rounded-xl bg-emerald-100/80 animate-pulse mb-5" />
      {/* Profile card */}
      <div className="h-24 rounded-[28px] bg-white animate-pulse mb-5" />
      {/* Prayer location */}
      <div className="h-4 w-28 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-52 rounded-[28px] bg-white animate-pulse mb-5" />
      {/* Target & reminders */}
      <div className="h-4 w-36 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-40 rounded-[28px] bg-white animate-pulse mb-5" />
      {/* About */}
      <div className="h-4 w-20 rounded-full bg-gray-200 animate-pulse mb-3" />
      <div className="h-32 rounded-[28px] bg-white animate-pulse" />
    </div>
  );
}
