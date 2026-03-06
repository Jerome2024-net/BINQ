export default function TontineDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-28 bg-white/[0.06] rounded" />
      <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="h-28 bg-white/[0.04]" />
        <div className="p-5">
          <div className="h-6 w-44 bg-white/[0.06] rounded-lg mb-2" />
          <div className="h-3 w-56 bg-white/[0.04] rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/[0.04] rounded-xl p-3">
                <div className="h-3 w-10 bg-white/[0.06] rounded mb-2" />
                <div className="h-5 w-16 bg-white/[0.08] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-white/[0.06] rounded-lg" />
        ))}
      </div>
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white/[0.06] rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 w-36 bg-white/[0.06] rounded" />
                <div className="h-3 w-20 bg-white/[0.04] rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
