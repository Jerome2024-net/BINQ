export default function DashboardPageLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-8 w-28 bg-gray-200 rounded-lg" />
            <div className="h-3 w-20 bg-gray-50 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Graphique + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-48 bg-gray-50 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-100 rounded-full" />
                <div className="flex-1">
                  <div className="h-3.5 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-50 rounded mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
