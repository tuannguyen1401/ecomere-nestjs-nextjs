import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import NavbarUserActions from "@/components/NavbarUserActions";
import CartIcon from "@/components/CartIcon";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Antigravity Store - Premium Tech Shop",
  description: "Experience the premium tech gadgets and devices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300">
        <AuthProvider>
        <NotificationProvider>
        <CartProvider>
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <div className="flex items-center gap-8">
                  <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                      🚀 AG-STORE
                    </span>
                  </Link>

                  {/* Desktop Nav Links */}
                  <nav className="hidden sm:flex items-center gap-6">
                    <Link
                      href="/"
                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                      Home
                    </Link>
                    <Link
                      href="/product"
                      className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                      Products
                    </Link>
                  </nav>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  <NavbarUserActions />
                  <CartIcon />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <p>© {new Date().getFullYear()} Antigravity Store. All rights reserved.</p>
            </div>
          </footer>
        </CartProvider>
        </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
