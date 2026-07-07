'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { getErrorMessage } from '@/utils/error';
import { useNotification } from '@/context/NotificationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/Pagination';
import ConfirmDialog from './ConfirmDialog';
import type { CategoryData } from './types';

function slugify(text: string) {
  return text.toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
}

export default function CategoriesTab() {
  const { notify } = useNotification();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategoryData | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [isSlugManual, setIsSlugManual] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => notify(msg, type, type === 'error' ? 6000 : 3500);

  const fetchCategories = useCallback(async (p: number, s: string, l: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(l) });
      if (s) params.set('search', s);
      const res = await apiRequest(`/category?${params}`);
      const data = res.data || res;
      if (data.categories) {
        setCategories(data.categories);
        setTotal(data.total ?? data.categories.length);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? p);
      } else if (Array.isArray(data)) {
        setCategories(data);
        setTotal(data.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to load categories'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(page, debouncedSearch, limit); }, [page, debouncedSearch, limit]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '' });
    setIsSlugManual(false);
    setShowModal(true);
  };

  const openEdit = (c: CategoryData) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '' });
    setIsSlugManual(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) { showToast('Name and slug are required.', 'error'); return; }
    try {
      if (editing) {
        await apiRequest(`/category/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
        showToast('Category updated!');
      } else {
        await apiRequest('/category', { method: 'POST', body: JSON.stringify(form) });
        showToast('Category created!');
      }
      setShowModal(false);
      fetchCategories(page, debouncedSearch, limit);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to save category.'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/category/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Category deleted!');
      setDeleteTarget(null);
      fetchCategories(page, debouncedSearch, limit);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to delete category.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Product Categories Database</CardTitle>
            <CardDescription>Create, review, edit, and delete store categories.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Show</span>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer">
                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </div>
            <Button onClick={openAdd} size="sm" className="flex items-center gap-1.5 cursor-pointer h-8 text-xs">New</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input placeholder="Search by category name or slug..." value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setPage(1); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 text-xs">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              {searchInput ? `No categories matching "${searchInput}".` : 'No categories yet.'}
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
                        <td className="px-4 py-3"><div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</div><div className="font-mono text-xs text-zinc-400 mt-0.5">{c.slug}</div></td>
                        <td className="px-4 py-3 max-w-xs truncate text-zinc-500 dark:text-zinc-400">{c.description || <span className="italic text-zinc-400">No description</span>}</td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">{c.productCount ?? 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="inline-flex rounded-md shadow-sm">
                            <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer transition-colors">Edit</button>
                            <button onClick={() => setDeleteTarget({ id: c.id, name: c.name })} className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
              <p className="text-xs text-zinc-400 text-center">Showing page {page} of {totalPages} ({total} total categories)</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{editing ? `Edit: ${editing.name}` : 'Create New Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category Name *</label>
                  <Input required value={form.name} onChange={(e) => {
                    const v = e.target.value;
                    if (!isSlugManual) setForm(prev => ({ ...prev, name: v, slug: slugify(v) }));
                    else setForm(prev => ({ ...prev, name: v }));
                  }} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Slug *</label>
                    <label className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 select-none cursor-pointer">
                      <input type="checkbox" checked={isSlugManual} onChange={(e) => setIsSlugManual(e.target.checked)} className="rounded accent-violet-600" /> Manual
                    </label>
                  </div>
                  <Input required disabled={!isSlugManual} value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-60" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-1" />
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="cursor-pointer">Cancel</Button>
                <Button type="submit" className="cursor-pointer">{editing ? 'Save Changes' : 'Create Category'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message="Are you sure you want to delete the category"
        itemName={deleteTarget?.name || ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
