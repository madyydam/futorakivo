import { z } from "zod";

export const ApprovalOutcomeEnum = z.enum([
  "APPROVED",
  "USED",
  "EXPIRED",
  "DENIED",
]);
export type ApprovalOutcome = z.infer<typeof ApprovalOutcomeEnum>;

export const requestApprovalSchema = z.object({
  managerPin: z.string().regex(/^\d{4,8}$/, "Manager PIN must be between 4 and 8 digits"),
  permissionKey: z.string().min(1, "Permission key is required"),
  targetEntity: z.string().min(1, "Target entity is required"),
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  deviceId: z.string().optional(),
  changePayload: z.record(z.string(), z.unknown()).optional(),
});
export type RequestApprovalDto = z.infer<typeof requestApprovalSchema>;
