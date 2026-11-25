"use client";

import { clearOfflineCache } from "@/lib/offline-cache";
import {
  PERMISSIONS,
  permissionSatisfied,
  type LoginDto,
  type RegisterDto,
  type SessionUser,
} from "@futora/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedPushToken, savePushToken } from "@/lib/native";
import { api, ApiError } from "@/lib/api";

export const DEMO_USER: SessionUser = {
  id: "demo-user-id",
  restaurantId: "demo-restaurant-id",
  name: "Restaurant Owner",
  roleId: "demo-role-id",
  roleName: "OWNER",
  permissions: PERMISSIONS.map((p) => p.key),
};

function clearSavedAuth() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("kivo_impersonated_user");
    localStorage.removeItem("FUTORA group_demo_user");
    localStorage.removeItem("nodedr_demo_user");
    localStorage.removeItem("FUTORA group_restaurant_name");
    localStorage.removeItem("FUTORA group_branch_name");
  } catch {
    // ignore
  }
}

function getSavedUser(): SessionUser | null {
  if (typeof window !== "undefined") {
    try {
      const stored =
        localStorage.getItem("FUTORA group_demo_user") || localStorage.getItem("nodedr_demo_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function saveUser(user: SessionUser) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("FUTORA group_demo_user", JSON.stringify(user));
      localStorage.removeItem("nodedr_demo_user");
    } catch {
      // ignore
    }
  }
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<{ user: SessionUser }> => {
      try {
        const res = await api.get<{ user: SessionUser }>("/auth/me");
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
        throw new Error("UNAUTHENTICATED");
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearSavedAuth();
          throw err;
        }
        const saved = getSavedUser();
        if (saved) {
          return { user: saved };
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const res = await api.post<{ user: SessionUser }>("/auth/login", dto);
      if (res?.user) {
        saveUser(res.user);
      }
      return res;
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: RegisterDto) => {
      const res = await api.post<{ user: SessionUser }>("/auth/register", dto);
      if (typeof window !== "undefined") {
        if (dto.restaurantName) localStorage.setItem("FUTORA group_restaurant_name", dto.restaurantName);
        if (dto.branchName) localStorage.setItem("FUTORA group_branch_name", dto.branchName);
      }
      if (res?.user) {
        saveUser(res.user);
      }
      return res;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearSavedAuth();
      const token = savedPushToken();
      if (token) {
        await api.delete(`/devices/${encodeURIComponent(token)}`).catch(() => undefined);
        savePushToken(null);
      }
      return api.post("/auth/logout").catch(() => undefined);
    },
    onSuccess: () => {
      queryClient.clear();
      clearOfflineCache();
    },
  });
}

export function hasPermission(user: SessionUser | undefined, permission: string): boolean {
  if (!user) return false;
  // Restaurant Owners and Platform Administrators hold global permission across all screens
  if (user.roleName === "OWNER" || user.roleName === "ADMINISTRATOR") return true;
  return permissionSatisfied(user.permissions, permission);
}
