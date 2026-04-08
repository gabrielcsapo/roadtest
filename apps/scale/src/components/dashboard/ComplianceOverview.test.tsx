import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { ComplianceOverview } from "./ComplianceOverview";

const defaultSummary = {
  vendors: {
    total: 42,
    byRisk: { low: 20, medium: 15, high: 5, critical: 2 },
  },
  personnel: {
    total: 150,
    offboarding: 3,
    pendingBgCheck: 7,
  },
  credentials: {
    total: 89,
    expiringSoon: 5,
    expired: 2,
  },
  policies: {
    total: 25,
    byStatus: { compliant: 18, "non-compliant": 3, "in-progress": 4, "not-applicable": 0 },
  },
  issues: {
    total: 12,
    bySeverity: { low: 3, medium: 5, high: 3, critical: 1 },
  },
};

const cleanSummary = {
  vendors: { total: 10, byRisk: { low: 10, medium: 0, high: 0, critical: 0 } },
  personnel: { total: 50, offboarding: 0, pendingBgCheck: 0 },
  credentials: { total: 20, expiringSoon: 0, expired: 0 },
  policies: {
    total: 10,
    byStatus: { compliant: 10, "non-compliant": 0, "in-progress": 0, "not-applicable": 0 },
  },
  issues: { total: 0, bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } },
};

const emptySummary = {
  vendors: { total: 0, byRisk: { low: 0, medium: 0, high: 0, critical: 0 } },
  personnel: { total: 0, offboarding: 0, pendingBgCheck: 0 },
  credentials: { total: 0, expiringSoon: 0, expired: 0 },
  policies: {
    total: 0,
    byStatus: { compliant: 0, "non-compliant": 0, "in-progress": 0, "not-applicable": 0 },
  },
  issues: { total: 0, bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } },
};

