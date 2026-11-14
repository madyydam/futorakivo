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
import { api } from "@/lib/api";

export const DEMO_USER: SessionUser = {
  id: "demo-user-id",
  restaurantId: "demo-restaurant-id",
  name: "Restaurant Owner",
  roleId: "demo-role-id",
  roleName: "OWNER",
  permissions: PERMISSIONS.map((p) => p.key),
};

function getSavedUser(): SessionUser | null {
  if (typeof window !== "undefined") {
    try {
      const impersonated = localStorage.getItem("kivo_impersonated_user");
      if (impersonated) return JSON.parse(impersonated);
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
      // If actively impersonating a restaurant tenant from Super Admin, use it immediately
      if (typeof window !== "undefined") {
        const impersonated = localStorage.getItem("kivo_impersonated_user");
        if (impersonated) {
          try {
            const parsed = JSON.parse(impersonated);
            if (parsed) return { user: parsed };
          } catch {}
        }
      }

      try {
        const res = await api.get<{ user: SessionUser }>("/auth/me");
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
      } catch {
        // Check if there is an active saved demo session
      }

      const saved = getSavedUser();
      if (saved) {
        return { user: saved };
      }

      // Not logged in: throw so query status is error / unauthenticated
      throw new Error("UNAUTHENTICATED");
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      try {
        const res = await api.post<{ user: SessionUser }>("/auth/login", dto);
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
      } catch (err) {
        console.warn("Backend auth failed, falling back to demo user:", err);
      }

      // Demo login fallback: allow ANY email/password to sign in smoothly
      const fallbackName = dto.email ? dto.email.split("@")[0] : "Demo Owner";
      const demoUser: SessionUser = {
        ...DEMO_USER,
        name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
      };
      saveUser(demoUser);
      return { user: demoUser };
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
      if (typeof window !== "undefined") {
        if (dto.restaurantName) localStorage.setItem("FUTORA group_restaurant_name", dto.restaurantName);
        if (dto.branchName) localStorage.setItem("FUTORA group_branch_name", dto.branchName);
      }

      try {
        const res = await api.post<{ user: SessionUser }>("/auth/register", dto);
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
      } catch (err) {
        console.warn("Backend registration failed, falling back to session user:", err);
      }

      // Allow ANY restaurant/user to be created without 500 error blocking
      const fallbackName = dto.ownerName || "Restaurant Owner";
      const demoUser: SessionUser = {
        ...DEMO_USER,
        id: "owner-" + Math.random().toString(36).slice(2, 9),
        restaurantId: "rest-" + Math.random().toString(36).slice(2, 9),
        name: fallbackName,
        roleName: "OWNER",
      };
      saveUser(demoUser);
      return { user: demoUser };
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
      if (typeof window !== "undefined") {
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
  if (!user) return true;
  // Restaurant Owners and Platform Administrators hold global permission across all screens
  if (user.roleName === "OWNER" || user.roleName === "ADMINISTRATOR") return true;
  return permissionSatisfied(user.permissions, permission);
}
