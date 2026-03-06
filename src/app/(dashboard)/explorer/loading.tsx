export default function ExplorerLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-white/[0.06] rounded-lg" />
        <div className="h-9 w-40 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-white/[0.06] rounded-xl" />
              <div>
                <div className="h-4 w-24 bg-white/[0.06] rounded" />
                <div className="h-3 w-14 bg-white/[0.04] rounded mt-1" />
              </div>
            </div>
            <div className="h-3 w-full bg-white/[0.04] rounded mb-2" />
            <div className="h-3 w-3/4 bg-white/[0.04] rounded mb-4" />
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
              <div className="h-7 w-20 bg-white/[0.06] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
