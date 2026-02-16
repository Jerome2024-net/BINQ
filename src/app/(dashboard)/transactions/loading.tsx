export default function TransactionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded-lg" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gray-100 rounded-full" />
                <div>
                  <div className="h-4 w-44 bg-gray-100 rounded" />
                  <div className="h-3 w-28 bg-gray-50 rounded mt-1" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-14 bg-gray-50 rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
