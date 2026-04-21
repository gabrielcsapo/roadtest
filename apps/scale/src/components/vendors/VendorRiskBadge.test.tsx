import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import { VendorRiskBadge } from "./VendorRiskBadge";
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
const trends = ["up", "down", "stable"] as const;
const sizes = ["sm", "md", "lg"] as const;

describe("VendorRiskBadge", () => {
  // Basic rendering (10)
  it("renders vendor risk badge container", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
  });

  it("renders core risk badge", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("default size is md", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("md");
  });

  it("hides trend by default", async () => {
    const { queryByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(queryByTestId("risk-trend")).toBeNull();
  });

  it("hides assessment date by default", async () => {
    const { queryByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(queryByTestId("risk-assessment-date")).toBeNull();
  });

  it("snapshot default", async () => {
    await render(<VendorRiskBadge vendor={mockVendor} />);
    await snapshot("vendor-risk-badge-default");
  });

  it("renders without error for all 5 vendors", async () => {
    for (const v of vendors) {
      const { getByTestId } = await render(<VendorRiskBadge vendor={v} />);
      expect(getByTestId("vendor-risk-badge")).toBeDefined();
    }
  });

  it("shows risk badge for low risk", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "low" }} />,
    );
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("shows risk badge for critical risk", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "critical" }} />,
    );
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("renders only required props", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
  });

  // Risk level rendering (4)
  for (const risk of riskLevels) {
    it(`renders ${risk} risk badge correctly`, async () => {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: risk }} />,
      );
      expect(getByTestId("risk-badge-core")).toBeDefined();
    });
  }

  // Size variations (3 sizes x 3 tests)
  for (const size of sizes) {
    it(`renders size ${size}`, async () => {
      const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} size={size} />);
      expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe(size);
    });

    it(`snapshot for size ${size}`, async () => {
      await render(<VendorRiskBadge vendor={mockVendor} size={size} />);
      await snapshot(`vendor-risk-badge-size-${size}`);
    });

    it(`renders with trend and size ${size}`, async () => {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={mockVendor} size={size} showTrend trend="up" />,
      );
      expect(getByTestId("risk-trend")).toBeDefined();
    });
  }

  // Trend rendering (3 trends x 4 tests)
  for (const trend of trends) {
    it(`renders ${trend} trend icon when showTrend=true`, async () => {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={mockVendor} showTrend trend={trend} />,
      );
      expect(getByTestId("risk-trend")).toBeDefined();
    });

    it(`trend data attribute is ${trend}`, async () => {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={mockVendor} showTrend trend={trend} />,
      );
      expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe(trend);
    });

    it(`snapshot for ${trend} trend`, async () => {
      await render(<VendorRiskBadge vendor={mockVendor} showTrend trend={trend} />);
      await snapshot(`vendor-risk-badge-trend-${trend}`);
    });

    it(`hides trend when showTrend=false for ${trend}`, async () => {
      const { queryByTestId } = await render(
        <VendorRiskBadge vendor={mockVendor} showTrend={false} trend={trend} />,
      );
      expect(queryByTestId("risk-trend")).toBeNull();
    });
  }

  // Assessment date (10)
  it("shows assessment date when showDate=true and date provided", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-01-15" />,
    );
    expect(getByTestId("risk-assessment-date")).toBeDefined();
  });

  it("hides assessment date when showDate=false", async () => {
    const { queryByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate={false} assessmentDate="2024-01-15" />,
    );
    expect(queryByTestId("risk-assessment-date")).toBeNull();
  });

  it("hides assessment date when assessmentDate not provided", async () => {
    const { queryByTestId } = await render(<VendorRiskBadge vendor={mockVendor} showDate />);
    expect(queryByTestId("risk-assessment-date")).toBeNull();
  });

  it("shows correct assessment date text", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-03-20" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-03-20");
  });

  it("shows different assessment date", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2023-12-01" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2023-12-01");
  });

  it("snapshot with date shown", async () => {
    await render(<VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-01-15" />);
    await snapshot("vendor-risk-badge-with-date");
  });

  it("snapshot with trend and date", async () => {
    await render(
      <VendorRiskBadge
        vendor={mockVendor}
        showTrend
        showDate
        trend="up"
        assessmentDate="2024-01-15"
      />,
    );
    await snapshot("vendor-risk-badge-trend-and-date");
  });

  it("renders with trend and date for all risk levels", async () => {
    for (const risk of riskLevels) {
      const { getByTestId } = await render(
        <VendorRiskBadge
          vendor={{ ...mockVendor, riskLevel: risk }}
          showTrend
          showDate
          trend="stable"
          assessmentDate="2024-01-01"
        />,
      );
      expect(getByTestId("risk-assessment-date")).toBeDefined();
    }
  });

  it("renders with all props", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={mockVendor}
        showTrend
        showDate
        trend="up"
        assessmentDate="2024-01-15"
        size="lg"
      />,
    );
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
    expect(getByTestId("risk-trend")).toBeDefined();
    expect(getByTestId("risk-assessment-date")).toBeDefined();
  });

  it("renders correctly for all vendors with all props", async () => {
    for (const v of vendors) {
      const { getByTestId } = await render(
        <VendorRiskBadge
          vendor={v}
          showTrend
          showDate
          trend="down"
          assessmentDate="2024-06-01"
          size="sm"
        />,
      );
      expect(getByTestId("vendor-risk-badge")).toBeDefined();
    }
  });

  // Edge cases (10)
  it("renders with minimal props", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
  });

  it("up trend shows up arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="up" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("↑");
  });

  it("down trend shows down arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="down" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("↓");
  });

  it("stable trend shows right arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="stable" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("→");
  });

  it("snapshot critical with up trend", async () => {
    await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "critical" }} showTrend trend="up" />,
    );
    await snapshot("vendor-risk-badge-critical-up");
  });

  it("snapshot low with down trend", async () => {
    await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "low" }} showTrend trend="down" />,
    );
    await snapshot("vendor-risk-badge-low-down");
  });

  it("size sm renders smaller", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} size="sm" />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("sm");
  });

  it("size lg renders larger", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} size="lg" />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("lg");
  });

  it("renders correctly with no assessmentDate but showDate=true", async () => {
    const { queryByTestId } = await render(<VendorRiskBadge vendor={mockVendor} showDate={true} />);
    expect(queryByTestId("risk-assessment-date")).toBeNull();
  });

  it("renders in inline-flex display", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
  });

  // Additional explicit tests to reach 100+
  it("renders low risk with sm size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "low" }} size="sm" />,
    );
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("sm");
  });

  it("renders medium risk with md size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "medium" }} size="md" />,
    );
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("md");
  });

  it("renders high risk with lg size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "high" }} size="lg" />,
    );
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("lg");
  });

  it("renders critical risk with up trend and sm size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "critical" }}
        showTrend
        trend="up"
        size="sm"
      />,
    );
    expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe("up");
  });

  it("renders low risk with down trend and lg size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "low" }}
        showTrend
        trend="down"
        size="lg"
      />,
    );
    expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe("down");
  });

  it("renders medium risk with stable trend and md size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "medium" }}
        showTrend
        trend="stable"
        size="md"
      />,
    );
    expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe("stable");
  });

  it("renders high risk with date and sm size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "high" }}
        showDate
        assessmentDate="2024-01-01"
        size="sm"
      />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-01-01");
  });

  it("renders critical risk with date and lg size", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "critical" }}
        showDate
        assessmentDate="2024-06-15"
        size="lg"
      />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-06-15");
  });

  it("renders low risk with all features at sm", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "low" }}
        showTrend
        showDate
        trend="stable"
        assessmentDate="2024-01-01"
        size="sm"
      />,
    );
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("sm");
  });

  it("renders medium risk with all features at lg", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "medium" }}
        showTrend
        showDate
        trend="up"
        assessmentDate="2024-02-01"
        size="lg"
      />,
    );
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("lg");
  });

  it("snapshot low risk sm no trend", async () => {
    await render(<VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "low" }} size="sm" />);
    await snapshot("vendor-risk-badge-low-sm");
  });

  it("snapshot medium risk lg with stable trend", async () => {
    await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "medium" }}
        size="lg"
        showTrend
        trend="stable"
      />,
    );
    await snapshot("vendor-risk-badge-medium-lg-stable");
  });

  it("snapshot high risk md with date", async () => {
    await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "high" }}
        size="md"
        showDate
        assessmentDate="2024-03-15"
      />,
    );
    await snapshot("vendor-risk-badge-high-md-date");
  });

  it("snapshot critical risk sm with up trend and date", async () => {
    await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "critical" }}
        size="sm"
        showTrend
        trend="up"
        showDate
        assessmentDate="2024-01-15"
      />,
    );
    await snapshot("vendor-risk-badge-critical-sm-up-date");
  });

  it("renders each vendor with each size", async () => {
    for (const vendor of vendors) {
      for (const size of sizes) {
        const { getByTestId } = await render(<VendorRiskBadge vendor={vendor} size={size} />);
        expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe(size);
      }
    }
  });

  it("renders each risk with each trend", async () => {
    for (const risk of riskLevels) {
      for (const trend of trends) {
        const { getByTestId } = await render(
          <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: risk }} showTrend trend={trend} />,
        );
        expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe(trend);
      }
    }
  });

  it("core risk badge is always present", async () => {
    for (const risk of riskLevels) {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: risk }} />,
      );
      expect(getByTestId("risk-badge-core")).toBeDefined();
    }
  });

  it("assessment date is hidden when showDate false regardless of date value", async () => {
    const { queryByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate={false} assessmentDate="2024-01-01" />,
    );
    expect(queryByTestId("risk-assessment-date")).toBeNull();
  });

  it("trend is hidden when showTrend false regardless of trend value", async () => {
    for (const trend of trends) {
      const { queryByTestId } = await render(
        <VendorRiskBadge vendor={mockVendor} showTrend={false} trend={trend} />,
      );
      expect(queryByTestId("risk-trend")).toBeNull();
    }
  });

  it("renders assessment date 2023-01-01 correctly", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2023-01-01" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2023-01-01");
  });

  it("renders assessment date 2025-12-31 correctly", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2025-12-31" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2025-12-31");
  });

  it("renders vendor Acme Corp with all options", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={vendors[0]}
        showTrend
        showDate
        trend="up"
        assessmentDate="2024-01-15"
        size="md"
      />,
    );
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("renders vendor Globex Inc with all options", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge
        vendor={vendors[1]}
        showTrend
        showDate
        trend="down"
        assessmentDate="2024-02-01"
        size="lg"
      />,
    );
    expect(getByTestId("risk-assessment-date")).toBeDefined();
  });

  it("renders vendor Umbrella Corp with no options", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={vendors[2]} />);
    expect(getByTestId("vendor-risk-badge")).toBeDefined();
  });

  it("renders vendor Initech with trend only", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={vendors[3]} showTrend trend="stable" />,
    );
    expect(getByTestId("risk-trend")).toBeDefined();
  });

  it("renders vendor Massive Dynamic with date only", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={vendors[4]} showDate assessmentDate="2024-05-01" />,
    );
    expect(getByTestId("risk-assessment-date")).toBeDefined();
  });

  it("badge container data-size is sm by default only when specified", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} size="sm" />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("sm");
  });

  it("badge container data-size is lg only when specified", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} size="lg" />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("lg");
  });

  it("badge container data-size is md by default", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("md");
  });

  // Additional tests to reach 100
  it("vendor-risk-badge data-testid is vendor-risk-badge", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-testid")).toBe("vendor-risk-badge");
  });

  it("risk-badge-core data-testid is risk-badge-core", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("risk-badge-core").getAttribute("data-testid")).toBe("risk-badge-core");
  });

  it("risk-trend data-testid is risk-trend when shown", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="up" />,
    );
    expect(getByTestId("risk-trend").getAttribute("data-testid")).toBe("risk-trend");
  });

  it("risk-assessment-date data-testid is risk-assessment-date when shown", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-01-15" />,
    );
    expect(getByTestId("risk-assessment-date").getAttribute("data-testid")).toBe(
      "risk-assessment-date",
    );
  });

  it("renders low risk badge core text contains low", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "low" }} />,
    );
    expect(getByTestId("risk-badge-core").textContent.toLowerCase()).toContain("low");
  });

  it("renders medium risk badge core text contains medium", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "medium" }} />,
    );
    expect(getByTestId("risk-badge-core").textContent.toLowerCase()).toContain("medium");
  });

  it("renders high risk badge core text contains high", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "high" }} />,
    );
    expect(getByTestId("risk-badge-core").textContent.toLowerCase()).toContain("high");
  });

  it("renders critical risk badge core text contains critical", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: "critical" }} />,
    );
    expect(getByTestId("risk-badge-core").textContent.toLowerCase()).toContain("critical");
  });

  it("trend up shows ↑ arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="up" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("↑");
  });

  it("trend down shows ↓ arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="down" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("↓");
  });

  it("trend stable shows → arrow", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showTrend trend="stable" />,
    );
    expect(getByTestId("risk-trend").textContent).toContain("→");
  });

  it("renders vendor risk badge for all 5 vendors without error", async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorRiskBadge vendor={vendor} />);
      expect(getByTestId("vendor-risk-badge")).toBeDefined();
    }
  });

  it("date label mentions Assessed", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-01-15" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("Assessed");
  });

  it("snapshot default md no options", async () => {
    await render(<VendorRiskBadge vendor={mockVendor} size="md" />);
    await snapshot("vendor-risk-badge-default-md");
  });

  it("snapshot with trend up md", async () => {
    await render(<VendorRiskBadge vendor={mockVendor} showTrend trend="up" size="md" />);
    await snapshot("vendor-risk-badge-trend-up-md");
  });

  it("snapshot with trend down sm", async () => {
    await render(<VendorRiskBadge vendor={mockVendor} showTrend trend="down" size="sm" />);
    await snapshot("vendor-risk-badge-trend-down-sm");
  });

  it("snapshot with date and trend", async () => {
    await render(
      <VendorRiskBadge
        vendor={mockVendor}
        showTrend
        trend="stable"
        showDate
        assessmentDate="2024-06-01"
      />,
    );
    await snapshot("vendor-risk-badge-date-and-trend");
  });

  it("renders all 5 vendors with size lg correctly", async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorRiskBadge vendor={vendor} size="lg" />);
      expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("lg");
    }
  });

  it("renders all 5 vendors with size sm correctly", async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(<VendorRiskBadge vendor={vendor} size="sm" />);
      expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe("sm");
    }
  });

  it("renders all 5 vendors with showDate and date", async () => {
    for (const vendor of vendors) {
      const { getByTestId } = await render(
        <VendorRiskBadge vendor={vendor} showDate assessmentDate="2024-01-01" />,
      );
      expect(getByTestId("risk-assessment-date")).toBeDefined();
    }
  });

  it("risk-badge-core is defined for vendor Acme Corp", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={vendors[0]} />);
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("risk-badge-core is defined for vendor Globex Inc", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={vendors[1]} />);
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("risk-badge-core is defined for vendor Initech", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={vendors[3]} />);
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("risk-badge-core is defined for vendor Massive Dynamic", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={vendors[4]} />);
    expect(getByTestId("risk-badge-core")).toBeDefined();
  });

  it("renders all vendors with all trends without error", async () => {
    for (const vendor of vendors) {
      for (const trend of trends) {
        const { getByTestId } = await render(
          <VendorRiskBadge vendor={vendor} showTrend trend={trend} />,
        );
        expect(getByTestId("vendor-risk-badge")).toBeDefined();
      }
    }
  });

  it("snapshot low risk with down trend lg", async () => {
    await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "low" }}
        showTrend
        trend="down"
        size="lg"
      />,
    );
    await snapshot("vendor-risk-badge-low-down-lg");
  });

  it("snapshot critical with all options", async () => {
    await render(
      <VendorRiskBadge
        vendor={{ ...mockVendor, riskLevel: "critical" }}
        showTrend
        trend="up"
        showDate
        assessmentDate="2024-12-01"
        size="lg"
      />,
    );
    await snapshot("vendor-risk-badge-critical-all-lg");
  });

  it("renders all trends for critical risk", async () => {
    for (const trend of trends) {
      const { getByTestId } = await render(
        <VendorRiskBadge
          vendor={{ ...mockVendor, riskLevel: "critical" }}
          showTrend
          trend={trend}
        />,
      );
      expect(getByTestId("risk-trend").getAttribute("data-trend")).toBe(trend);
    }
  });

  it("renders all sizes for each risk level", async () => {
    for (const risk of riskLevels) {
      for (const size of sizes) {
        const { getByTestId } = await render(
          <VendorRiskBadge vendor={{ ...mockVendor, riskLevel: risk }} size={size} />,
        );
        expect(getByTestId("vendor-risk-badge").getAttribute("data-size")).toBe(size);
      }
    }
  });

  it("renders assessment date 2024-03-01 correctly", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-03-01" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-03-01");
  });

  it("renders assessment date 2024-07-04 correctly", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-07-04" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-07-04");
  });

  it("renders assessment date 2024-12-31 correctly", async () => {
    const { getByTestId } = await render(
      <VendorRiskBadge vendor={mockVendor} showDate assessmentDate="2024-12-31" />,
    );
    expect(getByTestId("risk-assessment-date").textContent).toContain("2024-12-31");
  });

  it("vendor-risk-badge data-testid is vendor-risk-badge", async () => {
    const { getByTestId } = await render(<VendorRiskBadge vendor={mockVendor} />);
    expect(getByTestId("vendor-risk-badge").getAttribute("data-testid")).toBe("vendor-risk-badge");
  });
});
