"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import OverviewTab from "./components/OverviewTab";
import ProductsTab from "./components/ProductsTab";
import CategoriesTab from "./components/CategoriesTab";
import UsersTab from "./components/UsersTab";
import OrdersTab from "./components/OrdersTab";
import type { TabType } from "./components/types";

export default function AdminPage() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loadingData, setLoadingData] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Guard routing
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        router.push("/login");
      } else if (user.role !== "admin") {
        router.push("/");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Loading guard
  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Authenticating admin session...</p>
        </div>
      </div>
    );
  }

  const sidebarItems: { tab: TabType; label: string; icon: React.ReactNode }[] = [
    {
      tab: "overview",
      label: "Overview",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>,
    },
    {
      tab: "orders",
      label: "Orders",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>,
    },
    {
      tab: "products",
      label: "Products",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>,
    },
    {
      tab: "categories",
      label: "Categories",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>,
    },
    {
      tab: "users",
      label: "Users",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>,
    },
  ];

  return (
    <ErrorBoundary>
    <div className="flex-grow w-full min-h-screen bg-zinc-100 dark:bg-zinc-950 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">M</div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">MiniStore</h1>
              <p className="text-[10px] text-slate-400 leading-tight">Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-300">{user?.name}</span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">{user?.role}</span>
            <button
              onClick={async () => {
                setClearingCache(true);
                try { await fetch('/api/revalidate?action=clearAll'); } catch {}
                window.location.reload();
              }}
              disabled={clearingCache}
              className="h-8 px-3 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-200 border border-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {clearingCache ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Clearing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                  Clear Cache
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

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-[calc(100vh-3.5rem)] bg-slate-900/95 border-r border-slate-800 p-3 gap-0.5 shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 py-3">Navigation</div>
          {sidebarItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => switchTab(item.tab)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === item.tab
                  ? "bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500 ml-0"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent ml-0"
              }`}
            >
              <span className={`w-5 h-5 flex items-center justify-center ${activeTab === item.tab ? "text-indigo-400" : "text-slate-500"}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="px-3 py-2 text-[10px] text-slate-600">MiniStore v1.0</div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto min-h-[calc(100vh-3.5rem)]">
          {/* Mobile tabs */}
          <div className="flex lg:hidden gap-1 mb-4 overflow-x-auto pb-2">
            {sidebarItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => switchTab(item.tab)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                  activeTab === item.tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab
              onNavigate={switchTab}
              onAddProduct={() => switchTab("products")}
              onAddCategory={() => switchTab("categories")}
            />
          )}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "users" && <UsersTab currentUserEmail={user.email} />}
          {activeTab === "orders" && <OrdersTab />}
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}
