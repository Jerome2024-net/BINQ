export default function TontinesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-white/[0.06] rounded-lg" />
        <div className="h-9 w-36 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-white/[0.06] rounded-xl" />
              <div>
                <div className="h-4 w-28 bg-white/[0.06] rounded" />
                <div className="h-3 w-16 bg-white/[0.04] rounded mt-1.5" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-white/[0.04] rounded" />
              <div className="h-3 w-2/3 bg-white/[0.04] rounded" />
            </div>
            <div className="flex gap-2 mt-3">
              <div className="h-5 w-14 bg-white/[0.06] rounded-full" />
              <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
