"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NavbarUserActions() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="w-20 h-8 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md" />
    );
  }

  return (
    <div className="flex items-center gap-4">
      {isAuthenticated && user ? (
        <div className="flex items-center gap-4">
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-semibold bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-md hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
            >
              Admin Panel
            </Link>
          )}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Hi, <strong className="text-zinc-950 dark:text-white">{user.name}</strong>
          </span>
          <button
            onClick={logout}
            className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
