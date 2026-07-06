"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LazyImage from "@/components/LazyImage";
import AddToCartButton from "@/components/AddToCartButton";

interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image?: string;
  categoryId?: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

interface ProductSliderProps {
  products: Product[];
}

export default function ProductSlider({ products }: ProductSliderProps) {
  // Group products into pages of 4 items
  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const [index, setIndex] = useState(totalPages > 1 ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Generate pages
  const originalPages = Array.from({ length: totalPages }).map((_, pageIndex) => {
    return products.slice(
      pageIndex * itemsPerPage,
      (pageIndex + 1) * itemsPerPage
    );
  });

  // Create an array of pages with clones at both ends for infinite looping
  let displayPages = originalPages;
  if (totalPages > 1) {
    const firstPageClone = originalPages[0];
    const lastPageClone = originalPages[totalPages - 1];
    displayPages = [lastPageClone, ...originalPages, firstPageClone];
  }

  const nextPage = () => {
    if (!isTransitioning) return;
    setIndex((prev) => prev + 1);
  };

  const prevPage = () => {
    if (!isTransitioning) return;
    setIndex((prev) => prev - 1);
  };

  const handleTransitionEnd = () => {
    if (totalPages <= 1) return;

    if (index === totalPages + 1) {
      // Snaps to real page 0 (index 1) without animation
      setIsTransitioning(false);
      setIndex(1);
    } else if (index === 0) {
      // Snaps to real last page (index totalPages) without animation
      setIsTransitioning(false);
      setIndex(totalPages);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        // Force reflow/tick so browser registers the style snap before re-enabling transition
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
        <div className="inline-flex p-3 rounded-full bg-zinc-900 text-zinc-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-md font-semibold text-zinc-200">No products found</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
          Please make sure the NestJS backend is running on port 3010 and the database is successfully seeded.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full px-12 md:px-16 group/slider">
      {/* Slider viewport */}
      <div className="overflow-hidden w-full rounded-3xl p-1">
        <div
          className={`flex ${isTransitioning ? "transition-transform duration-500 ease-out" : ""}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displayPages.map((pageProducts, pageIdx) => {
            return (
              <div
                key={pageIdx}
                className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-1"
              >
                {pageProducts.map((product) => (
                  <Link
                    href={`/product/${product.slug}`}
                    key={product.id}
                    className="group flex flex-col h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900/80 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:-translate-y-1"
                  >
                    {/* Image container */}
                    <div className="relative aspect-square w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
                      {product.image ? (
                        <LazyImage
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900">
                          No Image
                        </div>
                      )}
                      {/* Category Badge */}
                      {product.category?.name && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900/60 dark:bg-zinc-800/80 text-zinc-100 backdrop-blur-sm border border-white/10">
                            {product.category.name}
                          </span>
                        </div>
                      )}
                      {/* Badge stock */}
                      <div className="absolute top-3 right-3">
                        {product.stock > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            In Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white text-sm line-clamp-2 min-h-[40px] leading-tight transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-base font-bold text-zinc-900 dark:text-white">
                          ${product.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <AddToCartButton product={product} />
                          <span className="text-xs text-violet-600 dark:text-violet-400 group-hover:underline inline-flex items-center gap-0.5">
                            Details
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white p-3 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-md dark:shadow-xl transition-all cursor-pointer z-10"
            aria-label="Previous Page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={nextPage}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white p-3 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 shadow-md dark:shadow-xl transition-all cursor-pointer z-10"
            aria-label="Next Page"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
