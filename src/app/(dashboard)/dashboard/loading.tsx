export default function DashboardPageLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-6 w-44 bg-white/[0.06] rounded-lg" />
        <div className="h-3 w-56 bg-white/[0.04] rounded mt-2" />
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="h-4 w-16 bg-white/[0.04] rounded mb-2" />
        <div className="h-9 w-36 bg-white/[0.08] rounded-lg mb-3" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-white/[0.06] rounded-xl" />
          <div className="h-8 w-24 bg-white/[0.06] rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-2xl p-3 border border-white/[0.06] flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-white/[0.06] rounded-xl" />
            <div className="h-3 w-12 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="h-4 w-28 bg-white/[0.06] rounded-lg mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white/[0.06] rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 w-3/4 bg-white/[0.06] rounded" />
                <div className="h-3 w-1/2 bg-white/[0.04] rounded mt-1.5" />
              </div>
              <div className="h-4 w-16 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
