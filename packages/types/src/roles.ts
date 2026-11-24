import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(60),
  permissionKeys: z.array(z.string().min(1)).max(100).default([]),
});
export type CreateRoleDto = z.infer<typeof createRoleSchema>;

// `name` is deliberately absent — a role's name is immutable once created
// (system or custom); only its display label and permission grants can
// change via PATCH.
export const updateRoleSchema = z
  .object({
    label: z.string().trim().min(1).max(60).optional(),
    permissionKeys: z.array(z.string().min(1)).max(100).optional(),
  })
  .refine((d) => d.label !== undefined || d.permissionKeys !== undefined, {
    message: "At least one field (label or permissionKeys) must be provided",
  });
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
