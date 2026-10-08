import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageCount = Math.max(1, Number(totalPages) || 1);
  const activePage = Math.min(Math.max(1, Number(currentPage) || 1), pageCount);

  const getPageItems = () => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
    if (activePage <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', pageCount];
    if (activePage >= pageCount - 3) {
      return [1, 'start-ellipsis', ...Array.from({ length: 5 }, (_, index) => pageCount - 4 + index)];
    }
    return [
      1,
      'start-ellipsis',
      activePage - 1,
      activePage,
      activePage + 1,
      'end-ellipsis',
      pageCount,
    ];
  };

  const changePage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), pageCount);
    if (safePage !== activePage) onPageChange(safePage);
  };

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 py-6"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => changePage(activePage - 1)}
        disabled={activePage <= 1}
        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageItems().map((page) => {
        if (typeof page === 'string') {
          return (
            <span key={page} className="flex h-9 w-7 items-end justify-center pb-1 text-slate-400" aria-hidden="true">
              …
            </span>
          );
        }

        const isActive = page === activePage;
        return (
          <button
            type="button"
            key={page}
            onClick={() => changePage(page)}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? 'page' : undefined}
            className={`w-9 h-9 rounded-lg text-xs font-semibold transition ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => changePage(activePage + 1)}
        disabled={activePage >= pageCount}
        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <span className="ml-1 hidden text-[11px] font-medium text-slate-400 sm:inline">
        Page {activePage} of {pageCount}
      </span>
    </nav>
  );
};
