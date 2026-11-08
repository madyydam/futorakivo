"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { branchViewState, type BranchViewState } from "@/lib/branch-state";

interface Branch {
  id: string;
  name: string;
}

interface BranchContextValue {
  branchId: string | null;
  branches: Branch[];
  isLoading: boolean;
  /** loading / error / empty (loaded, none assigned) / ready. */
  state: BranchViewState;
  error: unknown;
  retry: () => void;
  retrying: boolean;
  setBranchId: (id: string) => void;
}

const BranchContext = createContext<BranchContextValue | null>(null);

const STORAGE_KEY = "modexsys_branch_id";

function getDefaultBranch(): Branch {
  const custom =
    typeof window !== "undefined" ? localStorage.getItem("modexsys_branch_name") : null;
  return { id: "main-branch", name: custom || "Main Branch" };
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const defaultBranch = useMemo(() => getDefaultBranch(), []);
  const { data: fetchedBranches, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      try {
        const res = await api.get<Branch[]>("/branches");
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {
        // Fallback to default branch if backend is down
      }
      return [defaultBranch];
    },
    retry: false,
  });

  const branches = useMemo(() => {
    if (Array.isArray(fetchedBranches) && fetchedBranches.length > 0) {
      return fetchedBranches;
    }
    return [defaultBranch];
  }, [fetchedBranches, defaultBranch]);

  const [manualBranchId, setManualBranchId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
  );

  const branchId = useMemo(() => {
    if (!branches || branches.length === 0) return defaultBranch.id;
    if (manualBranchId && branches.some((b) => b.id === manualBranchId)) return manualBranchId;
    return branches[0].id;
  }, [branches, manualBranchId, defaultBranch]);

  const setBranchId = (id: string) => {
    setManualBranchId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const state: BranchViewState = "ready";
  const value = useMemo(
    () => ({
      branchId,
      branches,
      isLoading: false,
      state,
      error,
      retry: () => void refetch(),
      retrying: isFetching,
      setBranchId,
    }),
    [branchId, branches, state, error, isFetching],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within a BranchProvider");
  return ctx;
}
