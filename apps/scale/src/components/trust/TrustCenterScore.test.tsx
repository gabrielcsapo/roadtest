import { describe, it, expect, render, snapshot } from "@fieldtest/core";
import { TrustCenterScore } from "./TrustCenterScore";
import { Control, User, ComplianceStatus, Framework } from "../../types";

const mockOwner: User = { id: "u1", name: "Alice", email: "alice@example.com", role: "admin" };

const mockControl: Control = {
  id: "ctrl1",
  name: "Access Control Review",
  description: "Quarterly review",
  framework: "SOC2",
  status: "compliant",
  evidence: [],
  owner: mockOwner,
};

const controls: Control[] = [
  { ...mockControl, id: "c1", framework: "SOC2", status: "compliant" },
  { ...mockControl, id: "c2", framework: "ISO27001", status: "in-progress" },
  { ...mockControl, id: "c3", framework: "HIPAA", status: "non-compliant" },
  { ...mockControl, id: "c4", framework: "GDPR", status: "not-applicable" },
  { ...mockControl, id: "c5", framework: "PCI-DSS", status: "compliant", evidence: [] },
];

const allFrameworks: Framework[] = ["SOC2", "ISO27001", "HIPAA", "GDPR", "PCI-DSS", "FedRAMP"];
const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];

