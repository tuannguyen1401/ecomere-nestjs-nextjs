'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { getErrorMessage } from '@/utils/error';
import { useNotification } from '@/context/NotificationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/Pagination';
import OrderStatusBadge from './OrderStatusBadge';
import OrderDetailModal from './OrderDetailModal';
import { ORDER_STATUSES } from './types';
import type { OrderData } from './types';

export default function OrdersTab() {
  const { notify } = useNotification();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => notify(msg, type, type === 'error' ? 6000 : 3500);

  const fetchOrders = useCallback(async (p: number, s: string, status: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (s) params.set('search', s);
      if (status) params.set('status', status);
      const res = await apiRequest(`/admin/orders?${params}`);
      const data = res.data || res;
      if (data.orders) {
        setOrders(data.orders);
        setTotal(data.total ?? data.orders.length);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? p);
      }
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to load orders'), 'error');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchOrders(page, debouncedSearch, statusFilter);
  }, [page, debouncedSearch, statusFilter, fetchOrders]);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>View, manage, and update customer orders.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <Input
                placeholder="Search by order number or customer..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setPage(1); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {/* Status filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => handleStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !statusFilter ? 'bg-slate-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All
              </button>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === s ? 'bg-slate-900 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 text-xs">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              {searchInput || statusFilter
                ? 'No orders matching your filters.'
                : 'No orders yet.'}
            </div>
          ) : (
            <>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Order #</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {orders.map((o, idx) => (
                        <tr key={o.id}
                          className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/30'} hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{o.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{o.user.name}</div>
                            <div className="text-xs text-zinc-400">{o.user.email}</div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {o.orderItems?.length || 0}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-zinc-900 dark:text-zinc-100">
                            ${o.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <OrderStatusBadge status={o.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500">
                            {formatDate(o.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => setDetailOrderId(o.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 cursor-pointer transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
              <p className="text-xs text-zinc-400 text-center">
                Showing page {page} of {totalPages} ({total} total orders)
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <OrderDetailModal
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
        onStatusChanged={() => fetchOrders(page, debouncedSearch, statusFilter)}
      />
    </>
  );
}
