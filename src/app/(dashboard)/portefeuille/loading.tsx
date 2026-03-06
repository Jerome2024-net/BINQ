export default function PortefeuilleLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-32 bg-white/[0.06] rounded-lg" />
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="h-3 w-16 bg-white/[0.04] rounded mb-2" />
        <div className="h-9 w-36 bg-white/[0.08] rounded-lg mb-4" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-white/[0.06] rounded-xl" />
          <div className="h-9 w-24 bg-white/[0.06] rounded-xl" />
        </div>
      </div>
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="h-4 w-28 bg-white/[0.06] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-white/[0.06] rounded-full" />
                <div>
                  <div className="h-3.5 w-36 bg-white/[0.06] rounded" />
                  <div className="h-3 w-20 bg-white/[0.04] rounded mt-1" />
                </div>
              </div>
              <div className="h-4 w-16 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
