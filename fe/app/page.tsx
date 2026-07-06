import Link from "next/link";
import { Suspense } from "react";
import HeroSlider from "@/components/HeroSlider";
import ProductSlider from "@/components/ProductSlider";
import ProductSliderSkeleton from "@/components/ProductSliderSkeleton";

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
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

// Fetch products from backend
async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const apiBase = process.env.NEXT_API || "http://localhost:3010/api";
    // Fetch 12 items as requested for the slider and cache them
    const res = await fetch(`${apiBase}/product?limit=12&page=1&sortBy=stock&sortOrder=asc`, {
      next: { tags: ["featured-products"] },
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    const result = await res.json();

    // Extract products array from paginated response structure
    if (result.data && !Array.isArray(result.data) && Array.isArray(result.data.products)) {
      return result.data.products;
    }
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// Fetch categories from backend
async function getCategories(): Promise<Category[]> {
  try {
    const apiBase = process.env.NEXT_API || "http://localhost:3010/api";
    const res = await fetch(`${apiBase}/category`, {
      next: { tags: ["categories"] },
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    const result = await res.json();
    
    // Extract categories array from paginated response structure
    const data = result.data || result;
    if (data && !Array.isArray(data) && Array.isArray(data.categories)) {
      return data.categories;
    }
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Separate async component for data fetching
async function FeaturedProductsSection() {
  const products = await getFeaturedProducts();
  return <ProductSlider products={products} />;
}

export default async function Home() {
  const categories = await getCategories();

  const emojiMap: Record<string, string> = {
    keyboards: "⌨️",
    audio: "🎧",
    "desk-accessories": "💼",
    mice: "🖱️",
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Interactive Hero Slider Banner */}
      <HeroSlider />

      {/* Featured Products Grid as Slider */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Featured Tech
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Top handpicked devices for your workflow (4 items per page)
            </p>
          </div>
          <Link
            href="/product"
            className="group inline-flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            View all products
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Category filters / navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/product"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200/40 dark:border-zinc-800/40"
          >
            All Products
          </Link>
          {categories.map((category) => {
            const emoji = emojiMap[category.slug] || "📁";
            const colorClasses: Record<string, string> = {
              keyboards: "bg-violet-50 dark:bg-violet-950/30 text-violet-650 dark:text-violet-400 border-violet-100/50 dark:border-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-950/50",
              audio: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
              "desk-accessories": "bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 border-amber-100/50 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
              mice: "bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-950/50",
            };
            const currentColors = colorClasses[category.slug] || "bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 border-zinc-200/40 dark:border-zinc-800/40";
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${currentColors}`}
              >
                {emoji} {category.name} ({category.productCount})
              </Link>
            );
          })}
        </div>

        {/* Wrap in Suspense to show pulsing skeleton loader while fetching API */}
        <Suspense fallback={<ProductSliderSkeleton />}>
          <FeaturedProductsSection />
        </Suspense>
      </section>
    </div>
  );
}
