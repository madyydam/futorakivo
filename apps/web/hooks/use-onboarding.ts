"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OnboardingState, UpdateOnboardingProgressDto } from "@futora/types";
import { api } from "@/lib/api";

export function useOnboarding() {
  return useQuery<OnboardingState>({
    queryKey: ["onboarding"],
    queryFn: () => api.get<OnboardingState>("/onboarding"),
    staleTime: 60_000,
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateOnboardingProgressDto) =>
      api.put<OnboardingState>("/onboarding/progress", dto),
    onSuccess: (data) => {
      queryClient.setQueryData(["onboarding"], data);
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<{ success: boolean; message: string; redirect: string }>(
        "/onboarding/complete",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
