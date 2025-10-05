// Optimized loading component with minimal overhead
export function OptimizedLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Lightweight skeleton for driver dashboard
export function DriverSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 animate-pulse">
      <div className="max-w-md mx-auto space-y-4">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}