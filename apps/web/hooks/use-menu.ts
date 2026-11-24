"use client";

import type { MenuCategoryDto, MenuItemDto } from "@futora/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  showOnWebsite: boolean;
  _count: { items: number };
}

export interface KitchenStation {
  id: string;
  name: string;
}

export interface Modifier {
  id: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  stationId: string | null;
  name: string;
  imageUrl: string | null;
  price: string;
  halfPrice: string | null;
  taxRatePercent: string;
  isVeg: boolean;
  isActive: boolean;
  isCombo: boolean;
  category: { id: string; name: string };
  station: { id: string; name: string } | null;
  modifierGroups: { modifierGroup: ModifierGroup }[];
}

export const DEMO_CATEGORIES: MenuCategory[] = [
  { id: "cat-1", name: "Main Course", sortOrder: 1, isActive: true, showOnWebsite: true, _count: { items: 3 } },
  { id: "cat-2", name: "Breads & Rice", sortOrder: 2, isActive: true, showOnWebsite: true, _count: { items: 2 } },
  { id: "cat-3", name: "Beverages", sortOrder: 3, isActive: true, showOnWebsite: true, _count: { items: 2 } },
];

export const DEMO_MENU_ITEMS: MenuItem[] = [
  { id: "item-1", categoryId: "cat-1", stationId: null, name: "Paneer Butter Masala", imageUrl: null, price: "280", halfPrice: "160", taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-1", name: "Main Course" }, station: null, modifierGroups: [] },
  { id: "item-2", categoryId: "cat-1", stationId: null, name: "Dal Makhani", imageUrl: null, price: "240", halfPrice: "140", taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-1", name: "Main Course" }, station: null, modifierGroups: [] },
  { id: "item-3", categoryId: "cat-1", stationId: null, name: "Veg Biryani", imageUrl: null, price: "260", halfPrice: null, taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-1", name: "Main Course" }, station: null, modifierGroups: [] },
  { id: "item-4", categoryId: "cat-2", stationId: null, name: "Butter Naan", imageUrl: null, price: "50", halfPrice: null, taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-2", name: "Breads & Rice" }, station: null, modifierGroups: [] },
  { id: "item-5", categoryId: "cat-2", stationId: null, name: "Jeera Rice", imageUrl: null, price: "140", halfPrice: "90", taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-2", name: "Breads & Rice" }, station: null, modifierGroups: [] },
  { id: "item-6", categoryId: "cat-3", stationId: null, name: "Cold Coffee", imageUrl: null, price: "120", halfPrice: null, taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-3", name: "Beverages" }, station: null, modifierGroups: [] },
  { id: "item-7", categoryId: "cat-3", stationId: null, name: "Fresh Lime Soda", imageUrl: null, price: "80", halfPrice: null, taxRatePercent: "5", isVeg: true, isActive: true, isCombo: false, category: { id: "cat-3", name: "Beverages" }, station: null, modifierGroups: [] },
];

function getCached<T>(key: string): T | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setCached(key: string, data: unknown) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function useCategories(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "categories", branchId],
    queryFn: async () => {
      const cacheKey = `kivo.pos.cache.categories.${branchId || "all"}`;
      try {
        const res = await api.get<MenuCategory[]>(`/menu/categories?branchId=${branchId}`);
        if (Array.isArray(res) && res.length > 0) {
          setCached(cacheKey, res);
          return res;
        }
      } catch {
        // Fallback to cached categories or demo
      }
      const cached = getCached<MenuCategory[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
      return DEMO_CATEGORIES;
    },
    enabled: true,
  });
}

export function useStations(branchId: string | null) {
  return useQuery({
    queryKey: ["menu", "stations", branchId],
    queryFn: async () => {
      try {
        const res = await api.get<KitchenStation[]>(`/menu/stations?branchId=${branchId}`);
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {
        // ignore
      }
      return [{ id: "st-1", name: "Main Kitchen" }, { id: "st-2", name: "Beverage Bar" }];
    },
    enabled: true,
  });
}

export function useMenuItems(branchId: string | null, categoryId?: string) {
  return useQuery({
    queryKey: ["menu", "items", branchId, categoryId],
    queryFn: async () => {
      const cacheKey = `kivo.pos.cache.items.${branchId || "all"}`;
      try {
        const res = await api.get<MenuItem[]>(
          `/menu/items?branchId=${branchId}${categoryId ? `&categoryId=${categoryId}` : ""}`,
        );
        if (Array.isArray(res) && res.length > 0) {
          if (!categoryId) setCached(cacheKey, res);
          return res;
        }
      } catch {
        // Fallback to cached items
      }
      const cachedAll = getCached<MenuItem[]>(cacheKey);
      if (cachedAll && cachedAll.length > 0) {
        return categoryId ? cachedAll.filter((i) => i.categoryId === categoryId) : cachedAll;
      }
      if (categoryId) {
        return DEMO_MENU_ITEMS.filter((i) => i.categoryId === categoryId);
      }
      return DEMO_MENU_ITEMS;
    },
    enabled: true,
  });
}

export function useCreateCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MenuCategoryDto) =>
      api.post(`/menu/categories?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] }),
  });
}

export function useUpdateCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuCategoryDto> }) =>
      api.patch(`/menu/categories/${id}?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] }),
  });
}

export function useDeleteCategory(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/categories/${id}?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu", "categories", branchId] });
      queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] });
    },
  });
}

export function useUploadItemImage() {
  return useMutation({
    mutationFn: (file: File) => api.upload<{ url: string }>("/menu/items/upload-image", file),
  });
}

export function useCreateMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: MenuItemDto) => api.post(`/menu/items?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}

export function useUpdateMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<MenuItemDto> }) =>
      api.patch(`/menu/items/${id}?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}

export function useDeleteMenuItem(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/items/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] }),
  });
}

export interface BulkPriceResult {
  applied: boolean;
  count: number;
  total: number;
  sample: { name: string; before: number; after: number }[];
}

/** Raise (+) or lower (−) every dish price by a percentage; `preview` writes nothing. */
export function useBulkPrice(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { percent: number; categoryId?: string; roundToWhole: boolean; preview: boolean }) =>
      api.post<BulkPriceResult>(`/menu/items/bulk-price?branchId=${branchId}`, dto),
    onSuccess: (r) => {
      if (r.applied) void queryClient.invalidateQueries({ queryKey: ["menu", "items", branchId] });
    },
  });
}
