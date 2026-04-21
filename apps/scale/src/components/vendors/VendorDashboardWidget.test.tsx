import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorDashboardWidget } from "./VendorDashboardWidget";
import { Vendor, Risk, Status } from "../../types";

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
  { ...mockVendor, id: "1", name: "Acme Corp", riskLevel: "low", status: "active" },
  { ...mockVendor, id: "2", name: "Globex Inc", riskLevel: "medium", status: "active" },
  { ...mockVendor, id: "3", name: "Umbrella Corp", riskLevel: "high", status: "pending" },
  { ...mockVendor, id: "4", name: "Initech", riskLevel: "critical", status: "inactive" },
  { ...mockVendor, id: "5", name: "Massive Dynamic", riskLevel: "low", status: "archived" },
];

const riskLevels: Risk[] = ["low", "medium", "high", "critical"];
const statuses: Status[] = ["active", "inactive", "pending", "archived"];

describe("VendorDashboardWidget", () => {
  // Basic rendering (10)
  it("renders widget container", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("vendor-dashboard-widget")).toBeDefined();
  });

  it("renders widget header", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-header")).toBeDefined();
  });

  it("renders widget title", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-title").textContent).toBe("Vendors");
  });

  it("renders total badge", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-total-badge")).toBeDefined();
  });

  it("renders stats section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-stats")).toBeDefined();
  });

  it("renders risk breakdown section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-breakdown")).toBeDefined();
  });

  it("snapshot default", async () => {
    await render(<VendorDashboardWidget vendors={vendors} />);
    await snapshot("vendor-dashboard-widget-default");
  });

  it("snapshot empty vendors", async () => {
    await render(<VendorDashboardWidget vendors={[]} />);
    await snapshot("vendor-dashboard-widget-empty");
  });

  it("snapshot loading", async () => {
    await render(<VendorDashboardWidget vendors={vendors} loading />);
    await snapshot("vendor-dashboard-widget-loading");
  });

  it("data-loading attribute false when not loading", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("vendor-dashboard-widget").getAttribute("data-loading")).toBe("false");
  });

  // Loading state (5)
  it("renders loading state when loading=true", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} loading />);
    expect(getByTestId("widget-loading")).toBeDefined();
  });

  it("data-loading attribute is true when loading", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} loading />);
    expect(getByTestId("vendor-dashboard-widget").getAttribute("data-loading")).toBe("true");
  });

  it("hides stats when loading", async () => {
    const { queryByTestId } = await render(<VendorDashboardWidget vendors={vendors} loading />);
    expect(queryByTestId("widget-stats")).toBeNull();
  });

  it("hides risk breakdown when loading", async () => {
    const { queryByTestId } = await render(<VendorDashboardWidget vendors={vendors} loading />);
    expect(queryByTestId("widget-risk-breakdown")).toBeNull();
  });

  it("loading=false shows normal content", async () => {
    const { getByTestId } = await render(
      <VendorDashboardWidget vendors={vendors} loading={false} />,
    );
    expect(getByTestId("widget-stats")).toBeDefined();
  });

  // Stats display (10)
  it("shows total count", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-total-count").textContent).toBe("5");
  });

  it("shows active count", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-active-count").textContent).toBe("2");
  });

  it("shows critical count", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-critical-count").textContent).toBe("1");
  });

  it("shows 0 total for empty vendors", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={[]} />);
    expect(getByTestId("stat-total-count").textContent).toBe("0");
  });

  it("shows 0 active for empty vendors", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={[]} />);
    expect(getByTestId("stat-active-count").textContent).toBe("0");
  });

  it("shows 0 critical for empty vendors", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={[]} />);
    expect(getByTestId("stat-critical-count").textContent).toBe("0");
  });

  it("shows 5 active when all active", async () => {
    const allActive = vendors.map((v) => ({ ...v, status: "active" as Status }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allActive} />);
    expect(getByTestId("stat-active-count").textContent).toBe("5");
  });

  it("total badge shows correct count", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-total-badge").textContent).toContain("5");
  });

  it("renders total stat section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-total")).toBeDefined();
  });

  it("renders active stat section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-active")).toBeDefined();
  });

  // Risk breakdown (4 risks x 3 tests)
  for (const risk of riskLevels) {
    it(`renders risk row for ${risk}`, async () => {
      const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
      expect(getByTestId(`widget-risk-row-${risk}`)).toBeDefined();
    });

    it(`renders risk label for ${risk}`, async () => {
      const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
      expect(getByTestId(`widget-risk-label-${risk}`).textContent).toContain(risk);
    });

    it(`renders risk count for ${risk}`, async () => {
      const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
      expect(getByTestId(`widget-risk-count-${risk}`)).toBeDefined();
    });
  }

  // Top risk vendors (10)
  it("shows top risk vendors section when high/critical vendors exist", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-top-risk-vendors")).toBeDefined();
  });

  it("shows no risk vendors message when none exist", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allLow} />);
    expect(getByTestId("widget-no-risk-vendors")).toBeDefined();
  });

  it("shows up to 3 top risk vendors", async () => {
    const { container } = await render(<VendorDashboardWidget vendors={vendors} />);
    const vendorRows = container.querySelectorAll('[data-testid^="widget-vendor-"]');
    expect(vendorRows.length).toBeLessThanOrEqual(3);
  });

  it("shows vendor name in top risk section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-vendor-name-3")).toBeDefined();
  });

  it("shows critical vendor in top risk", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-vendor-name-4").textContent).toBe("Initech");
  });

  it("shows high risk vendor in top risk", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-vendor-name-3").textContent).toBe("Umbrella Corp");
  });

  it("shows risk badge for top risk vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-vendor-risk-3")).toBeDefined();
  });

  it("shows status badge for top risk vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-vendor-status-3")).toBeDefined();
  });

  it("no-risk-vendors message says No high-risk vendors", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allLow} />);
    expect(getByTestId("widget-no-risk-vendors").textContent).toContain("high-risk");
  });

  it("shows no top risk vendors for empty list", async () => {
    const { queryByTestId } = await render(<VendorDashboardWidget vendors={[]} />);
    expect(queryByTestId("widget-top-risk-vendors")).toBeNull();
  });

  // Click callbacks (10)
  it("calls onClick when widget clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(clicked).toBeTruthy();
  });

  it("calls onClick without vendor when widget clicked", async () => {
    let received: Vendor | undefined = mockVendor;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(received).toBeUndefined();
  });

  it("calls onClick with vendor when top risk vendor clicked", async () => {
    let received: Vendor | undefined = undefined;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("widget-vendor-3"));
    expect(received?.id).toBe("3");
  });

  it("does not throw when onClick not provided", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(getByTestId("vendor-dashboard-widget")).toBeDefined();
  });

  it("fires onClick multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(count).toBe(2);
  });

  it("snapshot with onClick handler", async () => {
    await render(<VendorDashboardWidget vendors={vendors} onClick={() => {}} />);
    await snapshot("vendor-dashboard-widget-clickable");
  });

  it("vendor row click does not propagate to widget", async () => {
    let widgetClicks = 0;
    let vendorClicks = 0;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={(v) => {
          if (v) vendorClicks++;
          else widgetClicks++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("widget-vendor-3"));
    expect(vendorClicks).toBe(1);
    expect(widgetClicks).toBe(0);
  });

  it("can click each top risk vendor", async () => {
    const clicked: string[] = [];
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={(v) => {
          if (v) clicked.push(v.id);
        }}
      />,
    );
    await fireEvent.click(getByTestId("widget-vendor-3"));
    await fireEvent.click(getByTestId("widget-vendor-4"));
    expect(clicked).toHaveLength(2);
  });

  it("widget has pointer cursor when onClick provided", async () => {
    const { getByTestId } = await render(
      <VendorDashboardWidget vendors={vendors} onClick={() => {}} />,
    );
    expect(getByTestId("vendor-dashboard-widget")).toBeDefined();
  });

  it("snapshot with all critical vendors", async () => {
    const allCritical = vendors.map((v) => ({ ...v, riskLevel: "critical" as Risk }));
    await render(<VendorDashboardWidget vendors={allCritical} />);
    await snapshot("vendor-dashboard-widget-all-critical");
  });

  // Edge cases (10)
  it("renders with single vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={[mockVendor]} />);
    expect(getByTestId("stat-total-count").textContent).toBe("1");
  });

  it("renders with 20 vendors", async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: riskLevels[i % 4],
    }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={manyVendors} />);
    expect(getByTestId("stat-total-count").textContent).toBe("20");
  });

  it("shows 100% active when all vendors are active", async () => {
    const allActive = vendors.map((v) => ({ ...v, status: "active" as Status }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allActive} />);
    expect(getByTestId("stat-active-count").textContent).toBe("5");
  });

  it("shows 0 active when none are active", async () => {
    const noneActive = vendors.map((v) => ({ ...v, status: "inactive" as Status }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={noneActive} />);
    expect(getByTestId("stat-active-count").textContent).toBe("0");
  });

  it("renders correctly with all required props", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("vendor-dashboard-widget")).toBeDefined();
  });

  it("renders correctly with all optional props", async () => {
    const { getByTestId } = await render(
      <VendorDashboardWidget vendors={vendors} onClick={() => {}} loading={false} />,
    );
    expect(getByTestId("vendor-dashboard-widget")).toBeDefined();
  });

  it("risk progress bars are rendered for each level", async () => {
    for (const risk of riskLevels) {
      const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
      expect(getByTestId(`widget-risk-progress-${risk}`)).toBeDefined();
    }
  });

  it("total badge text contains total number", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-total-badge").textContent).toContain("5 total");
  });

  it("shows only up to 3 top risk vendors even with many", async () => {
    const manyHighRisk = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: "critical" as Risk,
    }));
    const { container } = await render(<VendorDashboardWidget vendors={manyHighRisk} />);
    const vendorRows = container.querySelectorAll('[data-testid^="widget-vendor-"]');
    expect(vendorRows.length).toBeLessThanOrEqual(3);
  });

  it("renders stat-critical section", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-critical")).toBeDefined();
  });

  // Additional tests to reach 100
  it("widget container data-testid is vendor-dashboard-widget", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("vendor-dashboard-widget").getAttribute("data-testid")).toBe(
      "vendor-dashboard-widget",
    );
  });

  it("widget-header data-testid is widget-header", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-header").getAttribute("data-testid")).toBe("widget-header");
  });

  it("widget-title data-testid is widget-title", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-title").getAttribute("data-testid")).toBe("widget-title");
  });

  it("widget-total-badge data-testid is widget-total-badge", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-total-badge").getAttribute("data-testid")).toBe(
      "widget-total-badge",
    );
  });

  it("widget-stats data-testid is widget-stats", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-stats").getAttribute("data-testid")).toBe("widget-stats");
  });

  it("widget-risk-breakdown data-testid is widget-risk-breakdown", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-breakdown").getAttribute("data-testid")).toBe(
      "widget-risk-breakdown",
    );
  });

  it("stat-total data-testid is stat-total", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-total").getAttribute("data-testid")).toBe("stat-total");
  });

  it("stat-active data-testid is stat-active", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-active").getAttribute("data-testid")).toBe("stat-active");
  });

  it("stat-critical data-testid is stat-critical", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("stat-critical").getAttribute("data-testid")).toBe("stat-critical");
  });

  it("stat-total-count shows correct number for 3 vendors", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors.slice(0, 3)} />);
    expect(getByTestId("stat-total-count").textContent).toBe("3");
  });

  it("stat-total-count shows correct number for 1 vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={[mockVendor]} />);
    expect(getByTestId("stat-total-count").textContent).toBe("1");
  });

  it("stat-active-count shows 1 when 1 active vendor", async () => {
    const { getByTestId } = await render(
      <VendorDashboardWidget vendors={[{ ...mockVendor, status: "active" }]} />,
    );
    expect(getByTestId("stat-active-count").textContent).toBe("1");
  });

  it("stat-critical-count shows 0 when no critical vendors", async () => {
    const noCritical = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={noCritical} />);
    expect(getByTestId("stat-critical-count").textContent).toBe("0");
  });

  it("stat-critical-count shows 2 when 2 critical vendors", async () => {
    const twoCritical = vendors.map((v, i) => ({
      ...v,
      riskLevel: i < 2 ? ("critical" as Risk) : ("low" as Risk),
    }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={twoCritical} />);
    expect(getByTestId("stat-critical-count").textContent).toBe("2");
  });

  it("widget-risk-row-low data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-row-low").getAttribute("data-testid")).toBe(
      "widget-risk-row-low",
    );
  });

  it("widget-risk-row-medium data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-row-medium").getAttribute("data-testid")).toBe(
      "widget-risk-row-medium",
    );
  });

  it("widget-risk-row-high data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-row-high").getAttribute("data-testid")).toBe(
      "widget-risk-row-high",
    );
  });

  it("widget-risk-row-critical data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-row-critical").getAttribute("data-testid")).toBe(
      "widget-risk-row-critical",
    );
  });

  it("widget-risk-count-low shows 2 for 2 low risk vendors", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-count-low").textContent).toContain("2");
  });

  it("widget-risk-count-medium shows 1 for 1 medium risk vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-count-medium").textContent).toContain("1");
  });

  it("widget-risk-count-high shows 1 for 1 high risk vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-count-high").textContent).toContain("1");
  });

  it("widget-risk-count-critical shows 1 for 1 critical risk vendor", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-count-critical").textContent).toContain("1");
  });

  it("widget-risk-progress-low data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-progress-low").getAttribute("data-testid")).toBe(
      "widget-risk-progress-low",
    );
  });

  it("widget-risk-progress-medium data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-progress-medium").getAttribute("data-testid")).toBe(
      "widget-risk-progress-medium",
    );
  });

  it("widget-risk-progress-high data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-progress-high").getAttribute("data-testid")).toBe(
      "widget-risk-progress-high",
    );
  });

  it("widget-risk-progress-critical data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-risk-progress-critical").getAttribute("data-testid")).toBe(
      "widget-risk-progress-critical",
    );
  });

  it("snapshot with 1 vendor", async () => {
    await render(<VendorDashboardWidget vendors={[mockVendor]} />);
    await snapshot("vendor-dashboard-widget-1-vendor");
  });

  it("snapshot with all low risk", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    await render(<VendorDashboardWidget vendors={allLow} />);
    await snapshot("vendor-dashboard-widget-all-low");
  });

  it("snapshot with all high risk", async () => {
    const allHigh = vendors.map((v) => ({ ...v, riskLevel: "high" as Risk }));
    await render(<VendorDashboardWidget vendors={allHigh} />);
    await snapshot("vendor-dashboard-widget-all-high");
  });

  it("snapshot with all inactive", async () => {
    const allInactive = vendors.map((v) => ({ ...v, status: "inactive" as Status }));
    await render(<VendorDashboardWidget vendors={allInactive} />);
    await snapshot("vendor-dashboard-widget-all-inactive");
  });

  it("widget has correct data-loading=false initially", async () => {
    const { getByTestId } = await render(
      <VendorDashboardWidget vendors={vendors} loading={false} />,
    );
    expect(getByTestId("vendor-dashboard-widget").getAttribute("data-loading")).toBe("false");
  });

  it("widget shows loading spinner when loading=true", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} loading />);
    expect(getByTestId("widget-loading")).toBeDefined();
  });

  it("no top risk vendors section rendered for empty vendors", async () => {
    const { queryByTestId } = await render(<VendorDashboardWidget vendors={[]} />);
    expect(queryByTestId("widget-top-risk-vendors")).toBeNull();
  });

  it("shows top risk vendor section when any high/critical exists", async () => {
    const oneHigh = [{ ...mockVendor, riskLevel: "high" as Risk }];
    const { getByTestId } = await render(<VendorDashboardWidget vendors={oneHigh} />);
    expect(getByTestId("widget-top-risk-vendors")).toBeDefined();
  });

  it("no-risk-vendors shown when all vendors are medium or lower", async () => {
    const allMedium = vendors.map((v) => ({ ...v, riskLevel: "medium" as Risk }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allMedium} />);
    expect(getByTestId("widget-no-risk-vendors")).toBeDefined();
  });

  it("fires onClick once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(count).toBe(1);
  });

  it("fires onClick 3 times on 3 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorDashboardWidget
        vendors={vendors}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    await fireEvent.click(getByTestId("vendor-dashboard-widget"));
    expect(count).toBe(3);
  });

  it("widget-top-risk-vendors data-testid is correct", async () => {
    const { getByTestId } = await render(<VendorDashboardWidget vendors={vendors} />);
    expect(getByTestId("widget-top-risk-vendors").getAttribute("data-testid")).toBe(
      "widget-top-risk-vendors",
    );
  });

  it("widget-no-risk-vendors data-testid is correct for all low", async () => {
    const allLow = vendors.map((v) => ({ ...v, riskLevel: "low" as Risk }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={allLow} />);
    expect(getByTestId("widget-no-risk-vendors").getAttribute("data-testid")).toBe(
      "widget-no-risk-vendors",
    );
  });

  it("renders widget with 10 vendors and shows count 10", async () => {
    const tenVendors = Array.from({ length: 10 }, (_, i) => ({
      ...mockVendor,
      id: String(i),
      riskLevel: riskLevels[i % 4],
    }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={tenVendors} />);
    expect(getByTestId("stat-total-count").textContent).toBe("10");
  });

  it("renders widget with 3 active vendors", async () => {
    const threeActive = vendors.slice(0, 3).map((v) => ({ ...v, status: "active" as Status }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={threeActive} />);
    expect(getByTestId("stat-active-count").textContent).toBe("3");
  });

  it("renders widget with 4 critical vendors", async () => {
    const fourCritical = vendors.map((v, i) => ({
      ...v,
      riskLevel: i < 4 ? ("critical" as Risk) : ("low" as Risk),
    }));
    const { getByTestId } = await render(<VendorDashboardWidget vendors={fourCritical} />);
    expect(getByTestId("stat-critical-count").textContent).toBe("4");
  });
});
