"use client";

import { Check, ChevronsUpDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBranch } from "@/hooks/use-branch";

export function BranchSwitcher() {
  const { branchId, branches, setBranchId } = useBranch();
  const current = branches.find((b) => b.id === branchId);

  if (branches.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-2xl border border-slate-200/75 dark:border-border/60 bg-[#F7F4F3] dark:bg-slate-900/50 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] px-3.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-card hover:border-slate-300 hover:shadow-xs transition-all">
        <Store className="h-4 w-4 shrink-0 text-[#9f1239] dark:text-rose-400" />
        <span className="flex-1 truncate font-semibold text-sidebar-foreground">
          {current?.name ?? "Main Branch"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {branches.map((branch) => (
          <DropdownMenuItem key={branch.id} onClick={() => setBranchId(branch.id)}>
            <span className="flex-1">{branch.name}</span>
            {branch.id === branchId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
