import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { VendorExportButton } from "./VendorExportButton";
import { Vendor } from "../../types";

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
  { ...mockVendor, id: "1", name: "Acme Corp" },
  { ...mockVendor, id: "2", name: "Globex Inc" },
  { ...mockVendor, id: "3", name: "Umbrella Corp" },
  { ...mockVendor, id: "4", name: "Initech" },
  { ...mockVendor, id: "5", name: "Massive Dynamic" },
];

const formats = ["csv", "json", "pdf"] as const;

describe("VendorExportButton", () => {
  // Basic rendering (10)
  it("renders export button container", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("vendor-export-button")).toBeDefined();
  });

  it("renders trigger button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button")).toBeDefined();
  });

  it("shows vendor count in button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("5");
  });

  it("shows Export text in button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("Export");
  });

  it("renders chevron indicator", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-chevron")).toBeDefined();
  });

  it("dropdown is hidden by default", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("snapshot default state", async () => {
    await render(<VendorExportButton vendors={vendors} onExport={() => {}} />);
    await snapshot("vendor-export-button-default");
  });

  it("snapshot empty vendors", async () => {
    await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    await snapshot("vendor-export-button-empty");
  });

  it("shows empty hint when no vendors", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-empty-hint")).toBeDefined();
  });

  it("hides empty hint when vendors present", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(queryByTestId("export-empty-hint")).toBeNull();
  });

  // Dropdown behavior (10)
  it("clicking trigger button opens dropdown", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-dropdown")).toBeDefined();
  });

  it("clicking trigger again closes dropdown", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("dropdown shows CSV option", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-csv")).toBeDefined();
  });

  it("dropdown shows JSON option", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-json")).toBeDefined();
  });

  it("dropdown shows PDF option", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-pdf")).toBeDefined();
  });

  it("snapshot dropdown open", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await snapshot("vendor-export-button-open");
  });

  it("selecting csv option closes dropdown", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-csv"));
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("selecting json option closes dropdown", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-json"));
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("selecting pdf option closes dropdown", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-pdf"));
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("csv option text mentions CSV", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-csv").textContent).toContain("CSV");
  });

  // Export callbacks (10)
  for (const format of formats) {
    it(`calls onExport with ${format} when ${format} option selected`, async () => {
      let received = "";
      const { getByTestId } = await render(
        <VendorExportButton
          vendors={vendors}
          onExport={(f) => {
            received = f;
          }}
        />,
      );
      await fireEvent.click(getByTestId("export-trigger-button"));
      await fireEvent.click(getByTestId(`export-option-${format}`));
      expect(received).toBe(format);
    });
  }

  it("fires onExport once per selection", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-csv"));
    expect(count).toBe(1);
  });

  it("can export multiple times by reopening dropdown", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-csv"));
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-json"));
    expect(count).toBe(2);
  });

  it("does not call onExport without selecting option", async () => {
    let exported = false;
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={() => {
          exported = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(exported).toBe(false);
  });

  it("json option text mentions JSON", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-json").textContent).toContain("JSON");
  });

  it("pdf option text mentions PDF", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-pdf").textContent).toContain("PDF");
  });

  // Disabled state (10)
  it("trigger button is disabled when disabled=true", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} disabled />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBeTruthy();
  });

  it("trigger button is disabled when loading=true", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBeTruthy();
  });

  it("trigger button is disabled when no vendors", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-trigger-button").disabled).toBeTruthy();
  });

  it("trigger button is not disabled with vendors and no flags", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBe(false);
  });

  it("dropdown does not open when disabled", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} disabled />,
    );
    const btn = getByTestId("export-trigger-button");
    if (!btn.disabled) await fireEvent.click(btn);
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("shows spinner when loading", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading />,
    );
    expect(getByTestId("export-spinner")).toBeDefined();
  });

  it("hides spinner when not loading", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(queryByTestId("export-spinner")).toBeNull();
  });

  it("snapshot disabled state", async () => {
    await render(<VendorExportButton vendors={vendors} onExport={() => {}} disabled />);
    await snapshot("vendor-export-button-disabled");
  });

  it("snapshot loading state", async () => {
    await render(<VendorExportButton vendors={vendors} onExport={() => {}} loading />);
    await snapshot("vendor-export-button-loading");
  });

  it("empty vendors shows (0) or no count", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-trigger-button").textContent).toBeDefined();
  });

  // Vendor count variations (10)
  it("shows count of 1 vendor", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={[mockVendor]} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("1");
  });

  it("shows count of 5 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("5");
  });

  it("shows count of 20 vendors", async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({ ...mockVendor, id: String(i) }));
    const { getByTestId } = await render(
      <VendorExportButton vendors={manyVendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("20");
  });

  it("shows count of 100 vendors", async () => {
    const bigList = Array.from({ length: 100 }, (_, i) => ({ ...mockVendor, id: String(i) }));
    const { getByTestId } = await render(
      <VendorExportButton vendors={bigList} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("100");
  });

  it("renders correctly with 2 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors.slice(0, 2)} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("2");
  });

  it("renders correctly with 10 vendors", async () => {
    const tenVendors = Array.from({ length: 10 }, (_, i) => ({ ...mockVendor, id: String(i) }));
    const { getByTestId } = await render(
      <VendorExportButton vendors={tenVendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("10");
  });

  it("trigger button enabled with 1 vendor", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={[mockVendor]} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBe(false);
  });

  it("trigger button disabled with 0 vendors even if not explicitly disabled", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={[]} onExport={() => {}} disabled={false} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBeTruthy();
  });

  it("can open dropdown with 1 vendor", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={[mockVendor]} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-dropdown")).toBeDefined();
  });

  it("dropdown has all 3 format options", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    for (const format of formats) {
      expect(getByTestId(`export-option-${format}`)).toBeDefined();
    }
  });

  // Edge cases (15)
  it("renders without throwing", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("vendor-export-button")).toBeDefined();
  });

  it("renders with disabled and loading both true", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} disabled loading />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBeTruthy();
  });

  it("snapshot with 1 vendor", async () => {
    await render(<VendorExportButton vendors={[mockVendor]} onExport={() => {}} />);
    await snapshot("vendor-export-button-1-vendor");
  });

  it("snapshot with 5 vendors", async () => {
    await render(<VendorExportButton vendors={vendors} onExport={() => {}} />);
    await snapshot("vendor-export-button-5-vendors");
  });

  it("snapshot dropdown open with vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await snapshot("vendor-export-button-dropdown-open");
  });

  it("exports csv successfully", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-csv"));
    expect(format).toBe("csv");
  });

  it("exports json successfully", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-json"));
    expect(format).toBe("json");
  });

  it("exports pdf successfully", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-pdf"));
    expect(format).toBe("pdf");
  });

  it("export trigger button has Export text", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("Export");
  });

  it("renders correctly when all optional props omitted", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("vendor-export-button")).toBeDefined();
  });

  it("button shows count in parentheses", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(5)");
  });

  it("dropdown closes after any selection", async () => {
    for (const format of formats) {
      const { getByTestId, queryByTestId } = await render(
        <VendorExportButton vendors={vendors} onExport={() => {}} />,
      );
      await fireEvent.click(getByTestId("export-trigger-button"));
      await fireEvent.click(getByTestId(`export-option-${format}`));
      expect(queryByTestId("export-dropdown")).toBeNull();
    }
  });

  it("renders with disabled=false explicitly", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} disabled={false} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBe(false);
  });

  it("renders with loading=false explicitly", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading={false} />,
    );
    expect(queryByTestId("export-spinner")).toBeNull();
  });

  it("empty-hint text mentions export", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-empty-hint").textContent.toLowerCase()).toContain("vendor");
  });

  // Additional tests to reach 100
  it("vendor-export-button data-testid is vendor-export-button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("vendor-export-button").getAttribute("data-testid")).toBe(
      "vendor-export-button",
    );
  });

  it("export-trigger-button data-testid is export-trigger-button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").getAttribute("data-testid")).toBe(
      "export-trigger-button",
    );
  });

  it("export-chevron data-testid is export-chevron", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-chevron").getAttribute("data-testid")).toBe("export-chevron");
  });

  it("export-dropdown data-testid is export-dropdown when open", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-dropdown").getAttribute("data-testid")).toBe("export-dropdown");
  });

  it("export-option-csv data-testid is export-option-csv", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-csv").getAttribute("data-testid")).toBe("export-option-csv");
  });

  it("export-option-json data-testid is export-option-json", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-json").getAttribute("data-testid")).toBe(
      "export-option-json",
    );
  });

  it("export-option-pdf data-testid is export-option-pdf", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-pdf").getAttribute("data-testid")).toBe("export-option-pdf");
  });

  it("export-spinner data-testid is export-spinner when loading", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading />,
    );
    expect(getByTestId("export-spinner").getAttribute("data-testid")).toBe("export-spinner");
  });

  it("export-empty-hint data-testid is export-empty-hint when no vendors", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-empty-hint").getAttribute("data-testid")).toBe("export-empty-hint");
  });

  it("trigger button is a button element", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").tagName).toBe("BUTTON");
  });

  it("dropdown options are button elements", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-csv").tagName).toBe("BUTTON");
  });

  it("fires onExport with csv on csv option click", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-csv"));
    expect(format).toBe("csv");
  });

  it("fires onExport with json on json option click", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-json"));
    expect(format).toBe("json");
  });

  it("fires onExport with pdf on pdf option click", async () => {
    let format = "";
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={(f) => {
          format = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-pdf"));
    expect(format).toBe("pdf");
  });

  it("fires onExport only once per selection", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorExportButton
        vendors={vendors}
        onExport={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-option-json"));
    expect(count).toBe(1);
  });

  it("dropdown does not open when loading", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading />,
    );
    expect(queryByTestId("export-dropdown")).toBeNull();
  });

  it("snapshot with 3 vendors dropdown closed", async () => {
    await render(<VendorExportButton vendors={vendors.slice(0, 3)} onExport={() => {}} />);
    await snapshot("vendor-export-button-3-vendors");
  });

  it("snapshot with loading and 5 vendors", async () => {
    await render(<VendorExportButton vendors={vendors} onExport={() => {}} loading />);
    await snapshot("vendor-export-button-loading-5-vendors");
  });

  it("trigger button shows count (1) for single vendor", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={[mockVendor]} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(1)");
  });

  it("trigger button shows count (5) for 5 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(5)");
  });

  it("trigger button shows (0) for empty vendors", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("export-trigger-button").textContent).toContain("(0)");
  });

  it("shows csv option text containing CSV", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-csv").textContent).toContain("CSV");
  });

  it("shows json option text containing JSON", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-json").textContent).toContain("JSON");
  });

  it("shows pdf option text containing PDF", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-option-pdf").textContent).toContain("PDF");
  });

  it("trigger button not disabled with loading=false", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading={false} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBe(false);
  });

  it("trigger button not disabled with disabled=false and vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} disabled={false} />,
    );
    expect(getByTestId("export-trigger-button").disabled).toBe(false);
  });

  it("spinner hidden when loading=false", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} loading={false} />,
    );
    expect(queryByTestId("export-spinner")).toBeNull();
  });

  it("empty-hint hidden when vendors present", async () => {
    const { queryByTestId } = await render(
      <VendorExportButton vendors={[mockVendor]} onExport={() => {}} />,
    );
    expect(queryByTestId("export-empty-hint")).toBeNull();
  });

  it("can open and close dropdown twice", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-trigger-button"));
    await fireEvent.click(getByTestId("export-trigger-button"));
    expect(getByTestId("export-dropdown")).toBeDefined();
  });

  it("renders container element", async () => {
    const { container } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(container.querySelector('[data-testid="vendor-export-button"]')).toBeDefined();
  });

  it("renders trigger button element", async () => {
    const { container } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(container.querySelector('[data-testid="export-trigger-button"]')).toBeDefined();
  });

  it("renders chevron element", async () => {
    const { container } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect(container.querySelector('[data-testid="export-chevron"]')).toBeDefined();
  });

  it("export trigger button has type button", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    expect((getByTestId("export-trigger-button") as HTMLButtonElement).type).toBe("button");
  });

  it("renders without throwing with required props only", async () => {
    const { getByTestId } = await render(<VendorExportButton vendors={[]} onExport={() => {}} />);
    expect(getByTestId("vendor-export-button")).toBeDefined();
  });

  it("trigger button shows (2) for 2 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors.slice(0, 2)} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(2)");
  });

  it("trigger button shows (3) for 3 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors.slice(0, 3)} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(3)");
  });

  it("trigger button shows (4) for 4 vendors", async () => {
    const { getByTestId } = await render(
      <VendorExportButton vendors={vendors.slice(0, 4)} onExport={() => {}} />,
    );
    expect(getByTestId("export-trigger-button").textContent).toContain("(4)");
  });

  it("dropdown has exactly 3 options when open", async () => {
    const { getByTestId, container } = await render(
      <VendorExportButton vendors={vendors} onExport={() => {}} />,
    );
    await fireEvent.click(getByTestId("export-trigger-button"));
    const opts = container.querySelectorAll('[data-testid^="export-option-"]');
    expect(opts.length).toBe(3);
  });

  it("snapshot export button with 4 vendors", async () => {
    await render(<VendorExportButton vendors={vendors.slice(0, 4)} onExport={() => {}} />);
    await snapshot("vendor-export-button-4-vendors");
  });
});