describe("ComplianceOverview", () => {
  // Loading state
  it("shows loading spinner when loading is true", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} loading />);
    expect(getByTestId("compliance-overview-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} loading />);
    expect(getByTestId("overview-spinner")).toBeDefined();
  });

  it("does not show container when loading", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={defaultSummary} loading />);
    expect(queryByTestId("compliance-overview-container")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(queryByTestId("compliance-overview-loading")).toBeNull();
  });

  // Main container
  it("renders main container", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("compliance-overview-container")).toBeDefined();
  });

  // Vendors section
  it("renders vendors card", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("vendors-card")).toBeDefined();
  });

  it("shows vendors total", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("vendors-total").textContent).toContain("42");
  });

  it("shows vendors section", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("vendors-section")).toBeDefined();
  });

  it("shows critical risk vendor badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("vendors-risk-critical")).toBeDefined();
  });

  it("shows high risk vendor badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("vendors-risk-high")).toBeDefined();
  });

  // Personnel section
  it("renders personnel card", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("personnel-card")).toBeDefined();
  });

  it("shows personnel total", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("personnel-total").textContent).toContain("150");
  });

  it("shows offboarding count when > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("personnel-offboarding")).toBeDefined();
  });

  it("shows pending bg check count when > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("personnel-pending-bg")).toBeDefined();
  });

  it("does not show offboarding when count is 0", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={cleanSummary} />);
    expect(queryByTestId("personnel-offboarding")).toBeNull();
  });

  it("does not show pending bg check when count is 0", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={cleanSummary} />);
    expect(queryByTestId("personnel-pending-bg")).toBeNull();
  });

  // Credentials section
  it("renders credentials card", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("credentials-card")).toBeDefined();
  });

  it("shows credentials total", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("credentials-total").textContent).toContain("89");
  });

  it("shows expired count when > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("credentials-expired")).toBeDefined();
  });

  it("shows expiring soon count when > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("credentials-expiring-soon")).toBeDefined();
  });

  it("does not show expired when count is 0", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={cleanSummary} />);
    expect(queryByTestId("credentials-expired")).toBeNull();
  });

  it("does not show expiring soon when count is 0", async () => {
    const { queryByTestId } = await render(<ComplianceOverview summary={cleanSummary} />);
    expect(queryByTestId("credentials-expiring-soon")).toBeNull();
  });

  // Policies section
  it("renders policies card", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("policies-card")).toBeDefined();
  });

  it("shows policies total", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("policies-total").textContent).toContain("25");
  });

  it("shows compliant policy badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("policies-status-compliant")).toBeDefined();
  });

  it("shows non-compliant policy badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("policies-status-non-compliant")).toBeDefined();
  });

  // Issues section
  it("renders issues card", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("issues-card")).toBeDefined();
  });

  it("shows issues total", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("issues-total").textContent).toContain("12");
  });

  it("shows critical issues badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("issues-severity-critical")).toBeDefined();
  });

  it("shows high issues badge when count > 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("issues-severity-high")).toBeDefined();
  });

  it("issues section renders", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("issues-section")).toBeDefined();
  });

  // Click handlers
  it("calls onVendorsClick when vendors card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ComplianceOverview
        summary={defaultSummary}
        onVendorsClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendors-card"));
    expect(clicked).toBeTruthy();
  });

  it("calls onPersonnelClick when personnel card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ComplianceOverview
        summary={defaultSummary}
        onPersonnelClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("personnel-card"));
    expect(clicked).toBeTruthy();
  });

  it("calls onCredentialsClick when credentials card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ComplianceOverview
        summary={defaultSummary}
        onCredentialsClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("credentials-card"));
    expect(clicked).toBeTruthy();
  });

  it("calls onPoliciesClick when policies card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ComplianceOverview
        summary={defaultSummary}
        onPoliciesClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("policies-card"));
    expect(clicked).toBeTruthy();
  });

  it("calls onIssuesClick when issues card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ComplianceOverview
        summary={defaultSummary}
        onIssuesClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("issues-card"));
    expect(clicked).toBeTruthy();
  });

  // Empty state variations
  it("renders with all zero counts", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={emptySummary} />);
    expect(getByTestId("compliance-overview-container")).toBeDefined();
  });

  it("shows 0 vendors when total is 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={emptySummary} />);
    expect(getByTestId("vendors-total").textContent).toContain("0");
  });

  it("shows 0 issues when total is 0", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={emptySummary} />);
    expect(getByTestId("issues-total").textContent).toContain("0");
  });

  // Parameterized count variations
  ([0, 1, 5, 10, 100, 999] as number[]).map((total) =>
    it(`shows vendors total of ${total}`, async () => {
      const summary = { ...defaultSummary, vendors: { ...defaultSummary.vendors, total } };
      const { getByTestId } = await render(<ComplianceOverview summary={summary} />);
      expect(getByTestId("vendors-total").textContent).toContain(String(total));
    }),
  );

  ([0, 1, 5, 10, 100] as number[]).map((total) =>
    it(`shows issues total of ${total}`, async () => {
      const summary = { ...defaultSummary, issues: { ...defaultSummary.issues, total } };
      const { getByTestId } = await render(<ComplianceOverview summary={summary} />);
      expect(getByTestId("issues-total").textContent).toContain(String(total));
    }),
  );

  // Snapshots
  it("matches snapshot with default summary", async () => {
    const { container } = await render(<ComplianceOverview summary={defaultSummary} />);
    await snapshot("compliance-overview-default");
  });

  it("matches snapshot with clean summary", async () => {
    const { container } = await render(<ComplianceOverview summary={cleanSummary} />);
    await snapshot("compliance-overview-clean");
  });

  it("matches snapshot with loading state", async () => {
    const { container } = await render(<ComplianceOverview summary={defaultSummary} loading />);
    await snapshot("compliance-overview-loading");
  });

  it("does not crash when click handlers are not provided", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    await fireEvent.click(getByTestId("vendors-card"));
    expect(getByTestId("compliance-overview-container")).toBeDefined();
  });

  it("personnel section is defined", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("personnel-section")).toBeDefined();
  });

  it("credentials section is defined", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("credentials-section")).toBeDefined();
  });

  it("policies section is defined", async () => {
    const { getByTestId } = await render(<ComplianceOverview summary={defaultSummary} />);
    expect(getByTestId("policies-section")).toBeDefined();
  });
});
