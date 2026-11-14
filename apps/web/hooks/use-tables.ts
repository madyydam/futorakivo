"use client";

import type {
  BulkTableCreateDto,
  TableDto,
  TableLayoutUpdateDto,
  TableStatusDto,
  TableUpdateDto,
} from "@futora/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RestaurantTable {
  id: string;
  floorId: string;
  number: string;
  name: string | null;
  capacity: number;
  status: TableStatusDto;
  statusSince: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  shape: "square" | "round" | "rect";
  qrToken: string | null;
  assignedWaiter: { id: string; name: string } | null;
}

export interface Floor {
  id: string;
  name: string;
  sortOrder: number;
  tables: RestaurantTable[];
}

export const DEMO_FLOORS: Floor[] = [
  {
    id: "floor-1",
    name: "Ground Floor",
    sortOrder: 1,
    tables: [
      { id: "t1", floorId: "floor-1", number: "T1", name: "Window 1", capacity: 4, status: "OCCUPIED", statusSince: new Date().toISOString(), posX: 50, posY: 50, width: 80, height: 80, rotation: 0, shape: "square", qrToken: null, assignedWaiter: { id: "w1", name: "Rahul" } },
      { id: "t2", floorId: "floor-1", number: "T2", name: "Window 2", capacity: 4, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 160, posY: 50, width: 80, height: 80, rotation: 0, shape: "square", qrToken: null, assignedWaiter: null },
      { id: "t3", floorId: "floor-1", number: "T3", name: "Center Booth", capacity: 6, status: "OCCUPIED", statusSince: new Date().toISOString(), posX: 50, posY: 160, width: 120, height: 80, rotation: 0, shape: "rect", qrToken: null, assignedWaiter: { id: "w2", name: "Pooja" } },
      { id: "t4", floorId: "floor-1", number: "T4", name: "Corner 1", capacity: 2, status: "AVAILABLE", statusSince: new Date().toISOString(), posX: 200, posY: 160, width: 70, height: 70, rotation: 0, shape: "round", qrToken: null, assignedWaiter: null },
    ],
  },
];

export function useFloors(branchId: string | null) {
  return useQuery({
    queryKey: ["floors", branchId],
    queryFn: async () => {
      try {
        const res = await api.get<Floor[]>(`/tables/floors?branchId=${branchId}`);
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {
        // Fallback to demo floors
      }
      return DEMO_FLOORS;
    },
    enabled: true,
    refetchInterval: 10_000,
  });
}

export function useCreateFloor(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`/tables/floors?branchId=${branchId}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useUpdateFloor(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/tables/floors/${id}?branchId=${branchId}`, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useCreateTable(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: TableDto) => api.post(`/tables?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useBulkCreateTables(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkTableCreateDto) => api.post(`/tables/bulk?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useUpdateTable(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: TableUpdateDto }) =>
      api.patch(`/tables/${id}?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useUpdateTableLayout(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: TableLayoutUpdateDto[]) =>
      api.patch(`/tables/layout?branchId=${branchId}`, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useDeleteTable(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tables/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useUpdateTableStatus(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatusDto }) =>
      api.patch(`/tables/${id}/status?branchId=${branchId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}

export function useRotateQrToken(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<RestaurantTable>(`/tables/${id}/qr-token?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["floors", branchId] }),
  });
}
