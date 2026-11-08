"use client";

import type { SessionUser } from "@modexsys/types";
import { ChevronDown, LogOut, Moon, Server, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteAccountDialog } from "@/components/layout/delete-account-dialog";
import { useLogout } from "@/hooks/use-auth";
import { changeServer, isNativeApp } from "@/lib/native";

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user?: SessionUser }) {
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
        aria-label="Toggle theme"
      >
        <Sun className="h-[18px] w-[18px] dark:hidden" />
        <Moon className="hidden h-[18px] w-[18px] dark:block" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-border/80 bg-white/90 dark:bg-card/90 pl-1.5 pr-2.5 py-1 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-card transition-colors shadow-2xs">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-[#9f1239] text-[10px] font-bold text-white">
              {user?.name ? initials(user.name) : "RO"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-xs font-medium text-slate-800 dark:text-slate-100 sm:block">
            {user?.name || "Restaurant Owner"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.name || "Restaurant Owner"}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.roleName || "Owner / Super Admin"}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/login") })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
          {isNativeApp() && (
            <DropdownMenuItem
              onClick={() => logout.mutate(undefined, { onSuccess: () => changeServer() })}
            >
              <Server className="h-4 w-4" />
              Change server
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDeleting(true)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete my account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />
    </div>
  );
}
