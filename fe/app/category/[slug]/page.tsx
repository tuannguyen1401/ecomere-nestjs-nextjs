import { notFound } from "next/navigation";
import { Suspense } from "react";
import CategoryProductsList from "./CategoryProductsList";

// Fetch category info from backend (Server Side for SEO)
// Fetch category info from backend (Server Side for SEO)
async function getCategoryInfo(slug: string): Promise<{ categoryName: string; categoryDesc?: string; exists: boolean }> {
  try {
    const apiBase = process.env.NEXT_API || "http://localhost:3010/api";
    const res = await fetch(`${apiBase}/category/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return { categoryName: slug, exists: false };
    const result = await res.json();
    const categoryData = result.data;

    return {
      categoryName: categoryData?.name || slug,
      categoryDesc: categoryData?.description || "",
      exists: !!categoryData,
    };
  } catch (error) {
    console.error("Error fetching category info:", error);
    return { categoryName: slug, exists: false };
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function CategoryFallback({ name, desc }: { name: string; desc?: string }) {
  return (
    <div className="animate-pulse">
      <div className="mb-10">
        <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-4" />
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4" />
        <h1 className="h-10 w-64 bg-zinc-300 dark:bg-zinc-800 rounded-xl mb-2" />
        {desc && <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800/60 rounded-lg" />}
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

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const { categoryName, categoryDesc, exists } = await getCategoryInfo(slug);
  if (!exists) {
    notFound();
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<CategoryFallback name={categoryName} desc={categoryDesc} />}>
          <CategoryProductsList slug={slug} initialCategoryName={categoryName} initialCategoryDesc={categoryDesc} />
        </Suspense>
      </div>
    </div>
  );
}
