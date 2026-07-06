"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800/80 pt-6">
      {/* Previous Button */}
      <div>
        {currentPage > 1 ? (
          <button
            onClick={() => !loading && onPageChange(currentPage - 1)}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white transition-all shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            ← Previous
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
            ← Previous
          </span>
        )}
      </div>

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center gap-1.5">
        {(() => {
          const delta = 1;
          const range: (number | string)[] = [];
          for (let i = 1; i <= totalPages; i++) {
            if (
              i === 1 ||
              i === totalPages ||
              (i >= currentPage - delta && i <= currentPage + delta)
            ) {
              range.push(i);
            } else if (range[range.length - 1] !== "...") {
              range.push("...");
            }
          }

          return range.map((item, idx) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex items-center justify-center w-10 h-10 text-sm font-medium text-zinc-400 dark:text-zinc-650"
                >
                  ...
                </span>
              );
            }

            const pageNum = item as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => !loading && onPageChange(pageNum)}
                disabled={loading}
                className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-xl transition-all ${isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                    : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white"
                  } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {pageNum}
              </button>
            );
          });
        })()}
      </div>

      {/* Next Button */}
      <div>
        {currentPage < totalPages ? (
          <button
            onClick={() => !loading && onPageChange(currentPage + 1)}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-950 dark:hover:text-white transition-all shadow-sm ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
          >
            Next →
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-zinc-100 dark:border-zinc-900/60 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </div>
  );
}
