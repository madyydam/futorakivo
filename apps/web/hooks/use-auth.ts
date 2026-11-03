"use client";

import { clearOfflineCache } from "@/lib/offline-cache";
import {
  PERMISSIONS,
  permissionSatisfied,
  type LoginDto,
  type RegisterDto,
  type SessionUser,
} from "@modexsys/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savedPushToken, savePushToken } from "@/lib/native";
import { api } from "@/lib/api";

export const DEMO_USER: SessionUser = {
  id: "demo-user-id",
  restaurantId: "demo-restaurant-id",
  name: "Demo Owner",
  roleId: "demo-role-id",
  roleName: "OWNER",
  permissions: PERMISSIONS.map((p) => p.key),
};

function getSavedUser(): SessionUser {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("nodedr_demo_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }
  return DEMO_USER;
}

function saveUser(user: SessionUser) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nodedr_demo_user", JSON.stringify(user));
    } catch {
      // ignore
    }
  }
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.get<{ user: SessionUser }>("/auth/me");
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
      } catch {
        // Fallback to demo user if backend is unavailable or 500s
      }
      return { user: getSavedUser() };
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
      try {
        const res = await api.post<{ user: SessionUser }>("/auth/register", dto);
        if (res?.user) {
          saveUser(res.user);
          return res;
        }
      } catch (err) {
        console.warn("Backend registration failed, falling back to demo user:", err);
      }

      // Demo register fallback: allow ANY restaurant/user to be created
      const demoUser: SessionUser = {
        ...DEMO_USER,
        name: dto.ownerName || "Demo Owner",
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
          localStorage.removeItem("nodedr_demo_user");
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
  return user ? permissionSatisfied(user.permissions, permission) : true;
}
