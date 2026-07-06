"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Data Models
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  createdAt: string;
}

interface ProductData {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image?: string;
  categoryId?: number;
  category?: {
    id: number;
    name: string;
  };
  createdAt: string;
}

// Slugify helper
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

export default function AdminPage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "users">("overview");

  // Domain records
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Loading and Error states
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form Modals open state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "user" | "category" | "product";
    id: number;
    name: string;
  } | null>(null);

  // Form state fields
  const [prodForm, setProdForm] = useState({
    name: "",
    slug: "",
    price: "",
    stock: "",
    image: "",
    categoryId: "",
  });
  const [isSlugManualProd, setIsSlugManualProd] = useState(false);

  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isSlugManualCat, setIsSlugManualCat] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Guard routing logic
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load all system data
  const loadAllData = async () => {
    if (!isAuthenticated || user?.role !== "admin") return;
    
    setLoadingData(true);
    setErrorMessage("");
    try {
      // Fetch concurrently
      const [usersRes, catsRes, prodsRes] = await Promise.all([
        apiRequest("/auth/users"),
        apiRequest("/category"),
        apiRequest("/product?limit=100"), // Load up to 100 products for administration panel
      ]);

      const uData = usersRes.data || usersRes;
      setUsers(Array.isArray(uData) ? uData : []);

      const cData = catsRes.data || catsRes;
      setCategories(Array.isArray(cData) ? cData : []);
      
      // Handle potential pagination object vs raw array for products
      let pData: ProductData[] = [];
      if (prodsRes) {
        if (Array.isArray(prodsRes)) {
          pData = prodsRes;
        } else if (prodsRes.data) {
          if (Array.isArray(prodsRes.data)) {
            pData = prodsRes.data;
          } else if (prodsRes.data.products && Array.isArray(prodsRes.data.products)) {
            pData = prodsRes.data.products;
          }
        } else if (prodsRes.products && Array.isArray(prodsRes.products)) {
          pData = prodsRes.products;
        }
      }
      setProducts(pData);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load database records.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [isAuthenticated, user]);

  // Handle Tab Switch & Reset Search
  const switchTab = (tab: "overview" | "products" | "categories" | "users") => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  // ----------------------------------------
  // CATEGORY OPERATIONS
  // ----------------------------------------
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatForm({ name: "", slug: "", description: "" });
    setIsSlugManualCat(false);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryData) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    });
    setIsSlugManualCat(true);
    setIsCategoryModalOpen(true);
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isSlugManualCat) {
      setCatForm((prev) => ({ ...prev, name: val, slug: slugify(val) }));
    } else {
      setCatForm((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) {
      showToast("Name and slug are required.", "error");
      return;
    }

    try {
      if (editingCategory) {
        // Edit Category
        await apiRequest(`/category/${editingCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify(catForm),
        });
        showToast("Category updated successfully!");
      } else {
        // Create Category
        await apiRequest("/category", {
          method: "POST",
          body: JSON.stringify(catForm),
        });
        showToast("Category created successfully!");
      }
      setIsCategoryModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save category.", "error");
    }
  };

  // ----------------------------------------
  // PRODUCT OPERATIONS
  // ----------------------------------------
  const openAddProduct = () => {
    setEditingProduct(null);
    setProdForm({
      name: "",
      slug: "",
      price: "",
      stock: "",
      image: "",
      categoryId: categories[0]?.id?.toString() || "",
    });
    setIsSlugManualProd(false);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: ProductData) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name,
      slug: prod.slug,
      price: prod.price.toString(),
      stock: prod.stock.toString(),
      image: prod.image || "",
      categoryId: prod.categoryId?.toString() || "",
    });
    setIsSlugManualProd(true);
    setIsProductModalOpen(true);
  };

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isSlugManualProd) {
      setProdForm((prev) => ({ ...prev, name: val, slug: slugify(val) }));
    } else {
      setProdForm((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, slug, price, stock, image, categoryId } = prodForm;

    if (!name || !slug || !price || !stock) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      name,
      slug,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      image: image || null,
      categoryId: categoryId ? parseInt(categoryId, 10) : null,
    };

    try {
      if (editingProduct) {
        // Edit Product
        await apiRequest(`/product/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast("Product updated successfully!");
      } else {
        // Create Product
        await apiRequest("/product", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Product created successfully!");
      }
      setIsProductModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to save product.", "error");
    }
  };

  // ----------------------------------------
  // USER OPERATIONS (Role & Delete)
  // ----------------------------------------
  const handleToggleUserRole = async (userId: number, currentRole: string) => {
    const targetRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiRequest(`/auth/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: targetRole }),
      });
      showToast(`User role updated to ${targetRole}!`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update user role.", "error");
    }
  };

  // ----------------------------------------
  // GLOBAL DELETE CONFIRMATION
  // ----------------------------------------
  const triggerDeleteConfirm = (type: "user" | "category" | "product", id: number, name: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    let path = "";
    if (type === "product") path = `/product/${id}`;
    else if (type === "category") path = `/category/${id}`;
    else if (type === "user") path = `/auth/users/${id}`;

    try {
      await apiRequest(path, { method: "DELETE" });
      showToast(`Successfully deleted ${type}!`);
      setDeleteConfirm(null);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || `Failed to delete ${type}.`, "error");
    }
  };

  // Filters for tables
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Guard view
  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-650 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Authenticating admin session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Admin Management Console
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            Configure system configurations, manage category lists, inventory items, and client users.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadAllData} disabled={loadingData} className="cursor-pointer">
            {loadingData ? "Syncing..." : "Sync Database"}
          </Button>
          <Button variant="destructive" onClick={logout} className="cursor-pointer">
            Logout
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-950/40 border border-red-250 dark:border-red-900 text-red-800 dark:text-red-400 text-sm rounded-md font-medium">
          {errorMessage}
        </div>
      )}

      {/* Main Admin layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => switchTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Overview Metrics
          </button>

          <button
            onClick={() => switchTab("products")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products ({products.length})
          </button>

          <button
            onClick={() => switchTab("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Categories ({categories.length})
          </button>

          <button
            onClick={() => switchTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users ({users.length})
          </button>
        </div>

        {/* Tab Detail Panel */}
        <div className="lg:col-span-3">

          {/* OVERVIEW PANEL */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-zinc-100 dark:text-zinc-900 group-hover:scale-110 transition-transform">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total System Users</div>
                  <div className="text-3xl font-extrabold mt-2 text-zinc-900 dark:text-white">{users.length}</div>
                  <div className="mt-3 text-xs text-zinc-450 dark:text-zinc-500">
                    {users.filter((u) => u.role === "admin").length} Admins &middot; {users.filter((u) => u.role === "user").length} standard accounts
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-zinc-100 dark:text-zinc-900 group-hover:scale-110 transition-transform">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total Products</div>
                  <div className="text-3xl font-extrabold mt-2 text-zinc-900 dark:text-white">{products.length}</div>
                  <div className="mt-3 text-xs text-zinc-450 dark:text-zinc-500">
                    {products.reduce((acc, p) => acc + p.stock, 0)} items in stock inventory
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 text-zinc-100 dark:text-zinc-900 group-hover:scale-110 transition-transform">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Product Categories</div>
                  <div className="text-3xl font-extrabold mt-2 text-zinc-900 dark:text-white">{categories.length}</div>
                  <div className="mt-3 text-xs text-zinc-450 dark:text-zinc-500">
                    Used for website taxonomy and catalog routing
                  </div>
                </Card>
              </div>

              {/* Quick Actions Card */}
              <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Administrative Shortcut Panels</CardTitle>
                  <CardDescription>Launch wizards and administration drawers instantly.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button onClick={openAddProduct} className="flex items-center gap-2 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                  </Button>
                  <Button onClick={openAddCategory} variant="secondary" className="flex items-center gap-2 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </Button>
                  <Button onClick={() => switchTab("users")} variant="outline" className="flex items-center gap-2 cursor-pointer">
                    Manage Roles
                  </Button>
                </CardContent>
              </Card>

              {/* Server Info Card */}
              <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 text-sm text-zinc-500">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Environment Node URL</span>
                    <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_API || "http://localhost:3010/api"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-850 pb-2">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Admin Account</span>
                    <span>{user.name} ({user.email})</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">DB Status Connection</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Active
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* PRODUCTS TAB PANEL */}
          {activeTab === "products" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Catalog Products Database</CardTitle>
                  <CardDescription>Create, review, edit, and delete store products.</CardDescription>
                </div>
                <Button onClick={openAddProduct} className="flex items-center gap-2 self-start sm:self-center cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Product
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search query input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <Input
                    placeholder="Search by product name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {loadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-500 text-xs">Syncing products database records...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No products matching search query found.
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Preview</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Name / Slug</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Category</th>
                          <th className="px-4 py-3 text-right font-semibold text-zinc-500">Price</th>
                          <th className="px-4 py-3 text-right font-semibold text-zinc-500">Stock</th>
                          <th className="px-4 py-3 text-center font-semibold text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-10 h-10 object-cover rounded-md border border-zinc-200 dark:border-zinc-800"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 flex items-center justify-center text-xs font-semibold text-zinc-400">
                                  No Img
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</div>
                              <div className="font-mono text-xs text-zinc-400 mt-0.5">{p.slug}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-zinc-650 dark:text-zinc-355 font-medium">
                              {p.category?.name || <span className="text-zinc-400 italic">None</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                              ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <span className={`inline-block font-semibold px-2 py-0.5 rounded-full text-xs ${
                                p.stock === 0
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                                  : p.stock < 10
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}>
                                {p.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="inline-flex rounded-md shadow-sm">
                                <button
                                  onClick={() => openEditProduct(p)}
                                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-l-md cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => triggerDeleteConfirm("product", p.id, p.name)}
                                  className="px-3 py-1.5 text-xs font-medium border-t border-b border-r border-zinc-200 dark:border-zinc-800 bg-white hover:bg-red-50 hover:text-red-650 dark:bg-zinc-950 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-zinc-700 dark:text-zinc-300 rounded-r-md cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* CATEGORIES TAB PANEL */}
          {activeTab === "categories" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Product Categories Database</CardTitle>
                  <CardDescription>Create, review, edit, and delete store categories.</CardDescription>
                </div>
                <Button onClick={openAddCategory} className="flex items-center gap-2 self-start sm:self-center cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Category
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <Input
                    placeholder="Search by category name or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {loadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-500 text-xs">Syncing categories database records...</p>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No categories matching search query found.
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Name / Slug</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Description</th>
                          <th className="px-4 py-3 text-right font-semibold text-zinc-500">Product Count</th>
                          <th className="px-4 py-3 text-center font-semibold text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredCategories.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                              <div className="font-mono text-xs text-zinc-400 mt-0.5">{c.slug}</div>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate text-zinc-500 dark:text-zinc-400">
                              {c.description || <span className="italic text-zinc-350">No description</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                              {c.productCount ?? 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="inline-flex rounded-md shadow-sm">
                                <button
                                  onClick={() => openEditCategory(c)}
                                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-l-md cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => triggerDeleteConfirm("category", c.id, c.name)}
                                  className="px-3 py-1.5 text-xs font-medium border-t border-b border-r border-zinc-200 dark:border-zinc-800 bg-white hover:bg-red-50 hover:text-red-650 dark:bg-zinc-950 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-zinc-700 dark:text-zinc-300 rounded-r-md cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* USERS TAB PANEL */}
          {activeTab === "users" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <CardHeader>
                <CardTitle>System Accounts Database</CardTitle>
                <CardDescription>Monitor credentials database, adjust operational roles, or terminate records.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <Input
                    placeholder="Search by full name or email address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {loadingData ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-500 text-xs">Syncing user database accounts...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    No users matching search query found.
                  </div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">User ID</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">FullName</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">Email Address</th>
                          <th className="px-4 py-3 text-left font-semibold text-zinc-500">System Role</th>
                          <th className="px-4 py-3 text-center font-semibold text-zinc-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-400">
                              {u.id}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-zinc-900 dark:text-zinc-100">
                              {u.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-zinc-650 dark:text-zinc-355 font-medium">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                u.role === "admin"
                                  ? "bg-violet-100 text-violet-850 dark:bg-violet-950/60 dark:text-violet-300"
                                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {/* Prevent modifying yourself to avoid lockout */}
                              {user.email.toLowerCase() === u.email.toLowerCase() ? (
                                <span className="text-xs text-zinc-400 italic">Current Session</span>
                              ) : (
                                <div className="inline-flex rounded-md shadow-sm">
                                  <button
                                    onClick={() => handleToggleUserRole(u.id, u.role)}
                                    className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-l-md cursor-pointer"
                                  >
                                    Toggle Role
                                  </button>
                                  <button
                                    onClick={() => triggerDeleteConfirm("user", u.id, u.name)}
                                    className="px-3 py-1.5 text-xs font-medium border-t border-b border-r border-zinc-200 dark:border-zinc-800 bg-white hover:bg-red-50 hover:text-red-650 dark:bg-zinc-950 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-zinc-700 dark:text-zinc-300 rounded-r-md cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* ----------------------------------------
          PRODUCT CREATION / EDITION MODAL
          ---------------------------------------- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-150">
                {editingProduct ? `Edit Catalog Details: ${editingProduct.name}` : "Create New Inventory Product"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Name *</label>
                  <Input
                    required
                    value={prodForm.name}
                    onChange={handleProductNameChange}
                    placeholder="e.g. Next-Gen Gaming Headset"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">SEO Handle Slug *</label>
                    <label className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSlugManualProd}
                        onChange={(e) => setIsSlugManualProd(e.target.checked)}
                        className="rounded accent-violet-600"
                      />
                      Edit manual
                    </label>
                  </div>
                  <Input
                    required
                    disabled={!isSlugManualProd}
                    value={prodForm.slug}
                    onChange={(e) => setProdForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    placeholder="next-gen-gaming-headset"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-60"
                  />
                </div>

                {/* Price and Stock Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price (USD) *</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={prodForm.price}
                      onChange={(e) => setProdForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="99.99"
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock Inventory *</label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={prodForm.stock}
                      onChange={(e) => setProdForm(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="50"
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                {/* Category Dropdown Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Category</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-650 cursor-pointer"
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image URL Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Image URL Source</label>
                  <Input
                    type="url"
                    value={prodForm.image}
                    onChange={(e) => setProdForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="https://images.unsplash.com/... or /images/..."
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Provide a valid image URL link. Media uploads can be integrated in later phases.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------
          CATEGORY CREATION / EDITION MODAL
          ---------------------------------------- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-150">
                {editingCategory ? `Edit Taxonomy: ${editingCategory.name}` : "Create New Catalog Category"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory}>
              <div className="p-6 space-y-4">
                {/* Category Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category Name *</label>
                  <Input
                    required
                    value={catForm.name}
                    onChange={handleCategoryNameChange}
                    placeholder="e.g. Mechanical Keyboards"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">SEO Handle Slug *</label>
                    <label className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSlugManualCat}
                        onChange={(e) => setIsSlugManualCat(e.target.checked)}
                        className="rounded accent-violet-600"
                      />
                      Edit manual
                    </label>
                  </div>
                  <Input
                    required
                    disabled={!isSlugManualCat}
                    value={catForm.slug}
                    onChange={(e) => setCatForm(prev => ({ ...prev, slug: slugify(e.target.value) }))}
                    placeholder="mechanical-keyboards"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-60"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category Description</label>
                  <textarea
                    rows={3}
                    value={catForm.description}
                    onChange={(e) => setCatForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Premium quality mechanical switches and boards."
                    className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" className="cursor-pointer">
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------
          GLOBAL CONFIRM DELETE DRAWER
          ---------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="p-6 text-center space-y-4">
              {/* Danger Warning Icon */}
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto text-red-650 dark:text-red-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-150">Confirm Deletion</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                  Are you absolutely sure you want to delete the {deleteConfirm.type} <strong className="text-zinc-900 dark:text-zinc-200">"{deleteConfirm.name}"</strong>?
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="cursor-pointer">
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeDelete} className="cursor-pointer">
                Delete Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------
          FLOATING ACTION NOTIFICATION TOAST
          ---------------------------------------- */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-sm font-semibold transition-all duration-300 transform translate-y-0 animate-fade-in ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-250 dark:border-emerald-850 text-emerald-800 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-950/90 border-red-250 dark:border-red-850 text-red-800 dark:text-red-300"
        }`}>
          <span className="text-base">{toast.type === "success" ? "✓" : "✗"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
