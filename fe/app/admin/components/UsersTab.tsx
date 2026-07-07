'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/utils/api';
import { getErrorMessage } from '@/utils/error';
import { useNotification } from '@/context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ConfirmDialog from './ConfirmDialog';
import type { UserData } from './types';

interface Props {
  currentUserEmail?: string;
}

export default function UsersTab({ currentUserEmail }: Props) {
  const { notify } = useNotification();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => notify(msg, type, type === 'error' ? 6000 : 3500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/users');
      const data = res.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to load users'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await apiRequest(`/auth/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: targetRole }) });
      showToast(`User role updated to ${targetRole}!`);
      fetchUsers();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to update role.'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/auth/users/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('User deleted!');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      showToast(getErrorMessage(err, 'Failed to delete user.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>System Accounts Database</CardTitle>
          <CardDescription>Monitor credentials, adjust roles, or terminate records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <Input placeholder="Search by name or email..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 text-xs">Loading users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              {search ? 'No users matching search.' : 'No users found.'}
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filtered.map((u, idx) => (
                    <tr key={u.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/30'} hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors`}>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-400">{u.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">{u.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300' : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {currentUserEmail && u.email.toLowerCase() === currentUserEmail.toLowerCase() ? (
                          <span className="text-xs text-zinc-400 italic">Current Session</span>
                        ) : (
                          <div className="inline-flex rounded-md shadow-sm">
                            <button onClick={() => handleToggleRole(u.id, u.role)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-l-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 cursor-pointer transition-colors">
                              Toggle Role
                            </button>
                            <button onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                              className="px-3 py-1.5 text-xs font-semibold rounded-r-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 border border-l-0 border-red-200 dark:border-red-800/50 cursor-pointer transition-colors">
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message="Are you sure you want to delete the user"
        itemName={deleteTarget?.name || ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
