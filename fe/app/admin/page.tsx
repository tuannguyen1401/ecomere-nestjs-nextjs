"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { uploadFile, validateFile, formatFileSize } from "@/utils/upload";
import { getImageUrl } from "@/components/LazyImage";
import ErrorDisplay from "@/components/ErrorDisplay";
import ErrorBoundary from "@/components/ErrorBoundary";
import { getErrorMessage } from "@/utils/error";
import { useNotification } from "@/context/NotificationContext";
import { ApiError } from "@/utils/api-error";

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

  // Product pagination state
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productLimit, setProductLimit] = useState(10);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const debouncedProductSearch = useDebounce(productSearchInput, 400);

  // Category pagination state
  const [catPage, setCatPage] = useState(1);
  const [catTotalPages, setCatTotalPages] = useState(1);
  const [catTotal, setCatTotal] = useState(0);
  const [catSearchInput, setCatSearchInput] = useState("");
  const [catLimit, setCatLimit] = useState(20);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const debouncedCatSearch = useDebounce(catSearchInput, 400);

  // User search state (client-side only)
  const [userSearch, setUserSearch] = useState("");

  // Global notification system (success/error/warning)
  const { notify } = useNotification();

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

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [isSlugManualCat, setIsSlugManualCat] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    notify(message, type, type === "error" ? 6000 : 3500);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploadedFileName(null);
    setDragOver(false);
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
      if (Array.isArray(cData)) {
        setCategories(cData);
        setCatTotal(cData.length);
      } else if (cData?.categories) {
        setCategories(cData.categories);
        setCatTotal(cData.total ?? cData.categories.length);
        setCatTotalPages(cData.totalPages ?? 1);
      }

      // Handle potential pagination object vs raw array for products
      let pData: ProductData[] = [];
      let pTotal = 0;
      let pTotalPages = 1;
      if (prodsRes) {
        if (Array.isArray(prodsRes)) {
          pData = prodsRes;
          pTotal = prodsRes.length;
        } else if (prodsRes.data) {
          if (Array.isArray(prodsRes.data)) {
            pData = prodsRes.data;
            pTotal = prodsRes.data.length;
          } else if (prodsRes.data.products && Array.isArray(prodsRes.data.products)) {
            pData = prodsRes.data.products;
            pTotal = prodsRes.data.total ?? prodsRes.data.products.length;
            pTotalPages = prodsRes.data.totalPages ?? 1;
          }
        } else if (prodsRes.products && Array.isArray(prodsRes.products)) {
          pData = prodsRes.products;
          pTotal = prodsRes.total ?? prodsRes.products.length;
          pTotalPages = prodsRes.totalPages ?? 1;
        }
      }
      setProducts(pData);
      setProductTotal(pTotal);
      setProductTotalPages(pTotalPages);
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, "Failed to load database records."));
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
    // Reset search của tab tương ứng khi chuyển tab
    if (tab === "products") {
      setProductSearchInput("");
      setProductPage(1);
    } else if (tab === "categories") {
      setCatSearchInput("");
      setCatPage(1);
    } else if (tab === "users") {
      setUserSearch("");
    }
  };

  // Fetch products với pagination + search + configurable limit (server-side)
  const fetchProducts = useCallback(async (page: number, search: string, limit: number = 10) => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      const res = await apiRequest(`/product?${params.toString()}`);
      const data = res.data || res;
      if (data.products) {
        setProducts(data.products);
        setProductTotal(data.total ?? data.products.length);
        setProductTotalPages(data.totalPages ?? 1);
        setProductPage(data.page ?? page);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setProductTotal(data.length);
        setProductTotalPages(1);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to load products."), "error");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch categories với pagination + search + configurable limit (server-side)
  const fetchCategories = useCallback(async (page: number, search: string, limit: number = 20) => {
    setLoadingCategories(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      const res = await apiRequest(`/category?${params.toString()}`);
      const data = res.data || res;
      if (data.categories) {
        setCategories(data.categories);
        setCatTotal(data.total ?? data.categories.length);
        setCatTotalPages(data.totalPages ?? 1);
        setCatPage(data.page ?? page);
      } else if (Array.isArray(data)) {
        setCategories(data);
        setCatTotal(data.length);
        setCatTotalPages(1);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to load categories."), "error");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Refresh data theo tab đang active + loadAllData cho overview
  const reloadCurrentTab = useCallback(() => {
    loadAllData();
    if (activeTab === "products") {
      fetchProducts(productPage, debouncedProductSearch, productLimit);
    } else if (activeTab === "categories") {
      fetchCategories(catPage, debouncedCatSearch, catLimit);
    }
  }, [activeTab, productPage, debouncedProductSearch, productLimit, catPage, debouncedCatSearch, catLimit, fetchProducts, fetchCategories]);

  // Auto-fetch products khi active tab hoặc thay đổi page/search/limit
  useEffect(() => {
    if (activeTab === "products") {
      fetchProducts(productPage, debouncedProductSearch, productLimit);
    }
  }, [activeTab, productPage, debouncedProductSearch, productLimit, fetchProducts]);

  // Auto-fetch categories khi active tab hoặc thay đổi page/search/limit
  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories(catPage, debouncedCatSearch, catLimit);
    }
  }, [activeTab, catPage, debouncedCatSearch, catLimit, fetchCategories]);

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
      reloadCurrentTab();
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to save category."), "error");
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
    setSelectedFile(null);
    setPreviewUrl(null);
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
    setSelectedFile(null);
    setPreviewUrl(prod.image || null);
    setIsProductModalOpen(true);
  };

  // Hàm xử lý chọn file (validation + preview)
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      setUploadedFileName(null);
      return;
    }

    // Client-side validation
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error!, "error");
      return;
    }

    setSelectedFile(file);
    setUploadedFileName(null);
    setUploadProgress(0);

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
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

    // Upload file trước nếu có chọn file mới
    let imageUrl = image || null;
    if (selectedFile) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const result = await uploadFile(selectedFile, (percent) => {
          setUploadProgress(percent);
        });
        imageUrl = result.url;
        setUploadedFileName(selectedFile.name);
        showToast(`Uploaded ${selectedFile.name} (${formatFileSize(selectedFile.size)})`, "success");
      } catch (err: any) {
        showToast(getErrorMessage(err, "Failed to upload image."), "error");
        setUploading(false);
        setUploadProgress(0);
        return;
      }
    }

    const payload = {
      name,
      slug,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      image: imageUrl,
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
      closeProductModal();
      reloadCurrentTab();
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to save product."), "error");
    } finally {
      setUploading(false);
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
      reloadCurrentTab();
    } catch (err: any) {
      showToast(getErrorMessage(err, "Failed to update user role."), "error");
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
      reloadCurrentTab();
    } catch (err: any) {
      showToast(getErrorMessage(err, `Failed to delete ${type}.`), "error");
    }
  };

  // Users filter (client-side only – products & categories use server-side search)
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
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
    <ErrorBoundary>
    <div className="flex-grow w-full min-h-screen bg-zinc-100 dark:bg-zinc-950 transition-colors duration-300">
      {/* ===== TOP NAVBAR ===== */}
      <nav className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">
                MiniStore
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">Administration</p>
            </div>
          </div>

          {/* Right: User + Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-300">
              {user?.name}
            </span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
              {user?.role}
            </span>
            <button
              onClick={reloadCurrentTab}
              disabled={loadingData}
              className="h-8 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingData ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Sync
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </span>
              )}
            </button>
            <button
              onClick={logout}
              className="h-8 px-3 rounded-lg text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 hover:text-red-200 border border-red-500/20 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ===== MAIN LAYOUT: Sidebar + Content ===== */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100vh-3.5rem)] bg-slate-900/95 border-r border-slate-800 p-3 gap-0.5 shrink-0">
          {/* Nav label */}
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 py-3">
            Navigation
          </div>
          <button
            onClick={() => switchTab("overview")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 ml-0"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent ml-0"
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center ${activeTab === "overview" ? "text-indigo-400" : "text-slate-500"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
            </span>
            <span>Overview</span>
          </button>
          <button
            onClick={() => switchTab("products")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 ml-0"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent ml-0"
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center ${activeTab === "products" ? "text-indigo-400" : "text-slate-500"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
            <span>Products</span>
            <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{products.length}</span>
          </button>
          <button
            onClick={() => switchTab("categories")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 ml-0"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent ml-0"
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center ${activeTab === "categories" ? "text-indigo-400" : "text-slate-500"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
            <span>Categories</span>
            <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{categories.length}</span>
          </button>
          <button
            onClick={() => switchTab("users")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 ml-0"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent ml-0"
            }`}
          >
            <span className={`w-5 h-5 flex items-center justify-center ${activeTab === "users" ? "text-indigo-400" : "text-slate-500"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span>Users</span>
            <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{users.length}</span>
          </button>

          {/* Bottom info */}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="px-3 py-2 text-[10px] text-slate-600">
              MiniStore v1.0
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto min-h-[calc(100vh-3.5rem)]">
          <ErrorDisplay
            message={errorMessage}
            type="error"
            onDismiss={() => setErrorMessage("")}
            autoHide={8000}
          />

          {/* Mobile tab nav (visible below lg) */}
          <div className="flex lg:hidden gap-1 mb-4 overflow-x-auto pb-2">
            {(["overview", "products", "categories", "users"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {tab === "overview" ? "Overview" : tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW PANEL */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Users Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-lg">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="relative">
                    <div className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Total Users</div>
                    <div className="text-4xl font-extrabold mt-1 text-white">{users.length}</div>
                    <div className="mt-3 flex gap-3 text-xs text-blue-200">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                        {users.filter((u) => u.role === "admin").length} Admins
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                        {users.filter((u) => u.role === "user").length} Users
                      </span>
                    </div>
                  </div>
                </div>

                {/* Products Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-6 shadow-lg">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="relative">
                    <div className="text-[11px] font-semibold text-violet-200 uppercase tracking-wider">Total Products</div>
                    <div className="text-4xl font-extrabold mt-1 text-white">{productTotal}</div>
                    <div className="mt-3 flex gap-3 text-xs text-violet-200">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
                        {products.reduce((acc, p) => acc + p.stock, 0)} items in stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories Card */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 shadow-lg">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="relative">
                    <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Categories</div>
                    <div className="text-4xl font-extrabold mt-1 text-white">{catTotal}</div>
                    <div className="mt-3 flex gap-3 text-xs text-emerald-200">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                        Product taxonomy
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-slate-800 dark:text-white font-bold">Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <button
                    onClick={openAddProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                  </button>
                  <button
                    onClick={openAddCategory}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </button>
                  <button
                    onClick={() => switchTab("users")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Manage Roles
                  </button>
                </CardContent>
              </Card>

              {/* Server Info Card */}
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-800 dark:text-white mb-3">System Information</div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">API Endpoint</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{process.env.NEXT_PUBLIC_API || "http://localhost:3010/api"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Admin Account</span>
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{user.name} ({user.email})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Database</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB PANEL */}
          {activeTab === "products" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle>Catalog Products Database</CardTitle>
                  <CardDescription>Create, review, edit, and delete store products.</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Items per page */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>Show</span>
                    <select
                      value={productLimit}
                      onChange={(e) => { setProductLimit(Number(e.target.value)); setProductPage(1); }}
                      className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <Button onClick={openAddProduct} size="sm" className="flex items-center gap-1.5 cursor-pointer h-8 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Search input – debounced server-side search (400ms delay) */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <Input
                    placeholder="Search by product name or slug..."
                    value={productSearchInput}
                    onChange={(e) => {
                      setProductSearchInput(e.target.value);
                      setProductPage(1); // Reset về trang 1 khi search
                    }}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                  {productSearchInput && (
                    <button
                      onClick={() => { setProductSearchInput(""); setProductPage(1); }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {loadingProducts ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-500 text-xs">Syncing products database records...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    {productSearchInput ? `No products matching "${productSearchInput}".` : "No products yet. Click \"New Product\" to create one."}
                  </div>
                ) : (
                  <>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Preview</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name / Slug</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stock</th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {products.map((p, idx) => (
                            <tr key={p.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/30'} hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {p.image ? (
                                  <img
                                    src={getImageUrl(p.image)}
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
                                    className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => triggerDeleteConfirm("product", p.id, p.name)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors"
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

                    {/* Pagination */}
                    <Pagination
                      currentPage={productPage}
                      totalPages={productTotalPages}
                      onPageChange={(page) => setProductPage(page)}
                      loading={loadingProducts}
                    />
                    <p className="text-xs text-zinc-400 text-center">
                      Showing page {productPage} of {productTotalPages} ({productTotal} total products)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* CATEGORIES TAB PANEL */}
          {activeTab === "categories" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Product Categories Database</CardTitle>
                  <CardDescription>Create, review, edit, and delete store categories.</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Items per page */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>Show</span>
                    <select
                      value={catLimit}
                      onChange={(e) => { setCatLimit(Number(e.target.value)); setCatPage(1); }}
                      className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <Button onClick={openAddCategory} size="sm" className="flex items-center gap-1.5 cursor-pointer h-8 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Search input – debounced server-side search (400ms delay) */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <Input
                    placeholder="Search by category name or slug..."
                    value={catSearchInput}
                    onChange={(e) => {
                      setCatSearchInput(e.target.value);
                      setCatPage(1);
                    }}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                  {catSearchInput && (
                    <button
                      onClick={() => { setCatSearchInput(""); setCatPage(1); }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {loadingCategories ? (
                  <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-zinc-500 text-xs">Syncing categories database records...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    {catSearchInput ? `No categories matching "${catSearchInput}".` : "No categories yet. Click \"New Category\" to create one."}
                  </div>
                ) : (
                  <>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name / Slug</th>
                            <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Product Count</th>
                            <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                          {categories.map((c, idx) => (
                            <tr key={c.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/30'} hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors`}>
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
                                    className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => triggerDeleteConfirm("category", c.id, c.name)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors"
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

                    {/* Pagination */}
                    <Pagination
                      currentPage={catPage}
                      totalPages={catTotalPages}
                      onPageChange={(page) => setCatPage(page)}
                      loading={loadingCategories}
                    />
                    <p className="text-xs text-zinc-400 text-center">
                      Showing page {catPage} of {catTotalPages} ({catTotal} total categories)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* USERS TAB PANEL */}
          {activeTab === "users" && (
            <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
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
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/50">
                        <tr>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">User ID</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Full Name</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredUsers.map((u, idx) => (
                          <tr key={u.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/30'} hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors`}>
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
                                    className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer transition-colors"
                                  >
                                    Toggle Role
                                  </button>
                                  <button
                                    onClick={() => triggerDeleteConfirm("user", u.id, u.name)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors"
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

        </main>
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
                onClick={closeProductModal}
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

                {/* Image Upload + Preview */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Image</label>

                  {/* Drag & Drop upload zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      handleFileSelect(file || null);
                    }}
                    onClick={() => document.getElementById('file-input')?.click()}
                    className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : selectedFile
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20'
                        : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleFileSelect(file || null);
                        // Reset input để cho phép chọn lại file trùng tên
                        e.target.value = '';
                      }}
                      className="hidden"
                    />

                    {!previewUrl && (
                      <div className="space-y-2">
                        <svg className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[10px] text-zinc-400">JPG, PNG, GIF, WebP (max 5MB)</p>
                      </div>
                    )}

                    {previewUrl && (
                      <div className="space-y-3">
                        {/* Preview ảnh */}
                        <div className="relative mx-auto rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 w-28 h-28 bg-zinc-100 dark:bg-zinc-900">
                          <img src={getImageUrl(previewUrl)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        {/* Tên file + size hoặc current image info */}
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {selectedFile ? (
                            <>
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">{selectedFile.name}</span>
                              <span className="mx-1">·</span>
                              <span>{formatFileSize(selectedFile.size)}</span>
                            </>
                          ) : (
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Current Product Image</span>
                          )}
                        </div>
                        {/* Nút Remove */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium cursor-pointer"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload progress bar */}
                  {uploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Uploading{uploadedFileName ? ` ${uploadedFileName}` : ''}...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Or URL fallback */}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="border-t border-zinc-200 dark:border-zinc-800 flex-1" />
                    <span>or paste image URL</span>
                    <span className="border-t border-zinc-200 dark:border-zinc-800 flex-1" />
                  </div>
                  <Input
                    type="url"
                    value={prodForm.image}
                    onChange={(e) => {
                      setProdForm(prev => ({ ...prev, image: e.target.value }));
                      if (e.target.value) {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeProductModal} className="cursor-pointer">
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading} className="cursor-pointer">
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    editingProduct ? "Save Changes" : "Create Product"
                  )}
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

    </div>
    </ErrorBoundary>
  );
}
