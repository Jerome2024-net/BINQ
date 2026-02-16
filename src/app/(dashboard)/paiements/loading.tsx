export default function PaiementsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
            <div className="h-7 w-24 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gray-100 rounded-full" />
                <div>
                  <div className="h-4 w-36 bg-gray-100 rounded" />
                  <div className="h-3 w-20 bg-gray-50 rounded mt-1" />
                </div>
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
