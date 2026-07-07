'use client';

import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  itemName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, itemName, loading, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              {message} <strong className="text-zinc-900 dark:text-zinc-200">"{itemName}"</strong>?
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center gap-3">
          <Button variant="outline" onClick={onCancel} className="cursor-pointer" disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} className="cursor-pointer" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
