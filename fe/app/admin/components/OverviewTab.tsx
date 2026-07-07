'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { ProductData, CategoryData, UserData, TabType } from './types';

interface Props {
  onNavigate: (tab: TabType) => void;
  onAddProduct: () => void;
  onAddCategory: () => void;
}

export default function OverviewTab({ onNavigate, onAddProduct, onAddCategory }: Props) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, catsRes, prodsRes] = await Promise.all([
        apiRequest('/auth/users'),
        apiRequest('/category?limit=100'),
        apiRequest('/product?limit=100'),
      ]);
      setUsers(Array.isArray(usersRes.data || usersRes) ? usersRes.data || usersRes : []);
      const cData = catsRes.data || catsRes;
      setCategories(Array.isArray(cData) ? cData : cData?.categories || []);
      const pData = prodsRes.data || prodsRes;
      if (Array.isArray(pData)) setProducts(pData);
      else if (pData?.products) setProducts(pData.products);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-zinc-500 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadData} className="ml-2 underline cursor-pointer">Retry</button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
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
                {users.filter((u) => u.role === 'admin').length} Admins
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                {users.filter((u) => u.role === 'user').length} Users
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-6 shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="relative">
            <div className="text-[11px] font-semibold text-violet-200 uppercase tracking-wider">Total Products</div>
            <div className="text-4xl font-extrabold mt-1 text-white">{products.length}</div>
            <div className="mt-3 flex gap-3 text-xs text-violet-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-300" />
                {products.reduce((acc, p) => acc + p.stock, 0)} items in stock
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="relative">
            <div className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">Categories</div>
            <div className="text-4xl font-extrabold mt-1 text-white">{categories.length}</div>
            <div className="mt-3 flex gap-3 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Product taxonomy
              </span>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 dark:text-white font-bold">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <button onClick={onAddProduct} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
          <button onClick={onAddCategory} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
          <button onClick={() => onNavigate('orders')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Orders
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
