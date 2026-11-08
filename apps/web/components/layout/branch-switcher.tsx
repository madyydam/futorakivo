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
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-2xl border border-white/60 dark:border-white/10 bg-white/45 dark:bg-card/45 backdrop-blur-md px-3.5 py-2 text-left text-xs font-semibold shadow-2xs hover:bg-white/65 dark:hover:bg-card/65 transition-colors">
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
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