describe("TrustCenterScore", () => {
  // Loading state
  it("shows loading spinner when loading", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={[]} loading />);
    expect(getByTestId("trust-score-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} loading />);
    expect(getByTestId("trust-score-spinner")).toBeDefined();
  });

  it("does not show container when loading", async () => {
    const { queryByTestId } = await render(<TrustCenterScore controls={controls} loading />);
    expect(queryByTestId("trust-score-container")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(queryByTestId("trust-score-loading")).toBeNull();
  });

  // Empty state
  it("shows empty state when no controls", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={[]} />);
    expect(getByTestId("trust-score-empty")).toBeDefined();
  });

  it("does not show container when empty", async () => {
    const { queryByTestId } = await render(<TrustCenterScore controls={[]} />);
    expect(queryByTestId("trust-score-container")).toBeNull();
  });

  // Score calculation: 2 out of 5 are compliant = 40%
  it("renders container with controls", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-container")).toBeDefined();
  });

  it("shows correct score value", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-value").textContent).toBe("40");
  });

  it("shows score in data attribute", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-container").getAttribute("data-score")).toBe("40");
  });

  it("shows score circle", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-circle")).toBeDefined();
  });

  it("shows score label", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-label")).toBeDefined();
  });

  it("shows summary section", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(getByTestId("trust-score-summary")).toBeDefined();
  });

  // Score range tests (0-100)
  Array.from({ length: 11 }, (_, i) => i * 10).map((pct) =>
    it(`shows score ${pct} correctly`, async () => {
      const total = 10;
      const compliant = Math.round((pct / 100) * total);
      const nonCompliant = total - compliant;
      const testControls = [
        ...Array.from({ length: compliant }, (_, i) => ({
          ...mockControl,
          id: `comp${i}`,
          status: "compliant" as ComplianceStatus,
        })),
        ...Array.from({ length: nonCompliant }, (_, i) => ({
          ...mockControl,
          id: `nc${i}`,
          status: "non-compliant" as ComplianceStatus,
        })),
      ];
      const { getByTestId } = await render(<TrustCenterScore controls={testControls} />);
      expect(getByTestId("trust-score-value").textContent).toBe(String(pct));
    }),
  );

  // Score label thresholds
  it("shows Good label for score >= 80", async () => {
    const allCompliant = controls.map((c) => ({ ...c, status: "compliant" as ComplianceStatus }));
    const { getByTestId } = await render(<TrustCenterScore controls={allCompliant} />);
    expect(getByTestId("trust-score-label").textContent).toContain("Good");
  });

  it("shows Needs Attention label for score < 60", async () => {
    const allNonCompliant = controls.map((c) => ({
      ...c,
      status: "non-compliant" as ComplianceStatus,
    }));
    const { getByTestId } = await render(<TrustCenterScore controls={allNonCompliant} />);
    expect(getByTestId("trust-score-label").textContent).toContain("Needs Attention");
  });

  it("shows Fair label for score >= 60 and < 80", async () => {
    const mixed = [
      ...Array.from({ length: 6 }, (_, i) => ({
        ...mockControl,
        id: `c${i}`,
        status: "compliant" as ComplianceStatus,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        ...mockControl,
        id: `n${i}`,
        status: "non-compliant" as ComplianceStatus,
      })),
    ];
    const { getByTestId } = await render(<TrustCenterScore controls={mixed} />);
    expect(getByTestId("trust-score-label").textContent).toContain("Fair");
  });

  // Per-framework filter
  allFrameworks.map((fw) =>
    it(`filters controls for framework ${fw}`, async () => {
      const fwControls = [
        ...controls,
        { ...mockControl, id: "extra", framework: fw, status: "compliant" as ComplianceStatus },
      ];
      const { getByTestId } = await render(
        <TrustCenterScore controls={fwControls} framework={fw} />,
      );
      expect(getByTestId("trust-score-container")).toBeDefined();
    }),
  );

  it("shows framework label when framework prop is set", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} framework="SOC2" />);
    expect(getByTestId("trust-score-framework-label").textContent).toContain("SOC2");
  });

  it("does not show framework label when no framework prop", async () => {
    const { queryByTestId } = await render(<TrustCenterScore controls={controls} />);
    expect(queryByTestId("trust-score-framework-label")).toBeNull();
  });

  it("shows 100% for SOC2 when all SOC2 controls are compliant", async () => {
    const soc2Controls = [
      {
        ...mockControl,
        id: "s1",
        framework: "SOC2" as Framework,
        status: "compliant" as ComplianceStatus,
      },
      {
        ...mockControl,
        id: "s2",
        framework: "SOC2" as Framework,
        status: "compliant" as ComplianceStatus,
      },
    ];
    const { getByTestId } = await render(
      <TrustCenterScore controls={soc2Controls} framework="SOC2" />,
    );
    expect(getByTestId("trust-score-value").textContent).toBe("100");
  });

  it("shows 0% when framework filter matches no compliant controls", async () => {
    const hipaaControls = [
      {
        ...mockControl,
        id: "h1",
        framework: "HIPAA" as Framework,
        status: "non-compliant" as ComplianceStatus,
      },
    ];
    const { getByTestId } = await render(
      <TrustCenterScore controls={hipaaControls} framework="HIPAA" />,
    );
    expect(getByTestId("trust-score-value").textContent).toBe("0");
  });

  // Breakdown
  it("does not show breakdown when showBreakdown is false", async () => {
    const { queryByTestId } = await render(
      <TrustCenterScore controls={controls} showBreakdown={false} />,
    );
    expect(queryByTestId("trust-score-breakdown")).toBeNull();
  });

  it("shows breakdown when showBreakdown is true", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} showBreakdown />);
    expect(getByTestId("trust-score-breakdown")).toBeDefined();
  });

  it("shows breakdown items for each represented framework", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} showBreakdown />);
    expect(getByTestId("breakdown-SOC2")).toBeDefined();
    expect(getByTestId("breakdown-ISO27001")).toBeDefined();
    expect(getByTestId("breakdown-HIPAA")).toBeDefined();
  });

  it("shows score percentage in breakdown for SOC2", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} showBreakdown />);
    expect(getByTestId("breakdown-score-SOC2").textContent).toContain("100");
  });

  it("shows progress bar in breakdown", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} showBreakdown />);
    expect(getByTestId("breakdown-progress-SOC2")).toBeDefined();
  });

  // All-compliant scenario
  it("shows 100% when all controls are compliant", async () => {
    const allCompliant = controls.map((c) => ({ ...c, status: "compliant" as ComplianceStatus }));
    const { getByTestId } = await render(<TrustCenterScore controls={allCompliant} />);
    expect(getByTestId("trust-score-value").textContent).toBe("100");
  });

  // All-non-compliant scenario
  it("shows 0% when all controls are non-compliant", async () => {
    const allNonCompliant = controls.map((c) => ({
      ...c,
      status: "non-compliant" as ComplianceStatus,
    }));
    const { getByTestId } = await render(<TrustCenterScore controls={allNonCompliant} />);
    expect(getByTestId("trust-score-value").textContent).toBe("0");
  });

  it("shows 0% when all controls are in-progress", async () => {
    const allInProgress = controls.map((c) => ({
      ...c,
      status: "in-progress" as ComplianceStatus,
    }));
    const { getByTestId } = await render(<TrustCenterScore controls={allInProgress} />);
    expect(getByTestId("trust-score-value").textContent).toBe("0");
  });

  // Snapshots
  it("matches snapshot with all controls", async () => {
    const { container } = await render(<TrustCenterScore controls={controls} />);
    await snapshot("trust-score-full");
  });

  it("matches snapshot with breakdown", async () => {
    const { container } = await render(<TrustCenterScore controls={controls} showBreakdown />);
    await snapshot("trust-score-breakdown");
  });

  it("matches snapshot for empty state", async () => {
    const { container } = await render(<TrustCenterScore controls={[]} />);
    await snapshot("trust-score-empty");
  });

  it("matches snapshot for loading state", async () => {
    const { container } = await render(<TrustCenterScore controls={[]} loading />);
    await snapshot("trust-score-loading");
  });

  it("renders summary with correct counts", async () => {
    const { getByTestId } = await render(<TrustCenterScore controls={controls} />);
    const summary = getByTestId("trust-score-summary");
    expect(summary.textContent).toContain("2");
    expect(summary.textContent).toContain("5");
  });

  it("handles single compliant control", async () => {
    const { getByTestId } = await render(
      <TrustCenterScore controls={[{ ...mockControl, status: "compliant" }]} />,
    );
    expect(getByTestId("trust-score-value").textContent).toBe("100");
  });

  it("handles single non-compliant control", async () => {
    const { getByTestId } = await render(
      <TrustCenterScore controls={[{ ...mockControl, status: "non-compliant" }]} />,
    );
    expect(getByTestId("trust-score-value").textContent).toBe("0");
  });
});
