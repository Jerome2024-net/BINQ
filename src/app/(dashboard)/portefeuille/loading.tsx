export default function PortefeuilleLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-36 bg-gray-200 rounded-lg" />
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="h-4 w-20 bg-gray-100 rounded mb-2" />
        <div className="h-10 w-40 bg-gray-200 rounded-lg mb-4" />
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-100 rounded-xl" />
          <div className="h-10 w-28 bg-gray-100 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-100 rounded-full" />
                <div>
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-24 bg-gray-50 rounded mt-1" />
                </div>
              </div>
              <div className="h-5 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
