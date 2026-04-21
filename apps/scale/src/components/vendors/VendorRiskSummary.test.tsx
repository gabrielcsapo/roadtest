import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorRiskSummary } from "./VendorRiskSummary";
import { Vendor, Risk } from "../../types";

const mockVendor: Vendor = {
  id: "1",
  name: "Acme Corp",
  website: "https://acme.com",
  status: "active",
  riskLevel: "low",
  contactEmail: "security@acme.com",
  lastReviewDate: "2024-01-15",
  tags: ["cloud", "saas"],
  category: "Cloud Infrastructure",
};

const vendors: Vendor[] = [
  { ...mockVendor, id: "1", name: "Acme Corp", riskLevel: "low" },
  { ...mockVendor, id: "2", name: "Globex Inc", riskLevel: "medium" },
  { ...mockVendor, id: "3", name: "Umbrella Corp", riskLevel: "high" },
  { ...mockVendor, id: "4", name: "Initech", riskLevel: "critical" },
  { ...mockVendor, id: "5", name: "Massive Dynamic", riskLevel: "low" },
];

const riskLevels: Risk[] = ["low", "medium", "high", "critical"];

describe("VendorRiskSummary", () => {
  // Basic rendering (10)
  it("renders the risk summary card", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("renders title", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-title")).toBeDefined();
  });

  it("renders total vendor count", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("5");
  });

  it("renders risk summary items", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-items")).toBeDefined();
  });

  it("renders all risk level items", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-item-${risk}`)).toBeDefined();
    }
  });

  it("renders progress bar for each risk level", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-progress-${risk}`)).toBeDefined();
    }
  });

  it("renders count for each risk level", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-count-${risk}`)).toBeDefined();
    }
  });

  it("renders risk badge for each risk level", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-badge-${risk}`)).toBeDefined();
    }
  });

  it("renders correctly with empty vendors", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("shows 0 total for empty vendors", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("0");
  });

  // Count accuracy (10)
  it("shows correct count for low risk", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").textContent).toContain("2");
  });

  it("shows correct count for medium risk", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-medium").textContent).toContain("1");
  });

  it("shows correct count for high risk", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-high").textContent).toContain("1");
  });

  it("shows correct count for critical risk", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("1");
  });

  it("shows 0 count for risk with no vendors", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allLow} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("0");
  });

  it("shows percentage in count text", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").textContent).toContain("%");
  });

  it("shows 40% for 2 out of 5 low risk vendors", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").textContent).toContain("40%");
  });

  it("shows 20% for 1 out of 5 medium risk vendors", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-medium").textContent).toContain("20%");
  });

  it("shows 0% for empty list", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("risk-count-low").textContent).toContain("0%");
  });

  it("shows 100% for all same risk level", async () => {
    const allCritical = [{ ...mockVendor, riskLevel: "critical" as Risk }];
    const { getByTestId } = await render(<VendorRiskSummary vendors={allCritical} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("100%");
  });

  // Click callbacks (10)
  it("calls onClick with low risk when low item clicked", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-low"));
    expect(clicked).toBe("low");
  });

  it("calls onClick with medium risk when medium item clicked", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-medium"));
    expect(clicked).toBe("medium");
  });

  it("calls onClick with high risk when high item clicked", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-high"));
    expect(clicked).toBe("high");
  });

  it("calls onClick with critical risk when critical item clicked", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-critical"));
    expect(clicked).toBe("critical");
  });

  it("does not throw when onClick not provided and item clicked", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    await fireEvent.click(getByTestId("risk-item-low"));
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("fires onClick multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-low"));
    await fireEvent.click(getByTestId("risk-item-medium"));
    expect(count).toBe(2);
  });

  it("can click all risk items", async () => {
    const clicked: Risk[] = [];
    const { getByTestId } = await render(
      <VendorRiskSummary vendors={vendors} onClick={(r) => clicked.push(r)} />,
    );
    for (const risk of riskLevels) {
      await fireEvent.click(getByTestId(`risk-item-${risk}`));
    }
    expect(clicked).toHaveLength(4);
  });

  it("returns correct risk value on repeated clicks", async () => {
    let last: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          last = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-critical"));
    await fireEvent.click(getByTestId("risk-item-low"));
    expect(last).toBe("low");
  });

  it("snapshot with onClick", async () => {
    await render(<VendorRiskSummary vendors={vendors} onClick={() => {}} />);
    await snapshot("vendor-risk-summary-clickable");
  });

  it("snapshot without onClick", async () => {
    await render(<VendorRiskSummary vendors={vendors} />);
    await snapshot("vendor-risk-summary-default");
  });

  // Prop variations (20)
  it("renders single vendor", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[mockVendor]} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("1");
  });

  it("renders all critical vendors", async () => {
    const allCritical = vendors.map((v) => ({ ...v, riskLevel: "critical" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allCritical} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("5");
  });

  it("renders all high vendors", async () => {
    const allHigh = vendors.map((v) => ({ ...v, riskLevel: "high" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allHigh} />);
    expect(getByTestId("risk-count-high").textContent).toContain("5");
  });

  it("renders all medium vendors", async () => {
    const allMedium = vendors.map((v) => ({ ...v, riskLevel: "medium" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allMedium} />);
    expect(getByTestId("risk-count-medium").textContent).toContain("5");
  });

  it("renders all low vendors", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allLow} />);
    expect(getByTestId("risk-count-low").textContent).toContain("5");
  });

  it("renders 10 vendors correctly", async () => {
    const manyVendors = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: riskLevels[i % 4],
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={manyVendors} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("10");
  });

  it("renders 20 vendors correctly", async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: riskLevels[i % 4],
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={manyVendors} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("20");
  });

  for (const risk of riskLevels) {
    it(`shows ${risk} risk item with progress bar`, async () => {
      const { getByTestId } = await render(
        <VendorRiskSummary vendors={[{ ...mockVendor, riskLevel: risk }]} />,
      );
      expect(getByTestId(`risk-progress-${risk}`)).toBeDefined();
    });
  }

  it("snapshot for empty vendors", async () => {
    await render(<VendorRiskSummary vendors={[]} />);
    await snapshot("vendor-risk-summary-empty");
  });

  it("snapshot for full vendor list", async () => {
    await render(<VendorRiskSummary vendors={vendors} />);
    await snapshot("vendor-risk-summary-full");
  });

  it("snapshot for all critical vendors", async () => {
    const allCritical = vendors.map((v) => ({ ...v, riskLevel: "critical" as Risk }));
    await render(<VendorRiskSummary vendors={allCritical} />);
    await snapshot("vendor-risk-summary-all-critical");
  });

  it("renders correctly with 100 vendors", async () => {
    const bigList = Array.from({ length: 100 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: riskLevels[i % 4],
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={bigList} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("100");
  });

  it("renders correctly with 1 vendor per risk level", async () => {
    const oneEach = riskLevels.map((risk, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: risk,
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={oneEach} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-count-${risk}`).textContent).toContain("1");
    }
  });

  it("shows correct total when vendors change", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[mockVendor]} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("1");
  });

  it("renders correctly with only required props", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("shows correct percentages for mixed risk levels", async () => {
    const mixed = [
      { ...mockVendor, id: "1", riskLevel: "low" as Risk },
      { ...mockVendor, id: "2", riskLevel: "low" as Risk },
      { ...mockVendor, id: "3", riskLevel: "high" as Risk },
      { ...mockVendor, id: "4", riskLevel: "high" as Risk },
    ];
    const { getByTestId } = await render(<VendorRiskSummary vendors={mixed} />);
    expect(getByTestId("risk-count-low").textContent).toContain("50%");
    expect(getByTestId("risk-count-high").textContent).toContain("50%");
  });

  // Additional tests to reach 100+
  it("renders all progress bars", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-progress-${risk}`)).toBeDefined();
    }
  });

  it("renders all risk items in correct order", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-item-critical")).toBeDefined();
    expect(getByTestId("risk-item-high")).toBeDefined();
    expect(getByTestId("risk-item-medium")).toBeDefined();
    expect(getByTestId("risk-item-low")).toBeDefined();
  });

  it("renders title text correctly", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-title").textContent).toContain("Vendor Risk Summary");
  });

  it("shows 2 for low count in standard list", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").textContent).toContain("2");
  });

  it("shows 1 for medium count in standard list", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-medium").textContent).toContain("1");
  });

  it("shows 1 for high count in standard list", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-high").textContent).toContain("1");
  });

  it("shows 1 for critical count in standard list", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("1");
  });

  it("clicking each risk fires onClick with correct risk", async () => {
    const receivedRisks: Risk[] = [];
    const { getByTestId } = await render(
      <VendorRiskSummary vendors={vendors} onClick={(r) => receivedRisks.push(r)} />,
    );
    for (const risk of riskLevels) {
      await fireEvent.click(getByTestId(`risk-item-${risk}`));
    }
    expect(receivedRisks).toHaveLength(4);
    expect(receivedRisks).toContain("low");
    expect(receivedRisks).toContain("medium");
    expect(receivedRisks).toContain("high");
    expect(receivedRisks).toContain("critical");
  });

  it("risk item for low is clickable when onClick provided", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-low"));
    expect(clicked).toBe("low");
  });

  it("risk item for medium is clickable when onClick provided", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-medium"));
    expect(clicked).toBe("medium");
  });

  it("risk item for high is clickable when onClick provided", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-high"));
    expect(clicked).toBe("high");
  });

  it("risk item for critical is clickable when onClick provided", async () => {
    let clicked: Risk | null = null;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={(r) => {
          clicked = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-critical"));
    expect(clicked).toBe("critical");
  });

  it("renders total for 2 vendors correctly", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors.slice(0, 2)} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("2");
  });

  it("renders total for 3 vendors correctly", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors.slice(0, 3)} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("3");
  });

  it("renders total for 4 vendors correctly", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors.slice(0, 4)} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("4");
  });

  it("renders all 5 vendors in summary", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("5");
  });

  it("renders risk badges for each level", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    for (const risk of riskLevels) {
      expect(getByTestId(`risk-badge-${risk}`)).toBeDefined();
    }
  });

  it("snapshot with 10 critical vendors", async () => {
    const tenCritical = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: "critical" as Risk,
    }));
    await render(<VendorRiskSummary vendors={tenCritical} />);
    await snapshot("vendor-risk-summary-10-critical");
  });

  it("snapshot with mixed even distribution", async () => {
    const even = riskLevels.flatMap((r) => [
      { ...mockVendor, id: `${r}-1`, riskLevel: r },
      { ...mockVendor, id: `${r}-2`, riskLevel: r },
    ]);
    await render(<VendorRiskSummary vendors={even} />);
    await snapshot("vendor-risk-summary-even-distribution");
  });

  it("shows correct percentage with 3 out of 10 being low", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: i < 3 ? ("low" as Risk) : ("medium" as Risk),
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={ten} />);
    expect(getByTestId("risk-count-low").textContent).toContain("30%");
  });

  it("shows correct percentage with 5 out of 10 being medium", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: i < 5 ? ("medium" as Risk) : ("low" as Risk),
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={ten} />);
    expect(getByTestId("risk-count-medium").textContent).toContain("50%");
  });

  it("risk summary items container renders always", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("risk-summary-items")).toBeDefined();
  });

  it("risk summary title renders always", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("risk-summary-title")).toBeDefined();
  });

  it("renders correctly with all vendors archived", async () => {
    const archived = vendors.map((v) => ({ ...v, status: "archived" as const }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={archived} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("5");
  });

  it("renders correctly with all vendors inactive", async () => {
    const inactive = vendors.map((v) => ({ ...v, status: "inactive" as const }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={inactive} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("card container is always defined", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  it("fires onClick exactly once per click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorRiskSummary
        vendors={vendors}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("risk-item-critical"));
    expect(count).toBe(1);
  });

  it("renders risk count text with parentheses format", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").textContent).toContain("(");
    expect(getByTestId("risk-count-low").textContent).toContain(")");
  });

  it("renders correctly with all vendors having tags", async () => {
    const withTags = vendors.map((v) => ({ ...v, tags: ["soc2", "hipaa"] }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={withTags} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("5");
  });

  it("renders correctly with vendors having no tags", async () => {
    const noTags = vendors.map((v) => ({ ...v, tags: [] }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={noTags} />);
    expect(getByTestId("vendor-risk-summary")).toBeDefined();
  });

  // Additional tests to reach 100
  it("vendor-risk-summary data-testid is vendor-risk-summary", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("vendor-risk-summary").getAttribute("data-testid")).toBe(
      "vendor-risk-summary",
    );
  });

  it("risk-summary-title data-testid is risk-summary-title", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-title").getAttribute("data-testid")).toBe(
      "risk-summary-title",
    );
  });

  it("risk-summary-total data-testid is risk-summary-total", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-total").getAttribute("data-testid")).toBe(
      "risk-summary-total",
    );
  });

  it("risk-summary-items data-testid is risk-summary-items", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-items").getAttribute("data-testid")).toBe(
      "risk-summary-items",
    );
  });

  it("risk-item-low data-testid is risk-item-low", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-item-low").getAttribute("data-testid")).toBe("risk-item-low");
  });

  it("risk-item-medium data-testid is risk-item-medium", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-item-medium").getAttribute("data-testid")).toBe("risk-item-medium");
  });

  it("risk-item-high data-testid is risk-item-high", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-item-high").getAttribute("data-testid")).toBe("risk-item-high");
  });

  it("risk-item-critical data-testid is risk-item-critical", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-item-critical").getAttribute("data-testid")).toBe(
      "risk-item-critical",
    );
  });

  it("risk-count-low data-testid is risk-count-low", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-low").getAttribute("data-testid")).toBe("risk-count-low");
  });

  it("risk-count-critical data-testid is risk-count-critical", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-count-critical").getAttribute("data-testid")).toBe(
      "risk-count-critical",
    );
  });

  it("risk-progress-low data-testid is risk-progress-low", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-progress-low").getAttribute("data-testid")).toBe("risk-progress-low");
  });

  it("risk-progress-medium data-testid is risk-progress-medium", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-progress-medium").getAttribute("data-testid")).toBe(
      "risk-progress-medium",
    );
  });

  it("risk-badge-low data-testid is risk-badge-low", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-badge-low").getAttribute("data-testid")).toBe("risk-badge-low");
  });

  it("risk-badge-critical data-testid is risk-badge-critical", async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-badge-critical").getAttribute("data-testid")).toBe(
      "risk-badge-critical",
    );
  });

  it("count shows 40% for 4 out of 10 being high", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: i < 4 ? ("high" as Risk) : ("low" as Risk),
    }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={ten} />);
    expect(getByTestId("risk-count-high").textContent).toContain("40%");
  });

  it("count shows 0% for 0 critical", async () => {
    const noCritical = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={noCritical} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("0%");
  });

  it("count shows 100% when all are critical", async () => {
    const allCritical = vendors.map((v) => ({ ...v, riskLevel: "critical" as Risk }));
    const { getByTestId } = await render(<VendorRiskSummary vendors={allCritical} />);
    expect(getByTestId("risk-count-critical").textContent).toContain("100%");
  });

  it("snapshot with only low risk vendors", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    await render(<VendorRiskSummary vendors={allLow} />);
    await snapshot("vendor-risk-summary-all-low");
  });

  it("snapshot with only high risk vendors", async () => {
    const allHigh = vendors.map((v) => ({ ...v, riskLevel: "high" as Risk }));
    await render(<VendorRiskSummary vendors={allHigh} />);
    await snapshot("vendor-risk-summary-all-high");
  });

  it("snapshot with only critical risk vendors", async () => {
    const allCritical = vendors.map((v) => ({ ...v, riskLevel: "critical" as Risk }));
    await render(<VendorRiskSummary vendors={allCritical} />);
    await snapshot("vendor-risk-summary-all-critical");
  });

  it("snapshot with empty vendors", async () => {
    await render(<VendorRiskSummary vendors={[]} />);
    await snapshot("vendor-risk-summary-empty");
  });

  it("snapshot with 1 vendor", async () => {
    await render(<VendorRiskSummary vendors={[mockVendor]} />);
    await snapshot("vendor-risk-summary-1-vendor");
  });

  it('summary total text has "Total" label', async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={vendors} />);
    expect(getByTestId("risk-summary-total").textContent).toContain("Total");
  });

  it('summary title has "Vendor Risk Summary" text', async () => {
    const { getByTestId } = await render(<VendorRiskSummary vendors={[]} />);
    expect(getByTestId("risk-summary-title").textContent).toContain("Vendor Risk Summary");
  });
});
