import { z } from "zod";

export const loginSchema = z.object({
  // Login ID: an email address or a phone number (delivery riders sign in with their phone).
  email: z.string().trim().min(3).max(200),
  password: z.string().min(4).max(200),
  // Authenticator code or recovery code, once two-factor auth is on.
  totp: z.string().trim().min(6).max(20).optional(),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  restaurantName: z.string().trim().min(1),
  branchName: z.string().trim().min(1).default("Main Branch"),
  ownerName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const pinLoginSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be between 4 and 8 digits"),
});
export type PinLoginDto = z.infer<typeof pinLoginSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(200),
});
export type DeleteAccountDto = z.infer<typeof deleteAccountSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  roleId: z.string(),
  roleName: z.string(),
  permissions: z.array(z.string()),
  permissionsVersion: z.number().int().optional(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const twoFactorCodeSchema = z.object({ code: z.string().trim().min(6).max(20) });
export const twoFactorDisableSchema = z.object({
  password: z.string().min(1).max(200),
  code: z.string().trim().min(6).max(20),
});
