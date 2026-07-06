"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LazyImage from "@/components/LazyImage";
import Pagination from "@/components/Pagination";
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

interface PaginatedResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ProductsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read page from search parameters
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = 8;

  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const apiBase = process.env.NEXT_PUBLIC_API || "http://localhost:3010/api";
    
    fetch(`${apiBase}/product?page=${currentPage}&limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        if (!isMounted) return;
        
        if (Array.isArray(result.data)) {
          setData({
            products: result.data,
            total: result.data.length,
            page: 1,
            limit: limit,
            totalPages: 1
          });
        } else {
          setData(result.data || { products: [], total: 0, page: 1, limit, totalPages: 1 });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        if (isMounted) {
          setData({ products: [], total: 0, page: 1, limit, totalPages: 1 });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage]);

  // Initial loading skeleton (only when we don't have any data yet)
  if (!data && loading) {
    return <ProductsListFallback />;
  }

  const { products, total, totalPages } = data || { products: [], total: 0, totalPages: 1 };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors mb-4 group"
        >
          <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to Home
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Explore All Products
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-650 dark:bg-violet-400 animate-ping" />
              Loading products...
            </span>
          ) : (
            `Showing products ${Math.min((currentPage - 1) * limit + 1, total)} - ${Math.min(currentPage * limit, total)} of ${total} premium items.`
          )}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[500px]">
          {Array.from({ length: limit }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden shadow-sm animate-pulse"
            >
              <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-900" />
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
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900/10">
          <div className="inline-flex p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 mb-4">
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
          <h3 className="text-md font-semibold text-zinc-800 dark:text-zinc-200">No products found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Please make sure the NestJS backend is running on port 3010 and the database is successfully seeded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
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
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
                    ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => router.push(`/product?page=${page}`)}
        loading={loading}
      />
    </div>
  );
}

function ProductsListFallback() {
  return (
    <div className="animate-pulse">
      <div className="mb-10">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4" />
        <div className="h-10 w-64 bg-zinc-300 dark:bg-zinc-800 rounded-xl mb-2" />
        <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800/60 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col h-full bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 overflow-hidden shadow-sm"
          >
            <div className="relative aspect-square w-full bg-zinc-200 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-900" />
            <div className="flex flex-col flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-4/6 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<ProductsListFallback />}>
          <ProductsListContent />
        </Suspense>
      </div>
    </div>
  );
}
