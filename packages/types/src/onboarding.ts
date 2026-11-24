import { z } from "zod";

export const updateOnboardingProgressSchema = z.object({
  currentStep: z.number().int().min(1).max(11),
  completedStep: z.number().int().min(1).max(11).optional(),
  draftJson: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateOnboardingProgressDto = z.infer<typeof updateOnboardingProgressSchema>;

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  draftJson: Record<string, any>;
  restaurant: {
    id: string;
    name: string;
    status: string;
  };
}
