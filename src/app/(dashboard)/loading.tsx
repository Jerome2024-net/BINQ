export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-40 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-28 bg-white/[0.04] rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="h-3.5 w-16 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-24 bg-white/[0.08] rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="h-4 w-32 bg-white/[0.06] rounded-lg mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white/[0.06] rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 w-3/4 bg-white/[0.06] rounded" />
                <div className="h-3 w-1/2 bg-white/[0.04] rounded mt-1.5" />
              </div>
              <div className="h-5 w-14 bg-white/[0.06] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
