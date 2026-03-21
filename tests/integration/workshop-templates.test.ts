/**
 * Integration tests — WorkshopTemplate CRUD
 *
 * Requires DATABASE_URL pointing to a real Postgres instance.
 * Each test suite creates an isolated studio and tears it down on completion.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestPrisma, disconnectTestPrisma } from "../helpers/prisma";
import {
  createTestStudio,
  createTestUser,
  createTestOwner,
  cleanupStudio,
} from "../helpers/factories";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/services/workshop-templates";

const prisma = getTestPrisma();

let studioId: string;
let userId: string;

beforeAll(async () => {
  const studio = await createTestStudio(prisma);
  const user = await createTestUser(prisma);
  await createTestOwner(prisma, studio.id, user.id);
  studioId = studio.id;
  userId = user.id;
});

afterAll(async () => {
  await cleanupStudio(prisma, studioId);
  // Also clean up the user created outside the studio
  await prisma.user.deleteMany({ where: { id: userId } });
  await disconnectTestPrisma();
});

describe("createTemplate", () => {
  it("creates a template with required fields", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Pottery Basics",
    });

    expect(template.id).toBeDefined();
    expect(template.name).toBe("Pottery Basics");
    expect(template.studioId).toBe(studioId);
    expect(template.isActive).toBe(true);
    expect(template.durationMinutes).toBe(120);
    expect(template.minParticipants).toBe(1);
    expect(template.maxParticipants).toBe(12);
    expect(Number(template.defaultPrice)).toBe(0);
    expect(template.tags).toEqual([]);
  });

  it("creates a template with all fields", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Advanced Ceramics",
      description: "For experienced potters",
      durationMinutes: 180,
      minParticipants: 4,
      maxParticipants: 8,
      defaultPrice: 250,
      tags: ["advanced", "ceramics"],
      isActive: true,
    });

    expect(template.name).toBe("Advanced Ceramics");
    expect(template.description).toBe("For experienced potters");
    expect(template.durationMinutes).toBe(180);
    expect(template.minParticipants).toBe(4);
    expect(template.maxParticipants).toBe(8);
    expect(Number(template.defaultPrice)).toBe(250);
    expect(template.tags).toEqual(["advanced", "ceramics"]);
  });

  it("can create an inactive template", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Inactive Template",
      isActive: false,
    });
    expect(template.isActive).toBe(false);
  });
});

describe("listTemplates", () => {
  it("returns templates belonging to the studio", async () => {
    const templates = await listTemplates(prisma, studioId);
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
    for (const t of templates) {
      expect(t.studioId).toBe(studioId);
    }
  });

  it("does not return templates from other studios", async () => {
    const otherStudio = await createTestStudio(prisma);
    await createTemplate(prisma, otherStudio.id, { name: "Other Studio Template" });

    const templates = await listTemplates(prisma, studioId);
    const leaked = templates.find((t) => t.studioId === otherStudio.id);
    expect(leaked).toBeUndefined();

    await cleanupStudio(prisma, otherStudio.id);
  });
});

describe("getTemplate", () => {
  it("retrieves an existing template by id and studioId", async () => {
    const created = await createTemplate(prisma, studioId, {
      name: "Get Me",
    });

    const found = await getTemplate(prisma, created.id, studioId);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe("Get Me");
  });

  it("returns null for a mismatched studioId (tenant isolation)", async () => {
    const created = await createTemplate(prisma, studioId, {
      name: "Isolated",
    });

    const result = await getTemplate(prisma, created.id, "non-existent-studio");
    expect(result).toBeNull();
  });
});

describe("updateTemplate", () => {
  it("updates template fields", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Before Update",
      durationMinutes: 60,
    });

    await updateTemplate(prisma, template.id, studioId, {
      name: "After Update",
      durationMinutes: 90,
      tags: ["updated"],
    });

    const updated = await getTemplate(prisma, template.id, studioId);
    expect(updated!.name).toBe("After Update");
    expect(updated!.durationMinutes).toBe(90);
    expect(updated!.tags).toEqual(["updated"]);
  });

  it("does not update a template from another studio", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Should Not Change",
    });

    await updateTemplate(prisma, template.id, "wrong-studio-id", {
      name: "Hacked",
    });

    const unchanged = await getTemplate(prisma, template.id, studioId);
    expect(unchanged!.name).toBe("Should Not Change");
  });
});

describe("deleteTemplate", () => {
  it("deletes a template", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "To Delete",
    });

    await deleteTemplate(prisma, template.id, studioId);

    const result = await getTemplate(prisma, template.id, studioId);
    expect(result).toBeNull();
  });

  it("does not delete a template from another studio (tenant isolation)", async () => {
    const template = await createTemplate(prisma, studioId, {
      name: "Should Survive",
    });

    await deleteTemplate(prisma, template.id, "wrong-studio-id");

    const result = await getTemplate(prisma, template.id, studioId);
    expect(result).not.toBeNull();
  });
});
