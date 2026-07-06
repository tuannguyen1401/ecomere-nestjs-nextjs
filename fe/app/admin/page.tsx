"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const columnHelper = createColumnHelper<UserData>();

export default function AdminPage() {
  const { user, token, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

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

  // Fetch users list
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const fetchUsers = async () => {
        try {
          const res = await apiRequest("/auth/users");
          setUsers(res.data);
        } catch (err: any) {
          setError(err.message || "Failed to load users list.");
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  // Define table columns using TanStack Table columnHelper
  const columns = [
    columnHelper.accessor("id", {
      header: "User ID",
      cell: (info) => <span className="font-mono text-xs text-zinc-500">{info.getValue()}</span>,
    }),
    columnHelper.accessor("name", {
      header: "Full Name",
      cell: (info) => <span className="font-semibold text-zinc-900 dark:text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("email", {
      header: "Email Address",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("role", {
      header: "System Role",
      cell: (info) => {
        const val = info.getValue();
        return (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${val === "admin"
                ? "bg-violet-100 text-violet-750 dark:bg-violet-950/50 dark:text-violet-300"
                : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
          >
            {val}
          </span>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Registered Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
    }),
  ];

  // TanStack Table Instance
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Admin Control Center
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            System administration, user database management, and controls.
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="cursor-pointer">
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total System Users</div>
          <div className="text-2xl font-bold mt-2">{users.length}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Admins Count</div>
          <div className="text-2xl font-bold mt-2">
            {users.filter((u) => u.role === "admin").length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-zinc-550 dark:text-zinc-400">Standard Users</div>
          <div className="text-2xl font-bold mt-2">
            {users.filter((u) => u.role === "user").length}
          </div>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>System Registered Users</CardTitle>
          <CardDescription>
            List of users registered in the system managed via TanStack Table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-zinc-500 text-xs">Loading user record data...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 text-sm rounded-md font-medium">
              {error}
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                        No users found in database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
