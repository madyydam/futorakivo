"use client";

import type {
  BranchSettingsDto,
  RestaurantSettingsDto,
  TaxMode,
  TaxRegime,
} from "@futora/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RestaurantSettings {
  id: string;
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  currency: string;
  timezone: string;
  upiVpa: string | null;
  upiPayeeName: string | null;
  loyaltyPointValue: string;
  loyaltyEarnPerCurrency: number;
  referralEnabled: boolean;
  referralSharerPoints: number;
  referralReferredPoints: number;
  referralMinPurchase: string;
  onlineMinOrderAmount: string;
  onlinePriceAdjustKind: "PERCENT" | "AMOUNT";
  onlinePriceAdjustValue: string;
  maxManualDiscountPercent: string;
  requireDiscountReason: boolean;
}

export interface BranchSettings {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  gstNumber: string | null;
  country: string;
  taxRegime: TaxRegime;
  taxMode: TaxMode;
  taxLabel: string | null;
  taxId: string | null;
  autoConfirmOrders: boolean;
  autoConfirmReservations: boolean;
  kioskToken: string | null;
  kioskDineInEnabled: boolean;
  kioskTakeawayEnabled: boolean;
  printerPaperWidthMm: 58 | 80;
  printerCodepage: "CP437" | "CP850" | "CP858" | "CP1252";
  printerColumns: number | null;
  printerConnection: "USB" | "NETWORK";
  printerHost: string | null;
  printerPort: number;
}

export function useSettings(branchId: string | null) {
  return useQuery({
    queryKey: ["settings", branchId],
    queryFn: () =>
      api.get<{ restaurant: RestaurantSettings; branch: BranchSettings }>(
        `/settings?branchId=${branchId}`,
      ),
    enabled: !!branchId,
  });
}

// The slice every signed-in role may read. Used by the app shell, checkout and
// menu dialogs; the full useSettings (settings.manage only) stays for the
// Settings screens.
export type DisplayRestaurant = Pick<
  RestaurantSettings,
  | "id" | "name" | "legalName" | "logoUrl" | "currency" | "timezone"
  | "upiVpa" | "upiPayeeName" | "loyaltyPointValue" | "loyaltyEarnPerCurrency" | "referralEnabled" | "referralSharerPoints" | "referralReferredPoints" | "referralMinPurchase" | "onlineMinOrderAmount" | "onlinePriceAdjustKind" | "onlinePriceAdjustValue"
  | "maxManualDiscountPercent" | "requireDiscountReason"
>;
export type DisplayBranch = Pick<
  BranchSettings,
  "id" | "name" | "address" | "phone" | "gstNumber" | "country" | "taxRegime" | "taxMode" | "taxLabel" | "taxId"
>;

function cleanBrandName(n?: string | null): string {
  if (!n) return "HORECA OS";
  return n
    .replace(/nodedr\s*bistro(\s*\(demo\))?/gi, "HORECA OS")
    .replace(/FUTORA group\s*horeca/gi, "HORECA OS")
    .replace(/nodedr/gi, "HORECA OS")
    .replace(/\s*\(demo\)/gi, "")
    .replace(/bistro/gi, "")
    .trim() || "HORECA OS";
}

export function useDisplaySettings(branchId: string | null) {
  return useQuery({
    queryKey: ["settings", branchId, "display"],
    queryFn: async () => {
      try {
        const res = await api.get<{ restaurant: DisplayRestaurant; branch: DisplayBranch }>(
          `/settings/display?branchId=${branchId}`,
        );
        if (res?.restaurant) {
          if (res.restaurant.name) {
            res.restaurant.name = cleanBrandName(res.restaurant.name);
          }
          return res;
        }
      } catch {
        // Fallback to default branding
      }
      const customRestName =
        typeof window !== "undefined" ? localStorage.getItem("FUTORA group_restaurant_name") : null;
      const customBranchName =
        typeof window !== "undefined" ? localStorage.getItem("FUTORA group_branch_name") : null;

      return {
        restaurant: {
          id: "demo-restaurant",
          name: cleanBrandName(customRestName) || "HORECA OS",
          legalName: `${cleanBrandName(customRestName) || "HORECA OS"} Pvt Ltd`,
          logoUrl: null,
          currency: "INR",
          timezone: "Asia/Kolkata",
          upiVpa: null,
          upiPayeeName: null,
          loyaltyPointValue: "1",
          loyaltyEarnPerCurrency: 0.05,
          referralEnabled: false,
          referralSharerPoints: 50,
          referralReferredPoints: 50,
          referralMinPurchase: "500",
          onlineMinOrderAmount: "200",
          onlinePriceAdjustKind: "PERCENT" as const,
          onlinePriceAdjustValue: "0",
          maxManualDiscountPercent: "20",
          requireDiscountReason: false,
        },
        branch: {
          id: branchId ?? "main-branch",
          name: customBranchName || "Main Branch",
          address: customBranchName || "Main Branch",
          phone: null,
          gstNumber: null,
          country: "IN",
          taxRegime: "GST" as TaxRegime,
          taxMode: "EXCLUSIVE" as TaxMode,
          taxLabel: "GST",
          taxId: null,
        },
      };
    },
    enabled: true,
  });
}

export function useUpdateRestaurantSettings(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RestaurantSettingsDto) => api.patch("/settings/restaurant", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useUploadRestaurantLogo() {
  return useMutation({
    mutationFn: (file: File) => api.upload<{ url: string }>("/settings/restaurant/logo", file),
  });
}

export function useUpdateBranchSettings(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: BranchSettingsDto) =>
      api.patch(`/settings/branch?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}

export function useSetKiosk(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "enable" | "rotate" | "disable") =>
      api.post<{ kioskToken: string | null }>(`/settings/kiosk/${action}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", branchId] }),
  });
}
