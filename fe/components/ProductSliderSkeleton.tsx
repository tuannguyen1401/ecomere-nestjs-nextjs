export default function ProductSliderSkeleton() {
  return (
    <div className="relative w-full px-12 md:px-16 animate-pulse">
      {/* Slider Viewport Skeleton */}
      <div className="overflow-hidden w-full rounded-3xl p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200/50 overflow-hidden p-0"
            >
              {/* Image box placeholder */}
              <div className="relative aspect-square w-full bg-zinc-100 border-b border-zinc-100" />

              {/* Content placeholder */}
              <div className="flex flex-col flex-1 p-4">
                {/* Title line 1 */}
                <div className="h-4 bg-zinc-200/80 rounded-md w-11/12 mb-2" />
                {/* Title line 2 */}
                <div className="h-4 bg-zinc-200/80 rounded-md w-2/3" />

                {/* Price and Details link */}
                <div className="mt-auto pt-8 flex items-center justify-between">
                  <div className="h-6 bg-zinc-200/80 rounded-md w-1/3" />
                  <div className="h-4 bg-zinc-200/80 rounded-md w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots skeleton */}
      <div className="flex justify-center gap-2 mt-8">
        <div className="w-8 h-2.5 rounded-full bg-violet-200/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-200/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-200/80" />
      </div>
    </div>
  );
}
