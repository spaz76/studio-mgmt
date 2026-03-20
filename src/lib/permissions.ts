import type { Role, Permission } from "@/generated/prisma";

// Default permissions per role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "createWorkshop",
    "editWorkshop",
    "deleteWorkshop",
    "manageBookings",
    "createProduct",
    "editProduct",
    "updateProductStock",
    "createMaterial",
    "consumeMaterial",
    "updatePaymentStatus",
    "viewReports",
    "exportReports",
    "manageUsers",
    "changePlan",
    "editStudioSettings",
  ],
  MANAGER: [
    "createWorkshop",
    "editWorkshop",
    "deleteWorkshop",
    "manageBookings",
    "createProduct",
    "editProduct",
    "updateProductStock",
    "createMaterial",
    "consumeMaterial",
    "updatePaymentStatus",
    "viewReports",
    "exportReports",
  ],
  OPERATOR: [
    "createWorkshop",
    "editWorkshop",
    "manageBookings",
    "updateProductStock",
    "createMaterial",
    "consumeMaterial",
    "viewReports",
  ],
  VIEWER: ["viewReports"],
};

export function hasPermission(
  role: Role,
  permission: Permission,
  extraPermissions: Permission[] = [],
  revokedPermissions: Permission[] = []
): boolean {
  // Revoked always wins over extra/role
  if (revokedPermissions.includes(permission)) return false;
  // Extra grants always win
  if (extraPermissions.includes(permission)) return true;
  // Fall back to role defaults
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getEffectivePermissions(
  role: Role,
  extraPermissions: Permission[] = [],
  revokedPermissions: Permission[] = []
): Permission[] {
  const base = new Set(ROLE_PERMISSIONS[role] ?? []);

  for (const p of extraPermissions) base.add(p);
  for (const p of revokedPermissions) base.delete(p);

  return Array.from(base);
}
