"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChefHat,
  ChevronDown,
  ClipboardList,
  CookingPot,
  Flame,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEMO_NAV = [
  { href: "/demo", label: "Dashboard", icon: LayoutDashboard },
  { href: "/demo/pos", label: "Point of Sale (POS)", icon: UtensilsCrossed },
  { href: "/demo/kds", label: "Kitchen Display (KDS)", icon: ChefHat },
  { href: "/demo/tables", label: "Floor & Tables", icon: Store },
  { href: "/demo/orders", label: "Orders & Bills", icon: ReceiptText },
  { href: "/demo/menu", label: "Menu Catalog", icon: CookingPot },
  { href: "/demo/reports", label: "Reports & GST", icon: BarChart3 },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Banner: Demo Mode Announcement */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs sm:px-6">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">Demo Environment</span>
          <span className="hidden text-muted-foreground sm:inline">·</span>
          <span className="hidden sm:inline">
            Interactive simulation with sample restaurant data. No setup required.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/onboarding">
            <Button size="sm" className="h-7 bg-amber-600 px-3 text-xs text-white hover:bg-amber-700">
              <Sparkles className="mr-1.5 size-3" />
              Get Started for Real
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Exit Demo
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 p-4 lg:flex">
          {/* Brand header */}
          <div className="flex items-center gap-2.5 px-2 py-3 border-b border-border/60">
            <Logo size={32} />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">
                Modexsys HORECA
              </span>
              <span className="text-xs text-muted-foreground">Demo Outlet · Connaught Place</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 flex flex-1 flex-col gap-1">
            {DEMO_NAV.map((item) => {
              const active =
                item.href === "/demo"
                  ? pathname === "/demo" || pathname === "/demo/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Super Admin Preview Shortcut */}
          <div className="mt-auto pt-4 border-t border-border/60 flex flex-col gap-2">
            <Link
              href="/super-admin"
              className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="size-3.5" />
                <span>Super Admin Portal</span>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                Platform
              </Badge>
            </Link>
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Demo Admin (Owner)</p>
              <p className="truncate text-[11px]">demo-owner@modexsys.com</p>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Toggle */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-sm font-bold">Modexsys HORECA (Demo)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </header>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="border-b border-border bg-card p-4 lg:hidden">
              <nav className="flex flex-col gap-1">
                {DEMO_NAV.map((item) => {
                  const active =
                    item.href === "/demo"
                      ? pathname === "/demo"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Main page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

