export default function ProductsLoading() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Page Header Skeleton */}
        <div className="mb-10 animate-pulse">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4" />
          <div className="h-10 w-64 bg-zinc-300 dark:bg-zinc-800 rounded-xl mb-2" />
          <div className="h-4 w-96 bg-zinc-250 dark:bg-zinc-850 rounded-lg" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden shadow-sm animate-pulse"
            >
              {/* Image Skeleton */}
              <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-850 border-b border-zinc-100 dark:border-zinc-900" />

              {/* Content Skeleton */}
              <div className="flex flex-col flex-1 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-4 w-4/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="h-6 w-16 bg-zinc-300 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-12 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-6 animate-pulse">
          <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
          <div className="hidden sm:flex items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
          <div className="h-10 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
