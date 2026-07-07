'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { getErrorMessage } from '@/utils/error';
import { useNotification } from '@/context/NotificationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { uploadFile, validateFile, formatFileSize } from '@/utils/upload';
import { getImageUrl } from '@/components/LazyImage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/Pagination';
import ConfirmDialog from './ConfirmDialog';
import type { ProductData, CategoryData } from './types';

function slugify(text: string) {
  return text.toString().toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
}

export default function ProductsTab() {
  const { notify } = useNotification();

  const [products, setProducts] = useState<ProductData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [categories, setCategories] = useState<CategoryData[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductData | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', price: '', stock: '', image: '', categoryId: '' });
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => notify(msg, type, type === 'error' ? 6000 : 3500);

  const fetchProducts = useCallback(async (p: number, s: string, l: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(l) });
      if (s) params.set('search', s);
      const res = await apiRequest(`/product?${params}`);
      const data = res.data || res;
      if (data.products) {
        setProducts(data.products);
        setTotal(data.total ?? data.products.length);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? p);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotal(data.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to load products'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiRequest('/category?limit=100');
      const data = res.data || res;
      setCategories(Array.isArray(data) ? data : data?.categories || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(page, debouncedSearch, limit); }, [page, debouncedSearch, limit]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', slug: '', price: '', stock: '', image: '', categoryId: categories[0]?.id?.toString() || '' });
    setIsSlugManual(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowModal(true);
  };

  const openEdit = (p: ProductData) => {
    setEditing(p);
    setForm({ name: p.name, slug: p.slug, price: p.price.toString(), stock: p.stock.toString(), image: p.image || '', categoryId: p.categoryId?.toString() || '' });
    setIsSlugManual(true);
    setSelectedFile(null);
    setPreviewUrl(p.image || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setDragOver(false);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) { setSelectedFile(null); setPreviewUrl(null); setUploadProgress(0); return; }
    const v = validateFile(file);
    if (!v.valid) { showToast(v.error!, 'error'); return; }
    setSelectedFile(file);
    setUploadProgress(0);
    const r = new FileReader();
    r.onload = (e) => setPreviewUrl(e.target?.result as string);
    r.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, slug, price, stock, image, categoryId } = form;
    if (!name || !slug || !price || !stock) { showToast('Please fill in all required fields.', 'error'); return; }

    let imageUrl = image || null;
    if (selectedFile) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const result = await uploadFile(selectedFile, (pct) => setUploadProgress(pct));
        imageUrl = result.url;
      } catch (err: any) {
        showToast(getErrorMessage(err, 'Failed to upload image.'), 'error');
        setUploading(false);
        return;
      }
    }

    const payload = { name, slug, price: parseFloat(price) || 0, stock: parseInt(stock, 10) || 0, image: imageUrl, categoryId: categoryId ? parseInt(categoryId, 10) : null };

    try {
      if (editing) {
        await apiRequest(`/product/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        showToast('Product updated!');
      } else {
        await apiRequest('/product', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Product created!');
      }
      closeModal();
      fetchProducts(page, debouncedSearch, limit);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to save product.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/product/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Product deleted!');
      setDeleteTarget(null);
      fetchProducts(page, debouncedSearch, limit);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to delete product.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle>Catalog Products Database</CardTitle>
            <CardDescription>Create, review, edit, and delete store products.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Show</span>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="h-8 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <Button onClick={openAdd} size="sm" className="flex items-center gap-1.5 cursor-pointer h-8 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input placeholder="Search by product name or slug..." value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setPage(1); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 text-xs">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              {searchInput ? `No products matching "${searchInput}".` : 'No products yet. Click "New" to create one.'}
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
                            <img src={getImageUrl(p.image)} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-zinc-200 dark:border-zinc-800"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'; }} />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400">No Img</div>
                          )}
                        </td>
                        <td className="px-4 py-3"><div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</div><div className="font-mono text-xs text-zinc-400 mt-0.5">{p.slug}</div></td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">{p.category?.name || <span className="text-zinc-400 italic">None</span>}</td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`inline-block font-semibold px-2 py-0.5 rounded-full text-xs ${p.stock === 0 ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' : p.stock < 10 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="inline-flex rounded-md shadow-sm">
                            <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer transition-colors">Edit</button>
                            <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })} className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
              <p className="text-xs text-zinc-400 text-center">Showing page {page} of {totalPages} ({total} total products)</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{editing ? `Edit: ${editing.name}` : 'Create New Product'}</h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Product Name *</label>
                  <Input required value={form.name} onChange={(e) => {
                    const v = e.target.value;
                    if (!isSlugManual) setForm(prev => ({ ...prev, name: v, slug: slugify(v) }));
                    else setForm(prev => ({ ...prev, name: v }));
                  }} placeholder="e.g. Next-Gen Gaming Headset" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Slug *</label>
                    <label className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 select-none cursor-pointer">
                      <input type="checkbox" checked={isSlugManual} onChange={(e) => setIsSlugManual(e.target.checked)} className="rounded accent-violet-600" /> Manual
                    </label>
                  </div>
                  <Input required disabled={!isSlugManual} value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: slugify(e.target.value) }))} placeholder="next-gen-gaming-headset" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-60" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Price (USD) *</label>
                    <Input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} placeholder="99.99" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stock *</label>
                    <Input required type="number" min="0" value={form.stock} onChange={(e) => setForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="50" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-600 cursor-pointer">
                    <option value="">No category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Image</label>
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0] || null); }}
                    onClick={() => document.getElementById('prod-file-input')?.click()}
                    className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : selectedFile ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                    <input id="prod-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(e) => { handleFileSelect(e.target.files?.[0] || null); e.target.value = ''; }} className="hidden" />
                    {!previewUrl ? (
                      <div className="space-y-2">
                        <svg className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop</p>
                        <p className="text-[10px] text-zinc-400">JPG, PNG, GIF, WebP (max 5MB)</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative mx-auto rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 w-28 h-28 bg-zinc-100 dark:bg-zinc-900">
                          <img src={getImageUrl(previewUrl)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-zinc-500">{selectedFile ? <><span className="font-medium">{selectedFile.name}</span><span className="mx-1">·</span><span>{formatFileSize(selectedFile.size)}</span></> : <span className="font-medium">Current Image</span>}</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium cursor-pointer">Remove image</button>
                      </div>
                    )}
                  </div>
                  {uploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500"><span>Uploading...</span><span>{uploadProgress}%</span></div>
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="border-t border-zinc-200 dark:border-zinc-800 flex-1" /><span>or paste image URL</span><span className="border-t border-zinc-200 dark:border-zinc-800 flex-1" />
                  </div>
                  <Input type="url" value={form.image} onChange={(e) => { setForm(prev => ({ ...prev, image: e.target.value })); if (e.target.value) { setSelectedFile(null); setPreviewUrl(null); } }} placeholder="https://example.com/image.jpg" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs" />
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeModal} className="cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={uploading} className="cursor-pointer">
                  {uploading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading...</span> : editing ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message="Are you sure you want to delete the product"
        itemName={deleteTarget?.name || ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
