"use client";

import type { CustomerAddressDto, CustomerDto } from "@futora/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Customer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  anniversary: string | null;
  allergies: string | null;
  notes: string | null;
  marketingOptOut?: boolean;
  loyaltyPoints: number;
  walletBalance: string;
  visitCount?: number;
  lastTableNumber?: string | null;
  lastVisitedAt?: string | null;
  orders?: { totalAmount: string }[];
  consents?: CustomerConsentAudit[];
  createdAt: string;
}

export interface CustomerOrderItemModifier {
  id: string;
  nameSnapshot: string;
  priceAdjSnapshot: string;
}

export interface CustomerOrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: string;
  lineTotal: string;
  status: string;
  modifiers?: CustomerOrderItemModifier[];
}

export interface CustomerPayment {
  id: string;
  method: string;
  amount: string;
  reference?: string | null;
  createdAt: string;
}

export interface CustomerOrderHistory {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  tipAmount: string;
  totalAmount: string;
  createdAt: string;
  billedAt: string | null;
  guestName: string | null;
  table?: { id: string; number: string; name: string | null } | null;
  items: CustomerOrderItem[];
  payments: CustomerPayment[];
}

export interface CustomerConsentAudit {
  id: string;
  termsVersion: string;
  consentedAt: string;
  consentIp: string | null;
  userAgent: string | null;
  isAffirmative: boolean;
  scope: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  street: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  instructions: string | null;
  isDefault: boolean;
}

export interface CustomerDetail extends Customer {
  addresses: CustomerAddress[];
  orders: { id: string; orderNumber: string; totalAmount: string; billedAt: string }[];
  giftCards: { id: string; code: string; balance: string; initialValue: string }[];
}

export function useCustomers(branchId: string | null, search?: string) {
  return useQuery({
    queryKey: ["customers", branchId, search],
    queryFn: () =>
      api.get<Customer[]>(`/customers?branchId=${branchId}${search ? `&search=${search}` : ""}`),
    enabled: !!branchId,
  });
}

export function useCustomer(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "detail", id],
    queryFn: () => api.get<CustomerDetail>(`/customers/${id}?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useCreateCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CustomerDto) => api.post<Customer>(`/customers?branchId=${branchId}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", branchId] }),
  });
}

export function useUpdateCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CustomerDto> }) =>
      api.patch<Customer>(`/customers/${id}?branchId=${branchId}`, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers", branchId] });
      queryClient.invalidateQueries({ queryKey: ["customers", branchId, "detail", id] });
    },
  });
}

export function useDeleteCustomer(branchId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}?branchId=${branchId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", branchId] }),
  });
}

export function useCustomerAddresses(branchId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "addresses", customerId],
    queryFn: () => api.get<CustomerAddress[]>(`/customers/${customerId}/addresses?branchId=${branchId}`),
    enabled: !!branchId && !!customerId,
  });
}

function useAddressInvalidation(branchId: string | null, customerId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["customers", branchId, "addresses", customerId] });
    queryClient.invalidateQueries({ queryKey: ["customers", branchId, "detail", customerId] });
  };
}

export function useAddAddress(branchId: string | null, customerId: string) {
  const done = useAddressInvalidation(branchId, customerId);
  return useMutation({
    mutationFn: (dto: CustomerAddressDto) =>
      api.post<CustomerAddress>(`/customers/${customerId}/addresses?branchId=${branchId}`, dto),
    onSuccess: done,
  });
}

export function useUpdateAddress(branchId: string | null, customerId: string) {
  const done = useAddressInvalidation(branchId, customerId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CustomerAddressDto> }) =>
      api.patch<CustomerAddress>(`/customers/${customerId}/addresses/${id}?branchId=${branchId}`, dto),
    onSuccess: done,
  });
}

export function useDeleteAddress(branchId: string | null, customerId: string) {
  const done = useAddressInvalidation(branchId, customerId);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${customerId}/addresses/${id}?branchId=${branchId}`),
    onSuccess: done,
  });
}

export interface CustomerRewards {
  referralEnabled: boolean;
  code: string | null;
  points: number;
  pointValue: number;
  currency: string;
  balanceValue: number;
  sharerPoints: number;
  referredPoints: number;
  rewards: { points: number; discount: number }[];
  invited: number;
  rewarded: number;
  pointsFromReferrals: number;
  referredBy: "PENDING" | "REWARDED" | null;
  history: { delta: number; reason: string; createdAt: string }[];
}

export function useCustomerRewards(branchId: string | null, id: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "rewards", id],
    queryFn: () => api.get<CustomerRewards>(`/customers/${id}/rewards?branchId=${branchId}`),
    enabled: !!branchId && !!id,
  });
}

export function useCustomerHistory(branchId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "history", customerId],
    queryFn: () =>
      api.get<CustomerOrderHistory[]>(`/customers/${customerId}/history?branchId=${branchId}`),
    enabled: !!branchId && !!customerId,
  });
}

export function useCustomerConsent(branchId: string | null, customerId: string | null) {
  return useQuery({
    queryKey: ["customers", branchId, "consent", customerId],
    queryFn: () =>
      api.get<CustomerConsentAudit[]>(`/customers/${customerId}/consent?branchId=${branchId}`),
    enabled: !!branchId && !!customerId,
  });
}
