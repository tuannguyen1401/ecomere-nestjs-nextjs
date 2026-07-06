import Link from "next/link";
import LazyImage from "@/components/LazyImage";
import ProductDetailAddToCart from "@/components/ProductDetailAddToCart";
import { notFound } from "next/navigation";

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

// Fetch single product from backend by slug
async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const apiBase = process.env.NEXT_API || "http://localhost:3010/api";
    const res = await fetch(`${apiBase}/product/slug/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result.data || null;
  } catch (error) {
    console.error(`Error fetching product by slug ${slug}:`, error);
    return null;
  }
}

// Generate premium mock features based on product name
function getProductSpecs(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("iphone") || lowerName.includes("galaxy") || lowerName.includes("phone")) {
    return {
      description: "Experience the next generation of mobile performance. Featuring a stunning OLED display, advanced camera systems, and all-day battery life, this smartphone is built for those who demand the absolute best in their pocket.",
      specs: [
        { label: "Display", value: "Super Retina / Dynamic AMOLED 120Hz" },
        { label: "Processor", value: "Octa-Core flagship chip with AI Neural Engine" },
        { label: "Camera", value: "Pro Camera System (Wide, Ultra Wide, Telephoto)" },
        { label: "Connectivity", value: "5G LTE, Wi-Fi 6E, Bluetooth 5.3" },
        { label: "Protection", value: "Water and dust resistant (IP68)" }
      ]
    };
  } else if (lowerName.includes("macbook") || lowerName.includes("dell") || lowerName.includes("rog") || lowerName.includes("xps")) {
    return {
      description: "Supercharged for professional workloads. Engineered with high-efficiency architecture, this laptop offers stunning visuals, silent active cooling, and exceptional battery efficiency to power through compiling, design, and heavy rendering tasks.",
      specs: [
        { label: "Processor", value: "Flagship Multi-Core CPU" },
        { label: "Memory", value: "High-speed unified architecture" },
        { label: "Display", value: "High-resolution display with wide color gamut (P3)" },
        { label: "Audio", value: "Studio-quality multi-speaker system with spatial audio" },
        { label: "Keyboard", value: "Backlit keyboard with precise keystroke response" }
      ]
    };
  } else if (lowerName.includes("sony") || lowerName.includes("headphones") || lowerName.includes("quietcomfort") || lowerName.includes("airpods") || lowerName.includes("stanmore") || lowerName.includes("era")) {
    return {
      description: "Immerse yourself in pure acoustic excellence. Calibrated by award-winning sound engineers, these audio devices deliver deep, rich bass, ultra-crisp highs, and world-class noise cancellation to create your personal sonic sanctuary.",
      specs: [
        { label: "Acoustic System", value: "High-Resolution Audio certified drivers" },
        { label: "Noise Cancellation", value: "Smart Adaptive Active Noise Cancellation (ANC)" },
        { label: "Battery Life", value: "Up to 30 hours of continuous playback" },
        { label: "Microphones", value: "Beamforming microphone array for crystal-clear calls" },
        { label: "Charging", value: "Fast charge via USB-C (5 min charge = 3 hours playback)" }
      ]
    };
  } else {
    return {
      description: "Designed to elevate your daily digital experience. Built using high-grade materials, this premium accessory offers seamless compatibility, sleek ergonomics, and durable longevity to complement your workstation.",
      specs: [
        { label: "Material", value: "Anodized aluminum & premium composites" },
        { label: "Compatibility", value: "Windows, macOS, iOS, Android, and Linux" },
        { label: "Power Source", value: "Rechargeable high-capacity battery via USB-C" },
        { label: "Connection Type", value: "Ultra-low latency wireless + Bluetooth" },
        { label: "Warranty", value: "12-month manufacturer warranty" }
      ]
    };
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const { description, specs } = getProductSpecs(product.name);

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/product"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors group"
          >
            <span className="transform group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Products
          </Link>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-10 shadow-sm transition-colors duration-300">
          {/* Left Column: Product Image */}
          <div className="relative aspect-square w-full rounded-2xl bg-zinc-50 dark:bg-zinc-950 overflow-hidden border border-zinc-100 dark:border-zinc-900 shadow-inner">
            {product.image ? (
              <LazyImage
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-900">
                No Image Available
              </div>
            )}
          </div>

          {/* Right Column: Information */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Stock & Category Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock ({product.stock} units remaining)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Out of Stock
                  </span>
                )}
                {product.category?.name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors">
                    {product.category.name}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight mb-2">
                {product.name}
              </h1>
              
              <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-gradient-to-r from-violet-600 dark:from-violet-400 to-fuchsia-600 dark:to-fuchsia-400 bg-clip-text mb-6">
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* Description */}
              <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed mb-8">
                {description}
              </p>

              {/* Specification Table */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
                   Product Specifications
                </h3>
                <dl className="grid grid-cols-1 gap-y-3">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex justify-between py-1 text-xs border-b border-zinc-100 dark:border-zinc-800">
                      <dt className="text-zinc-500 dark:text-zinc-400 font-medium">{spec.label}</dt>
                      <dd className="text-zinc-700 dark:text-zinc-300 font-semibold text-right max-w-xs">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Action Buttons */}
            <ProductDetailAddToCart
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.image,
                stock: product.stock,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
