import { describe, it, expect } from "fieldtest";
import {
  statusToColor,
  statusToLabel,
  statusToIcon,
  isActiveStatus,
  canTransitionTo,
  getStatusWeight,
  complianceStatusToColor,
  complianceStatusToLabel,
} from "./status";
import type { Status, ComplianceStatus } from "../types";

describe("status", () => {
  const allStatuses: Status[] = ["active", "inactive", "pending", "archived"];
  const allComplianceStatuses: ComplianceStatus[] = [
    "compliant",
    "non-compliant",
    "in-progress",
    "not-applicable",
  ];

  describe("statusToColor", () => {
    const cases: { status: Status; color: string }[] = [
      { status: "active", color: "#22c55e" },
      { status: "inactive", color: "#6b7280" },
      { status: "pending", color: "#f59e0b" },
      { status: "archived", color: "#9ca3af" },
    ];
    for (const c of cases) {
      it(`statusToColor("${c.status}") returns "${c.color}"`, () => {
        expect(statusToColor(c.status)).toBe(c.color);
      });
    }
    for (const s of allStatuses) {
      it(`statusToColor("${s}") returns a hex color string`, () => {
        expect(statusToColor(s).startsWith("#")).toBeTruthy();
      });
    }
    it("returns different colors for different statuses", () => {
      const colors = allStatuses.map(statusToColor);
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
    it("active status has green color", () => {
      expect(statusToColor("active")).toBe("#22c55e");
    });
    it("inactive status has gray color", () => {
      expect(statusToColor("inactive")).toBe("#6b7280");
    });
  });

  describe("statusToLabel", () => {
    const cases: { status: Status; label: string }[] = [
      { status: "active", label: "Active" },
      { status: "inactive", label: "Inactive" },
      { status: "pending", label: "Pending" },
      { status: "archived", label: "Archived" },
    ];
    for (const c of cases) {
      it(`statusToLabel("${c.status}") returns "${c.label}"`, () => {
        expect(statusToLabel(c.status)).toBe(c.label);
      });
    }
    for (const s of allStatuses) {
      it(`statusToLabel("${s}") returns a non-empty string`, () => {
        expect(statusToLabel(s).length).toBeGreaterThan(0);
      });
    }
    for (const s of allStatuses) {
      it(`statusToLabel("${s}") starts with capital letter`, () => {
        const label = statusToLabel(s);
        expect(label[0]).toBe(label[0].toUpperCase());
      });
    }
    it("returns different labels for different statuses", () => {
      const labels = allStatuses.map(statusToLabel);
      const unique = new Set(labels);
      expect(unique.size).toBe(4);
    });
  });

  describe("statusToIcon", () => {
    const cases: { status: Status; icon: string }[] = [
      { status: "active", icon: "✅" },
      { status: "inactive", icon: "⭕" },
      { status: "pending", icon: "⏳" },
      { status: "archived", icon: "📁" },
    ];
    for (const c of cases) {
      it(`statusToIcon("${c.status}") returns "${c.icon}"`, () => {
        expect(statusToIcon(c.status)).toBe(c.icon);
      });
    }
    for (const s of allStatuses) {
      it(`statusToIcon("${s}") returns a non-empty string`, () => {
        expect(statusToIcon(s).length).toBeGreaterThan(0);
      });
    }
    it("returns different icons for different statuses", () => {
      const icons = allStatuses.map(statusToIcon);
      const unique = new Set(icons);
      expect(unique.size).toBe(4);
    });
  });

  describe("isActiveStatus", () => {
    it("returns true for active status", () => {
      expect(isActiveStatus("active")).toBeTruthy();
    });
    it("returns false for inactive status", () => {
      expect(isActiveStatus("inactive")).toBeFalsy();
    });
    it("returns false for pending status", () => {
      expect(isActiveStatus("pending")).toBeFalsy();
    });
    it("returns false for archived status", () => {
      expect(isActiveStatus("archived")).toBeFalsy();
    });
    it("only active status returns true", () => {
      const activeStatuses = allStatuses.filter(isActiveStatus);
      expect(activeStatuses).toHaveLength(1);
      expect(activeStatuses[0]).toBe("active");
    });
  });

  describe("canTransitionTo", () => {
    const validTransitions: { from: Status; to: Status }[] = [
      { from: "active", to: "inactive" },
      { from: "active", to: "archived" },
      { from: "inactive", to: "active" },
      { from: "inactive", to: "archived" },
      { from: "pending", to: "active" },
      { from: "pending", to: "inactive" },
      { from: "pending", to: "archived" },
    ];
    for (const t of validTransitions) {
      it(`can transition from "${t.from}" to "${t.to}"`, () => {
        expect(canTransitionTo(t.from, t.to)).toBeTruthy();
      });
    }
    const invalidTransitions: { from: Status; to: Status }[] = [
      { from: "archived", to: "active" },
      { from: "archived", to: "inactive" },
      { from: "archived", to: "pending" },
      { from: "active", to: "pending" },
      { from: "inactive", to: "pending" },
    ];
    for (const t of invalidTransitions) {
      it(`cannot transition from "${t.from}" to "${t.to}"`, () => {
        expect(canTransitionTo(t.from, t.to)).toBeFalsy();
      });
    }
    it("archived has no valid transitions", () => {
      const validToStatuses = allStatuses.filter((to) => canTransitionTo("archived", to));
      expect(validToStatuses).toHaveLength(0);
    });
    it("pending can transition to most statuses", () => {
      const validToStatuses = allStatuses.filter((to) => canTransitionTo("pending", to));
      expect(validToStatuses.length).toBeGreaterThan(0);
    });
  });

  describe("getStatusWeight", () => {
    const cases: { status: Status; weight: number }[] = [
      { status: "active", weight: 1 },
      { status: "pending", weight: 2 },
      { status: "inactive", weight: 3 },
      { status: "archived", weight: 4 },
    ];
    for (const c of cases) {
      it(`getStatusWeight("${c.status}") returns ${c.weight}`, () => {
        expect(getStatusWeight(c.status)).toBe(c.weight);
      });
    }
    it("weights are unique for each status", () => {
      const weights = allStatuses.map(getStatusWeight);
      const unique = new Set(weights);
      expect(unique.size).toBe(4);
    });
    it("active has lowest weight", () => {
      const activeWeight = getStatusWeight("active");
      for (const s of allStatuses) {
        if (s !== "active") {
          expect(getStatusWeight(s)).toBeGreaterThan(activeWeight);
        }
      }
    });
    it("archived has highest weight", () => {
      const archivedWeight = getStatusWeight("archived");
      for (const s of allStatuses) {
        if (s !== "archived") {
          expect(getStatusWeight(s)).toBeLessThan(archivedWeight);
        }
      }
    });
  });

  describe("complianceStatusToColor", () => {
    const cases: { status: ComplianceStatus; color: string }[] = [
      { status: "compliant", color: "#22c55e" },
      { status: "non-compliant", color: "#ef4444" },
      { status: "in-progress", color: "#f59e0b" },
      { status: "not-applicable", color: "#9ca3af" },
    ];
    for (const c of cases) {
      it(`complianceStatusToColor("${c.status}") returns "${c.color}"`, () => {
        expect(complianceStatusToColor(c.status)).toBe(c.color);
      });
    }
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToColor("${s}") returns a hex string`, () => {
        expect(complianceStatusToColor(s).startsWith("#")).toBeTruthy();
      });
    }
    it("returns different colors for different compliance statuses", () => {
      const colors = allComplianceStatuses.map(complianceStatusToColor);
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
    it("compliant is green", () => {
      expect(complianceStatusToColor("compliant")).toBe("#22c55e");
    });
    it("non-compliant is red", () => {
      expect(complianceStatusToColor("non-compliant")).toBe("#ef4444");
    });
  });

  describe("complianceStatusToLabel", () => {
    const cases: { status: ComplianceStatus; label: string }[] = [
      { status: "compliant", label: "Compliant" },
      { status: "non-compliant", label: "Non-Compliant" },
      { status: "in-progress", label: "In Progress" },
      { status: "not-applicable", label: "Not Applicable" },
    ];
    for (const c of cases) {
      it(`complianceStatusToLabel("${c.status}") returns "${c.label}"`, () => {
        expect(complianceStatusToLabel(c.status)).toBe(c.label);
      });
    }
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToLabel("${s}") returns a non-empty string`, () => {
        expect(complianceStatusToLabel(s).length).toBeGreaterThan(0);
      });
    }
    it("returns different labels for all compliance statuses", () => {
      const labels = allComplianceStatuses.map(complianceStatusToLabel);
      const unique = new Set(labels);
      expect(unique.size).toBe(4);
    });
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToLabel("${s}") starts with capital`, () => {
        const label = complianceStatusToLabel(s);
        expect(label[0]).toBe(label[0].toUpperCase());
      });
    }
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToLabel("${s}") returns string type`, () => {
        expect(typeof complianceStatusToLabel(s)).toBe("string");
      });
    }
  });

  describe("statusToColor additional", () => {
    for (const s of allStatuses) {
      it(`statusToColor("${s}") returns string type`, () => {
        expect(typeof statusToColor(s)).toBe("string");
      });
    }
    for (const s of allStatuses) {
      it(`statusToColor("${s}") has length 7`, () => {
        expect(statusToColor(s).length).toBe(7);
      });
    }
    it("active and inactive have different colors", () => {
      expect(statusToColor("active")).not.toBe(statusToColor("inactive"));
    });
    it("pending and archived have different colors", () => {
      expect(statusToColor("pending")).not.toBe(statusToColor("archived"));
    });
  });

  describe("statusToLabel additional", () => {
    for (const s of allStatuses) {
      it(`statusToLabel("${s}") returns string type`, () => {
        expect(typeof statusToLabel(s)).toBe("string");
      });
    }
    it('active label is "Active"', () => {
      expect(statusToLabel("active")).toBe("Active");
    });
    it('inactive label is "Inactive"', () => {
      expect(statusToLabel("inactive")).toBe("Inactive");
    });
    it('pending label is "Pending"', () => {
      expect(statusToLabel("pending")).toBe("Pending");
    });
    it('archived label is "Archived"', () => {
      expect(statusToLabel("archived")).toBe("Archived");
    });
  });

  describe("statusToIcon additional", () => {
    for (const s of allStatuses) {
      it(`statusToIcon("${s}") returns string type`, () => {
        expect(typeof statusToIcon(s)).toBe("string");
      });
    }
    it("active icon is ✅", () => {
      expect(statusToIcon("active")).toBe("✅");
    });
    it("inactive icon is ⭕", () => {
      expect(statusToIcon("inactive")).toBe("⭕");
    });
    it("pending icon is ⏳", () => {
      expect(statusToIcon("pending")).toBe("⏳");
    });
    it("archived icon is 📁", () => {
      expect(statusToIcon("archived")).toBe("📁");
    });
  });

  describe("complianceStatusToColor additional", () => {
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToColor("${s}") has length 7`, () => {
        expect(complianceStatusToColor(s).length).toBe(7);
      });
    }
    for (const s of allComplianceStatuses) {
      it(`complianceStatusToColor("${s}") type is string`, () => {
        expect(typeof complianceStatusToColor(s)).toBe("string");
      });
    }
    it("compliant and non-compliant have different colors", () => {
      expect(complianceStatusToColor("compliant")).not.toBe(
        complianceStatusToColor("non-compliant"),
      );
    });
  });
});

describe("canTransitionTo - comprehensive matrix", () => {
  const allStatuses: Array<"active" | "inactive" | "pending" | "archived"> = [
    "active",
    "inactive",
    "pending",
    "archived",
  ];
  const validMatrix: Array<{
    from: "active" | "inactive" | "pending" | "archived";
    to: "active" | "inactive" | "pending" | "archived";
    valid: boolean;
  }> = [
    { from: "active", to: "active", valid: false },
    { from: "active", to: "inactive", valid: true },
    { from: "active", to: "pending", valid: false },
    { from: "active", to: "archived", valid: true },
    { from: "inactive", to: "active", valid: true },
    { from: "inactive", to: "inactive", valid: false },
    { from: "inactive", to: "pending", valid: false },
    { from: "inactive", to: "archived", valid: true },
    { from: "pending", to: "active", valid: true },
    { from: "pending", to: "inactive", valid: true },
    { from: "pending", to: "pending", valid: false },
    { from: "pending", to: "archived", valid: true },
    { from: "archived", to: "active", valid: false },
    { from: "archived", to: "inactive", valid: false },
    { from: "archived", to: "pending", valid: false },
    { from: "archived", to: "archived", valid: false },
  ];
  for (const m of validMatrix) {
    it(`canTransitionTo("${m.from}", "${m.to}") = ${m.valid}`, () => {
      if (m.valid) {
        expect(canTransitionTo(m.from, m.to)).toBeTruthy();
      } else {
        expect(canTransitionTo(m.from, m.to)).toBeFalsy();
      }
    });
  }
});

describe("getStatusWeight - additional tests", () => {
  const weights = [
    { status: "active" as const, weight: 1 },
    { status: "pending" as const, weight: 2 },
    { status: "inactive" as const, weight: 3 },
    { status: "archived" as const, weight: 4 },
  ];
  for (const w of weights) {
    it(`getStatusWeight returns ${w.weight} for "${w.status}"`, () => {
      expect(getStatusWeight(w.status)).toBe(w.weight);
    });
    it(`getStatusWeight("${w.status}") is positive`, () => {
      expect(getStatusWeight(w.status)).toBeGreaterThan(0);
    });
    it(`getStatusWeight("${w.status}") returns number type`, () => {
      expect(typeof getStatusWeight(w.status)).toBe("number");
    });
  }
});
