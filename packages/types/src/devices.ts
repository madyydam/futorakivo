import { z } from "zod";

export const DeviceStatusEnum = z.enum(["PENDING", "APPROVED", "REVOKED"]);
export type DeviceStatus = z.infer<typeof DeviceStatusEnum>;

export const createPairingCodeSchema = z.object({
  outletId: z.string().min(1, "Outlet ID is required"),
});
export type CreatePairingCodeDto = z.infer<typeof createPairingCodeSchema>;

export const pairDeviceSchema = z.object({
  code: z.string().trim().min(4).max(12),
  label: z.string().trim().min(1).max(100),
  userAgent: z.string().optional(),
});
export type PairDeviceDto = z.infer<typeof pairDeviceSchema>;

export const devicePinLoginSchema = z.object({
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be between 4 and 8 digits"),
  deviceToken: z.string().optional(),
});
export type DevicePinLoginDto = z.infer<typeof devicePinLoginSchema>;

export const updateStaffPinSchema = z.object({
  staffUserId: z.string().min(1),
  newPin: z.string().regex(/^\d{4,8}$/, "PIN must be between 4 and 8 digits"),
});
export type UpdateStaffPinDto = z.infer<typeof updateStaffPinSchema>;
