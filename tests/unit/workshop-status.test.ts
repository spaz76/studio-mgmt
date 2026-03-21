import { describe, it, expect } from "vitest";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";
import type { WorkshopStatus } from "@/generated/prisma";

const ALL_STATUSES: WorkshopStatus[] = [
  "draft",
  "open",
  "pending_minimum",
  "confirmed",
  "full",
  "cancelled",
  "postponed",
  "completed",
];

describe("STATUS_LABELS", () => {
  it("has a label for every status", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe("string");
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });

  it("returns Hebrew text", () => {
    // Basic Hebrew unicode range check
    const hebrewRegex = /[\u05D0-\u05EA]/;
    for (const status of ALL_STATUSES) {
      expect(hebrewRegex.test(STATUS_LABELS[status])).toBe(true);
    }
  });

  it("maps specific statuses to expected labels", () => {
    expect(STATUS_LABELS.draft).toBe("טיוטה");
    expect(STATUS_LABELS.open).toBe("פתוח");
    expect(STATUS_LABELS.cancelled).toBe("מבוטל");
    expect(STATUS_LABELS.completed).toBe("הסתיים");
  });
});

describe("STATUS_VARIANTS", () => {
  const VALID_VARIANTS = ["default", "secondary", "destructive", "outline"] as const;

  it("has a badge variant for every status", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_VARIANTS[status]).toBeDefined();
      expect(VALID_VARIANTS).toContain(STATUS_VARIANTS[status]);
    }
  });

  it("uses destructive variant for cancelled", () => {
    expect(STATUS_VARIANTS.cancelled).toBe("destructive");
  });

  it("uses default variant for confirmed and full (active states)", () => {
    expect(STATUS_VARIANTS.confirmed).toBe("default");
    expect(STATUS_VARIANTS.full).toBe("default");
  });

  it("uses outline variant for draft/pending_minimum/postponed", () => {
    expect(STATUS_VARIANTS.draft).toBe("outline");
    expect(STATUS_VARIANTS.pending_minimum).toBe("outline");
    expect(STATUS_VARIANTS.postponed).toBe("outline");
  });
});

describe("recomputeEventStatus logic", () => {
  // Test the status-machine rules in isolation (without DB).
  // These rules are extracted from src/services/workshop-events.ts.

  function computeStatus(
    currentStatus: WorkshopStatus,
    bookingCount: number,
    minParticipants: number,
    maxParticipants: number
  ): WorkshopStatus {
    // Mirror the logic from recomputeEventStatus
    if (
      currentStatus === "cancelled" ||
      currentStatus === "postponed" ||
      currentStatus === "completed" ||
      currentStatus === "draft"
    ) {
      return currentStatus;
    }

    if (bookingCount >= maxParticipants) return "full";
    if (bookingCount >= minParticipants) return "confirmed";
    if (bookingCount > 0) return "pending_minimum";
    return "open";
  }

  it("stays in terminal states regardless of count", () => {
    const terminals: WorkshopStatus[] = ["cancelled", "postponed", "completed", "draft"];
    for (const status of terminals) {
      expect(computeStatus(status, 5, 4, 10)).toBe(status);
      expect(computeStatus(status, 0, 4, 10)).toBe(status);
    }
  });

  it("transitions to full when at capacity", () => {
    expect(computeStatus("open", 10, 4, 10)).toBe("full");
    expect(computeStatus("confirmed", 10, 4, 10)).toBe("full");
  });

  it("transitions to confirmed when at or above minimum", () => {
    expect(computeStatus("open", 4, 4, 10)).toBe("confirmed");
    expect(computeStatus("open", 7, 4, 10)).toBe("confirmed");
  });

  it("transitions to pending_minimum when bookings exist but below minimum", () => {
    expect(computeStatus("open", 1, 4, 10)).toBe("pending_minimum");
    expect(computeStatus("open", 3, 4, 10)).toBe("pending_minimum");
  });

  it("transitions to open when no bookings", () => {
    expect(computeStatus("confirmed", 0, 4, 10)).toBe("open");
    expect(computeStatus("pending_minimum", 0, 4, 10)).toBe("open");
  });
});
