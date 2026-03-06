export default function TransactionsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-32 bg-white/[0.06] rounded-lg" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-white/[0.06] rounded-lg" />
        ))}
      </div>
      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-white/[0.06] rounded-full" />
                <div>
                  <div className="h-3.5 w-36 bg-white/[0.06] rounded" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded mt-1" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-white/[0.06] rounded" />
                <div className="h-3 w-12 bg-white/[0.04] rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
