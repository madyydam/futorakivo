import { z } from "zod";

export const updateOnboardingProgressSchema = z.object({
  currentStep: z.number().int().min(1).max(11),
  completedStep: z.number().int().min(1).max(11).optional(),
  draftJson: z
    .record(z.string().max(100), z.unknown())
    .refine(
      (val) => {
        try {
          const serialized = JSON.stringify(val);
          return serialized.length <= 500_000; // 500 KB payload safety cap
        } catch {
          return false;
        }
      },
      { message: "Draft payload exceeds safe 500KB limit or contains circular references" },
    )
    .optional(),
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
