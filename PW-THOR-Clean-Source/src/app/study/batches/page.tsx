"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, X, RefreshCw, AlertCircle } from "lucide-react";
import Carousel from "@/components/Carousel";
import BatchCard from "@/components/BatchCard";
import { BatchItem } from "@/types";
import { formatDate } from "@/lib/utils";

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  // Fetch batches with deduplication and pagination
  const fetchBatches = useCallback(
    async (query: string, pageNum: number) => {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        let url = "";
        const limit = 12;
        if (query.trim()) {
          url = `/api/searchBatch?name=${encodeURIComponent(query)}&page=${pageNum}&limit=${limit}`;
        } else {
          url = `/api/AllBatches?page=${pageNum}&limit=${limit}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load batches`);

        const data = await res.json();
        const rawBatches: BatchItem[] = data?.data || [];
        const hasMoreFlag = Boolean(data?.hasMore ?? rawBatches.length >= limit);

        // Format dates nicely
        const formatted = rawBatches.map((b) => ({
          ...b,
          startDate: formatDate(b.startDate),
          endDate: formatDate(b.endDate),
        }));

        setBatches((prev) => {
          if (pageNum === 1) {
            return formatted;
          }
          // Deduplicate items on append
          const existingIds = new Set(prev.map((b) => b._id));
          const newItems = formatted.filter((b) => !existingIds.has(b._id));
          return [...prev, ...newItems];
        });

        setHasMore(hasMoreFlag);
      } catch (err: any) {
        console.error("Batch load error:", err);
        setError(err.message || "Unable to connect to the batch catalog.");
        if (pageNum === 1) setBatches([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (mounted) {
      fetchBatches(debouncedQuery, page);
    }
  }, [debouncedQuery, page, mounted, fetchBatches]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchTerm.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedQuery("");
    setPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="bg-background border rounded-lg p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h1 className="text-2xl font-bold text-foreground">Batches</h1>
          {debouncedQuery && (
            <span className="text-xs text-muted-foreground">
              Showing search results for &quot;<strong className="text-foreground">{debouncedQuery}</strong>&quot;
            </span>
          )}
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="divshadow flex flex-wrap items-center gap-3 sm:gap-5"
        >
          <div className="relative w-full">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-muted-foreground">
              <Search strokeWidth={2.5} className="w-4 h-4" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow block w-full p-3.5 ps-10 pe-28 text-sm divshadow border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-foreground/5 text-foreground placeholder:text-muted-foreground"
              placeholder="Search across all public batches (e.g., NEET, JEE, UPSC, Arjuna, Lakshya)..."
            />

            <div className="absolute end-2.5 bottom-2 flex items-center gap-1.5">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="font-medium rounded-lg text-sm px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Promotional Carousel */}
        {!debouncedQuery && <Carousel />}

        {/* Error Notification */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchBatches(debouncedQuery, page)}
              className="flex items-center gap-1 font-semibold underline hover:no-underline"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Batches Grid */}
        {isLoading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            <BatchCard isPlaceholder priority />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
          </div>
        ) : batches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {batches.map((batch, index) => (
                <BatchCard
                  key={`${batch._id}-${index}`}
                  batch={batch}
                  priority={index < 3}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => !isLoadingMore && setPage((p) => p + 1)}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-border rounded-lg text-sm font-semibold hover:bg-muted text-foreground transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span>{isLoadingMore ? "Loading More Batches..." : "Load More Batches"}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No Batches Found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              We couldn&apos;t find any batch matching &quot;{debouncedQuery}&quot;. Try searching with a different keyword or examination name.
            </p>
            {debouncedQuery && (
              <button
                onClick={handleClearSearch}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Clear Search & View All Batches
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
