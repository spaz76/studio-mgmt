import { describe, it, expect } from "vitest";
import {
  hasPermission,
  getEffectivePermissions,
} from "@/lib/permissions";
import type { Permission, Role } from "@/generated/prisma";

describe("hasPermission", () => {
  describe("OWNER role", () => {
    it("grants all permissions by default", () => {
      const ownerPerms: Permission[] = [
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
      ];
      for (const perm of ownerPerms) {
        expect(hasPermission("OWNER", perm)).toBe(true);
      }
    });
  });

  describe("VIEWER role", () => {
    it("only grants viewReports", () => {
      expect(hasPermission("VIEWER", "viewReports")).toBe(true);
      expect(hasPermission("VIEWER", "createWorkshop")).toBe(false);
      expect(hasPermission("VIEWER", "manageUsers")).toBe(false);
      expect(hasPermission("VIEWER", "exportReports")).toBe(false);
    });
  });

  describe("OPERATOR role", () => {
    it("cannot delete workshops by default", () => {
      expect(hasPermission("OPERATOR", "deleteWorkshop")).toBe(false);
    });

    it("can create workshops", () => {
      expect(hasPermission("OPERATOR", "createWorkshop")).toBe(true);
    });

    it("cannot manage users", () => {
      expect(hasPermission("OPERATOR", "manageUsers")).toBe(false);
    });
  });

  describe("extra permissions", () => {
    it("grants a permission not in the role defaults", () => {
      const extra: Permission[] = ["exportReports"];
      expect(hasPermission("OPERATOR", "exportReports", extra)).toBe(true);
    });

    it("extra permissions do not override revocations", () => {
      const extra: Permission[] = ["createWorkshop"];
      const revoked: Permission[] = ["createWorkshop"];
      // revoked takes priority over extra
      expect(hasPermission("OPERATOR", "createWorkshop", extra, revoked)).toBe(false);
    });
  });

  describe("revoked permissions", () => {
    it("removes a permission the role normally has", () => {
      const revoked: Permission[] = ["createWorkshop"];
      expect(hasPermission("OPERATOR", "createWorkshop", [], revoked)).toBe(false);
    });

    it("revokes even owner-level permissions", () => {
      const revoked: Permission[] = ["manageUsers"];
      expect(hasPermission("OWNER", "manageUsers", [], revoked)).toBe(false);
    });
  });

  describe("MANAGER role", () => {
    it("has operational permissions but not manageUsers / changePlan / editStudioSettings", () => {
      expect(hasPermission("MANAGER", "createWorkshop")).toBe(true);
      expect(hasPermission("MANAGER", "viewReports")).toBe(true);
      expect(hasPermission("MANAGER", "exportReports")).toBe(true);
      expect(hasPermission("MANAGER", "manageUsers")).toBe(false);
      expect(hasPermission("MANAGER", "changePlan")).toBe(false);
      expect(hasPermission("MANAGER", "editStudioSettings")).toBe(false);
    });
  });
});

describe("getEffectivePermissions", () => {
  it("returns the base role permissions", () => {
    const perms = getEffectivePermissions("VIEWER");
    expect(perms).toEqual(["viewReports"]);
  });

  it("adds extra permissions", () => {
    const perms = getEffectivePermissions("VIEWER", ["exportReports"]);
    expect(perms).toContain("viewReports");
    expect(perms).toContain("exportReports");
  });

  it("removes revoked permissions", () => {
    const perms = getEffectivePermissions("MANAGER", [], ["createWorkshop"]);
    expect(perms).not.toContain("createWorkshop");
  });

  it("does not duplicate permissions when extra overlaps role defaults", () => {
    const perms = getEffectivePermissions("VIEWER", ["viewReports"]);
    const count = perms.filter((p) => p === "viewReports").length;
    expect(count).toBe(1);
  });

  it("handles all roles without throwing", () => {
    const roles: Role[] = ["OWNER", "MANAGER", "OPERATOR", "VIEWER"];
    for (const role of roles) {
      expect(() => getEffectivePermissions(role)).not.toThrow();
    }
  });
});
