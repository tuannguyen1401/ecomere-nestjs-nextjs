'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { getErrorMessage } from '@/utils/error';
import { getImageUrl } from '@/components/LazyImage';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import OrderStatusBadge from './OrderStatusBadge';
import { STATUS_TRANSITIONS } from './types';
import type { OrderData, StatusHistoryData } from './types';

interface Props {
  orderId: number | null;
  onClose: () => void;
  onStatusChanged: () => void;
}

export default function OrderDetailModal({ orderId, onClose, onStatusChanged }: Props) {
  const { notify } = useNotification();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    apiRequest(`/admin/orders/${orderId}`)
      .then((res) => {
        const data = res.data || res;
        setOrder(data);
        setSelectedStatus('');
        setStatusNote('');
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load order')))
      .finally(() => setLoading(false));
  }, [orderId, retry]);

  const handleStatusUpdate = async () => {
    if (!order || !selectedStatus) return;
    setUpdating(true);
    try {
      await apiRequest(`/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: selectedStatus, note: statusNote || undefined }),
      });
      notify(`Status updated to ${selectedStatus}!`, 'success');
      setOrder(null);
      onStatusChanged();
      onClose();
    } catch (err: any) {
      notify(getErrorMessage(err, 'Update failed'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (!orderId) return null;

  const validNextStatuses = order ? STATUS_TRANSITIONS[order.status] || [] : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
              {loading ? 'Loading...' : order ? `Order ${order.orderNumber}` : 'Order Detail'}
            </h3>
            {order && <OrderStatusBadge status={order.status} />}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-zinc-500 text-xs">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => setRetry((r) => r + 1)} className="mt-3">Retry</Button>
          </div>
        ) : !order ? (
          <div className="p-8 text-center text-zinc-500">Order not found.</div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{order.user.name}</p>
                    <p className="text-sm text-zinc-500">{order.user.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Order Info</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Date</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Total</span>
                      <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">${order.total.toFixed(2)}</span>
                    </div>
                    {order.shippingAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Shipping</span>
                        <span className="text-zinc-700 dark:text-zinc-300 text-right max-w-[200px]">{order.shippingAddress}</span>
                      </div>
                    )}
                    {order.note && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Note</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{order.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Items ({order.orderItems.length})</h4>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Product</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {order.orderItems.map((item) => (
                        <tr key={item.id} className="bg-white dark:bg-zinc-950">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {item.product.image ? (
                                <img src={getImageUrl(item.product.image)} alt={item.product.name}
                                  className="w-8 h-8 object-cover rounded border border-zinc-200 dark:border-zinc-800"
                                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/32x32?text=N/A'; }} />
                              ) : (
                                <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-400">N/A</div>
                              )}
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.product.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-zinc-600 dark:text-zinc-400">${item.price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-zinc-900 dark:text-zinc-100">{item.quantity}</td>
                          <td className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-100">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 dark:bg-zinc-900">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-sm text-zinc-700 dark:text-zinc-300">Total</td>
                        <td className="px-3 py-2 text-right font-bold text-zinc-900 dark:text-zinc-100">${order.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status History Timeline */}
              {order.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status History</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                    <div className="space-y-3">
                      {order.statusHistory.map((h, idx) => (
                        <div key={h.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === order.statusHistory.length - 1 ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                            {idx < order.statusHistory.length - 1 && <div className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700 mt-1" />}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="flex items-center gap-2">
                              <OrderStatusBadge status={h.toStatus} size="sm" />
                              {h.fromStatus && (
                                <span className="text-xs text-zinc-400">
                                  from <span className="font-medium text-zinc-500">{h.fromStatus}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              by <span className="font-medium text-zinc-500">{h.changedByRole}</span>
                              {' · '}{new Date(h.createdAt).toLocaleString()}
                            </div>
                            {h.note && <p className="text-xs text-zinc-500 mt-0.5 italic">"{h.note}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Change Action */}
              {validNextStatuses.length > 0 && (
                <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {validNextStatuses.map((s) => (
                      <button key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          selectedStatus === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-indigo-400'
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                  {selectedStatus && (
                    <>
                      <input
                        type="text"
                        placeholder="Add a note (optional)..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleStatusUpdate} disabled={updating} className="cursor-pointer">
                          {updating ? 'Updating...' : `Mark as ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`}
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedStatus('')} className="cursor-pointer">Cancel</Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Cancelled info */}
              {order.status === 'cancelled' && order.cancelledReason && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 text-sm">
                  <span className="font-semibold text-red-700 dark:text-red-400">Cancelled:</span>
                  <span className="text-red-600 dark:text-red-300 ml-1">"{order.cancelledReason}"</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
