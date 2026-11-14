"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-auth";

const links = [
  { href: "/demo", label: "See Demo" },
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "Product Views" },
  { href: "#security", label: "Security" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const { data: userData } = useCurrentUser();
  const isLoggedIn = Boolean(userData?.user);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-base font-bold tracking-tight text-foreground">
            KIVO <span className="text-primary font-semibold">by FUTORA group</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Button variant="default" size="default" render={<Link href="/dashboard" />}>
              Open Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="default" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button variant="default" size="default" render={<Link href="/onboarding" />}>
                Get started free
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1.5 pt-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isLoggedIn ? (
                <Button variant="default" render={<Link href="/dashboard" />}>
                  Open Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" render={<Link href="/login" />}>
                    Sign in
                  </Button>
                  <Button variant="default" render={<Link href="/onboarding" />}>
                    Get started free
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}