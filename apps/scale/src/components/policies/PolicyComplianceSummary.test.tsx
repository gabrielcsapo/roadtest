import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { PolicyComplianceSummary } from "./PolicyComplianceSummary";
import { Policy, User, ComplianceStatus } from "../../types";

const mockOwner: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
};
const mockPolicy: Policy = {
  id: "pol1",
  title: "Acceptable Use Policy",
  description: "Guidelines for acceptable use...",
  status: "compliant",
  owner: mockOwner,
  lastUpdated: "2024-01-15",
  version: "2.1",
  acceptanceRate: 94,
  frameworks: ["SOC2", "ISO27001"],
};

const policies: Policy[] = [
  { ...mockPolicy, id: "p1", title: "Acceptable Use Policy", status: "compliant" },
  { ...mockPolicy, id: "p2", title: "Password Policy", status: "in-progress" },
  { ...mockPolicy, id: "p3", title: "Data Retention Policy", status: "non-compliant" },
  { ...mockPolicy, id: "p4", title: "Incident Response Plan", status: "not-applicable" },
  { ...mockPolicy, id: "p5", title: "Vendor Management Policy", status: "compliant" },
];

const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];

describe("PolicyComplianceSummary", () => {
  // Loading state
  it("shows loading spinner when loading is true", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={[]} loading />);
    expect(getByTestId("compliance-summary-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={[]} loading />);
    expect(getByTestId("compliance-summary-spinner")).toBeDefined();
  });

  it("does not show container when loading", async () => {
    const { queryByTestId } = await render(<PolicyComplianceSummary policies={policies} loading />);
    expect(queryByTestId("compliance-summary-container")).toBeNull();
  });

  it("hides loading state when loading is false", async () => {
    const { queryByTestId } = await render(
      <PolicyComplianceSummary policies={policies} loading={false} />,
    );
    expect(queryByTestId("compliance-summary-loading")).toBeNull();
  });

  // Empty state
  it("shows empty state when policies array is empty", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={[]} />);
    expect(getByTestId("compliance-summary-empty")).toBeDefined();
  });

  it("does not show container when empty", async () => {
    const { queryByTestId } = await render(<PolicyComplianceSummary policies={[]} />);
    expect(queryByTestId("compliance-summary-container")).toBeNull();
  });

  // Normal rendering
  it("renders summary container", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("compliance-summary-container")).toBeDefined();
  });

  it("renders summary title", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("compliance-summary-title").textContent).toContain("Compliance Summary");
  });

  it("renders summary grid", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("compliance-summary-grid")).toBeDefined();
  });

  it("shows total count", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("compliance-summary-total").textContent).toContain("5");
  });

  // Status cards - all 4 statuses
  allStatuses.map((status) =>
    it(`renders status card for ${status}`, async () => {
      const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
      expect(getByTestId(`status-card-${status}`)).toBeDefined();
    }),
  );

  // Status labels
  allStatuses.map((status) =>
    it(`renders label for status ${status}`, async () => {
      const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
      expect(getByTestId(`status-label-${status}`)).toBeDefined();
    }),
  );

  // Status counts
  it("shows correct count for compliant policies", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("status-count-compliant").textContent).toBe("2");
  });

  it("shows correct count for non-compliant policies", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("status-count-non-compliant").textContent).toBe("1");
  });

  it("shows correct count for in-progress policies", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("status-count-in-progress").textContent).toBe("1");
  });

  it("shows correct count for not-applicable policies", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("status-count-not-applicable").textContent).toBe("1");
  });

  // Zero counts
  it("shows 0 for a status with no policies", async () => {
    const singlePolicy = [{ ...mockPolicy, id: "x1", status: "compliant" as ComplianceStatus }];
    const { getByTestId } = await render(<PolicyComplianceSummary policies={singlePolicy} />);
    expect(getByTestId("status-count-non-compliant").textContent).toBe("0");
  });

  // Percentage display
  allStatuses.map((status) =>
    it(`renders percentage for status ${status}`, async () => {
      const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
      expect(getByTestId(`status-percentage-${status}`)).toBeDefined();
    }),
  );

  it("shows 40% for compliant when 2 out of 5 policies are compliant", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    expect(getByTestId("status-percentage-compliant").textContent).toContain("40");
  });

  it("shows 100% for compliant when all policies are compliant", async () => {
    const allCompliant = policies.map((p) => ({ ...p, status: "compliant" as ComplianceStatus }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={allCompliant} />);
    expect(getByTestId("status-percentage-compliant").textContent).toContain("100");
  });

  it("shows 0% for non-compliant when none are non-compliant", async () => {
    const allCompliant = policies.map((p) => ({ ...p, status: "compliant" as ComplianceStatus }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={allCompliant} />);
    expect(getByTestId("status-percentage-non-compliant").textContent).toContain("0");
  });

  // Click handlers
  allStatuses.map((status) =>
    it(`calls onFilterByStatus with ${status} when that card is clicked`, async () => {
      let clicked: ComplianceStatus | null = null;
      const { getByTestId } = await render(
        <PolicyComplianceSummary
          policies={policies}
          onFilterByStatus={(s) => {
            clicked = s;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`status-card-${status}`));
      expect(clicked).toBe(status);
    }),
  );

  it("does not crash when no onFilterByStatus and card is clicked", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    await fireEvent.click(getByTestId("status-card-compliant"));
    expect(getByTestId("compliance-summary-container")).toBeDefined();
  });

  // Various data distributions
  it("handles all policies being non-compliant", async () => {
    const allNonCompliant = policies.map((p) => ({
      ...p,
      status: "non-compliant" as ComplianceStatus,
    }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={allNonCompliant} />);
    expect(getByTestId("status-count-non-compliant").textContent).toBe("5");
    expect(getByTestId("status-count-compliant").textContent).toBe("0");
  });

  it("handles single policy", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={[policies[0]]} />);
    expect(getByTestId("status-count-compliant").textContent).toBe("1");
  });

  it("handles 10 policies", async () => {
    const tenPolicies = Array.from({ length: 10 }, (_, i) => ({
      ...mockPolicy,
      id: `p${i}`,
      status: (i % 2 === 0 ? "compliant" : "non-compliant") as ComplianceStatus,
    }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={tenPolicies} />);
    expect(getByTestId("compliance-summary-total").textContent).toContain("10");
  });

  it("handles mixed distribution evenly", async () => {
    const evenPolicies = allStatuses.map((status, i) => ({ ...mockPolicy, id: `e${i}`, status }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={evenPolicies} />);
    allStatuses.forEach((status) => {
      expect(getByTestId(`status-count-${status}`).textContent).toBe("1");
    });
  });

  // Snapshots
  it("matches snapshot with full policy list", async () => {
    const { container } = await render(<PolicyComplianceSummary policies={policies} />);
    await snapshot("compliance-summary-full");
  });

  it("matches snapshot with empty state", async () => {
    const { container } = await render(<PolicyComplianceSummary policies={[]} />);
    await snapshot("compliance-summary-empty");
  });

  it("matches snapshot with loading state", async () => {
    const { container } = await render(<PolicyComplianceSummary policies={[]} loading />);
    await snapshot("compliance-summary-loading");
  });

  it("shows cursor pointer on cards when handler provided", async () => {
    const { getByTestId } = await render(
      <PolicyComplianceSummary policies={policies} onFilterByStatus={() => {}} />,
    );
    const card = getByTestId("status-card-compliant");
    expect(card.style.cursor).toBe("pointer");
  });

  it("shows default cursor when no handler provided", async () => {
    const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
    const card = getByTestId("status-card-compliant");
    expect(card.style.cursor).toBe("default");
  });

  // Large dataset
  it("handles 100 policies correctly", async () => {
    const hundredPolicies = Array.from({ length: 100 }, (_, i) => ({
      ...mockPolicy,
      id: `p${i}`,
      status: allStatuses[i % 4],
    }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={hundredPolicies} />);
    expect(getByTestId("compliance-summary-total").textContent).toContain("100");
  });

  it("counts all-in-progress correctly", async () => {
    const allInProgress = policies.map((p) => ({
      ...p,
      status: "in-progress" as ComplianceStatus,
    }));
    const { getByTestId } = await render(<PolicyComplianceSummary policies={allInProgress} />);
    expect(getByTestId("status-count-in-progress").textContent).toBe("5");
  });

  // Parameterized: click each status card and verify correct status is passed
  allStatuses.map((status) =>
    it(`clicking ${status} card passes the right status`, async () => {
      let received: ComplianceStatus | null = null;
      const { getByTestId } = await render(
        <PolicyComplianceSummary
          policies={policies}
          onFilterByStatus={(s) => {
            received = s;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`status-card-${status}`));
      expect(received).toBe(status);
    }),
  );

  // Parameterized: verify each status percentage element exists
  allStatuses.map((status) =>
    it(`percentage element is visible for ${status}`, async () => {
      const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
      const pct = getByTestId(`status-percentage-${status}`);
      expect(pct).toBeDefined();
      expect(pct.textContent).toContain("%");
    }),
  );

  // Parameterized: status cards with all-zero counts
  allStatuses.map((status) =>
    it(`status card ${status} shows 0 when no policies have that status`, async () => {
      const allCompliant = policies.map((p) => ({ ...p, status: "compliant" as ComplianceStatus }));
      const { getByTestId } = await render(<PolicyComplianceSummary policies={allCompliant} />);
      if (status !== "compliant") {
        expect(getByTestId(`status-count-${status}`).textContent).toBe("0");
      }
    }),
  );

  // Distribution: 1 policy per status
  allStatuses.map((status) =>
    it(`shows 1 count for ${status} with even distribution`, async () => {
      const evenPolicies = allStatuses.map((s, i) => ({ ...mockPolicy, id: `ep${i}`, status: s }));
      const { getByTestId } = await render(<PolicyComplianceSummary policies={evenPolicies} />);
      expect(getByTestId(`status-count-${status}`).textContent).toBe("1");
    }),
  );

  // Parameterized: verify cards are clickable (have cursor pointer) when handler provided
  allStatuses.map((status) =>
    it(`${status} card has pointer cursor when handler is provided`, async () => {
      const { getByTestId } = await render(
        <PolicyComplianceSummary policies={policies} onFilterByStatus={() => {}} />,
      );
      expect(getByTestId(`status-card-${status}`).style.cursor).toBe("pointer");
    }),
  );

  // Parameterized: verify cards have default cursor when no handler
  allStatuses.map((status) =>
    it(`${status} card has default cursor when no handler`, async () => {
      const { getByTestId } = await render(<PolicyComplianceSummary policies={policies} />);
      expect(getByTestId(`status-card-${status}`).style.cursor).toBe("default");
    }),
  );
});
