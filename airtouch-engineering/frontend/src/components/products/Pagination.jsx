import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onLoadMore,
  canLoadMore = false,
  isLoadingMore = false,
  mode = 'both', // 'pages' | 'loadMore' | 'both'
}) {
  if (totalItems === 0 || totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  const displayedCount = Math.min(currentPage * itemsPerPage, totalItems)
  const progressPercent = Math.min(100, Math.round((displayedCount / totalItems) * 100))

  return (
    <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col items-center gap-6">
      {/* Progress Indicator */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
          Showing <span className="text-white font-bold">{displayedCount}</span> of{' '}
          <span className="text-orange-400 font-bold">{totalItems}</span> components
        </span>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Load More Button (if canLoadMore) */}
      {(mode === 'loadMore' || mode === 'both') && canLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoadingMore ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              <span>Loading More Components...</span>
            </>
          ) : (
            <span>Load More Components</span>
          )}
        </button>
      )}

      {/* Classic Page Number Buttons */}
      {(mode === 'pages' || mode === 'both') && totalPages > 1 && (
        <nav
          aria-label="Pagination Navigation"
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page numbers */}
          {pages.map((p) => {
            const isActive = p === currentPage
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-black shadow-[0_0_14px_rgba(249,115,22,0.4)]'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {p}
              </button>
            )
          })}

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  )
}

