"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type DeviceStatus = "PENDING" | "APPROVED" | "REVOKED";

export interface DeviceRegistration {
  id: string;
  restaurantId: string;
  outletId: string;
  outlet?: { id: string; name: string };
  label: string;
  status: DeviceStatus;
  userAgent?: string | null;
  lastSeenAt?: string | null;
  lastIp?: string | null;
  failedAttempts?: number;
  lockedUntil?: string | null;
  createdAt: string;
}

export interface PairingCodeResult {
  code: string;
  expiresAt: string;
  outletId: string;
}

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<DeviceRegistration[]>("/devices"),
    refetchInterval: 15_000, // Poll every 15s to keep live status fresh
  });
}

export function useCreatePairingCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { outletId: string }) =>
      api.post<PairingCodeResult>("/devices/pairing-code", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useApproveDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) =>
      api.post<DeviceRegistration>(`/devices/${deviceId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useRevokeDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) =>
      api.post<DeviceRegistration>(`/devices/${deviceId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

export function useUnlockDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) =>
      api.post<DeviceRegistration>(`/devices/${deviceId}/unlock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}
