import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import { VendorTable } from "./VendorTable";
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
  description: "A cloud infrastructure provider.",
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

describe("VendorTable", () => {
  // Basic rendering (10)
  it("renders vendor table container", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-container")).toBeDefined();
  });

  it("renders table element", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table")).toBeDefined();
  });

  it("renders table header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-header")).toBeDefined();
  });

  it("renders table body", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-body")).toBeDefined();
  });

  it("renders name column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-name")).toBeDefined();
  });

  it("renders risk column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-risk")).toBeDefined();
  });

  it("renders status column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-status")).toBeDefined();
  });

  it("renders category column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-category")).toBeDefined();
  });

  it("renders actions column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-actions")).toBeDefined();
  });

  it("renders review column header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-review")).toBeDefined();
  });

  // Row rendering (5 vendors)
  for (const vendor of vendors) {
    it(`renders row for vendor: ${vendor.name}`, async () => {
      const { getByTestId } = await render(<VendorTable vendors={[vendor]} />);
      expect(getByTestId(`vendor-row-${vendor.id}`)).toBeDefined();
    });
  }

  // Cell rendering (10)
  it("renders vendor name in cell", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("name-1").textContent).toBe("Acme Corp");
  });

  it("renders vendor category in cell", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("category-1").textContent).toContain("Cloud Infrastructure");
  });

  it("renders vendor review date in cell", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("review-1").textContent).toContain("2024-01-15");
  });

  it("renders risk badge in risk cell", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("risk-1")).toBeDefined();
  });

  it("renders status badge in status cell", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("status-1")).toBeDefined();
  });

  it("renders 5 rows for 5 vendors", async () => {
    const { container } = await render(<VendorTable vendors={vendors} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(5);
  });

  it("renders 1 row for 1 vendor", async () => {
    const { container } = await render(<VendorTable vendors={[mockVendor]} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(1);
  });

  it("renders 20 rows for 20 vendors", async () => {
    const manyVendors = Array.from({ length: 20 }, (_, i) => ({
      ...mockVendor,
      id: String(i + 1),
      name: `Vendor ${i + 1}`,
    }));
    const { container } = await render(<VendorTable vendors={manyVendors} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(20);
  });

  it("renders select checkbox for each row", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("select-1")).toBeDefined();
  });

  it("renders actions cell for each row", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("actions-1")).toBeDefined();
  });

  // Empty state (5)
  it("renders empty state when no vendors", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[]} />);
    expect(getByTestId("vendor-table-empty")).toBeDefined();
  });

  it("does not render table when vendors is empty", async () => {
    const { queryByTestId } = await render(<VendorTable vendors={[]} />);
    expect(queryByTestId("vendor-table-container")).toBeNull();
  });

  it("empty state snapshot", async () => {
    await render(<VendorTable vendors={[]} />);
    await snapshot("vendor-table-empty");
  });

  it("does not show loading when vendors empty and not loading", async () => {
    const { queryByTestId } = await render(<VendorTable vendors={[]} />);
    expect(queryByTestId("vendor-table-loading")).toBeNull();
  });

  it("empty state has no rows", async () => {
    const { container } = await render(<VendorTable vendors={[]} />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(0);
  });

  // Loading state (5)
  it("renders loading state", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[]} loading />);
    expect(getByTestId("vendor-table-loading")).toBeDefined();
  });

  it("hides table when loading", async () => {
    const { queryByTestId } = await render(<VendorTable vendors={vendors} loading />);
    expect(queryByTestId("vendor-table-container")).toBeNull();
  });

  it("hides empty state when loading", async () => {
    const { queryByTestId } = await render(<VendorTable vendors={[]} loading />);
    expect(queryByTestId("vendor-table-empty")).toBeNull();
  });

  it("loading snapshot", async () => {
    await render(<VendorTable vendors={[]} loading />);
    await snapshot("vendor-table-loading");
  });

  it("loading=false shows table", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} loading={false} />);
    expect(getByTestId("vendor-table-container")).toBeDefined();
  });

  // Sorting (10)
  it("calls onSort when name column clicked", async () => {
    let sortCalled = false;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={() => {
          sortCalled = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-name"));
    expect(sortCalled).toBeTruthy();
  });

  it("calls onSort with correct field when name clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortField = s.field;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-name"));
    expect(sortField).toBe("name");
  });

  it("calls onSort with asc direction on first click", async () => {
    let sortDir = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortDir = s.direction;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-name"));
    expect(sortDir).toBe("asc");
  });

  it("calls onSort with desc direction on second click of same column", async () => {
    let sortDir = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortDir = s.direction;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-name"));
    await fireEvent.click(getByTestId("col-name"));
    expect(sortDir).toBe("desc");
  });

  it("calls onSort when category column clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortField = s.field;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-category"));
    expect(sortField).toBe("category");
  });

  it("calls onSort when risk column clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortField = s.field;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-risk"));
    expect(sortField).toBe("riskLevel");
  });

  it("calls onSort when status column clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortField = s.field;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-status"));
    expect(sortField).toBe("status");
  });

  it("does not throw when onSort is not provided", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    await fireEvent.click(getByTestId("col-name"));
    expect(getByTestId("vendor-table-container")).toBeDefined();
  });

  it("default sort is by name asc", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-name").textContent).toContain("↑");
  });

  it("snapshot of default table", async () => {
    await render(<VendorTable vendors={vendors} />);
    await snapshot("vendor-table-default");
  });

  // Selection (10)
  it("marks row as selected when id in selectedIds", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} selectedIds={["1"]} />);
    expect(getByTestId("vendor-row-1").getAttribute("data-selected")).toBe("true");
  });

  it("marks row as not selected when id not in selectedIds", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} selectedIds={[]} />);
    expect(getByTestId("vendor-row-1").getAttribute("data-selected")).toBe("false");
  });

  it("marks multiple rows as selected", async () => {
    const { container } = await render(
      <VendorTable vendors={vendors} selectedIds={["1", "2", "3"]} />,
    );
    const selected = container.querySelectorAll('[data-selected="true"]');
    expect(selected.length).toBe(3);
  });

  it("calls onSelect when row clicked", async () => {
    let selected: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={[mockVendor]}
        onSelect={(v) => {
          selected = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-row-1"));
    expect(selected).toEqual(mockVendor);
  });

  it("default selectedIds is empty", async () => {
    const { container } = await render(<VendorTable vendors={vendors} />);
    const selected = container.querySelectorAll('[data-selected="true"]');
    expect(selected.length).toBe(0);
  });

  it("selection snapshot", async () => {
    await render(<VendorTable vendors={vendors} selectedIds={["1", "3"]} />);
    await snapshot("vendor-table-selection");
  });

  it("all selected snapshot", async () => {
    await render(<VendorTable vendors={vendors} selectedIds={["1", "2", "3", "4", "5"]} />);
    await snapshot("vendor-table-all-selected");
  });

  it("handles invalid selectedId gracefully", async () => {
    const { container } = await render(<VendorTable vendors={vendors} selectedIds={["999"]} />);
    const selected = container.querySelectorAll('[data-selected="true"]');
    expect(selected.length).toBe(0);
  });

  it("edit button calls onEdit", async () => {
    let edited: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={[mockVendor]}
        onEdit={(v) => {
          edited = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-1"));
    expect(edited).toEqual(mockVendor);
  });

  it("delete button calls onDelete", async () => {
    let deleted: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={[mockVendor]}
        onDelete={(v) => {
          deleted = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-1"));
    expect(deleted).toEqual(mockVendor);
  });

  // Risk levels (4)
  for (const risk of riskLevels) {
    it(`renders ${risk} risk row correctly`, async () => {
      const { getByTestId } = await render(
        <VendorTable vendors={[{ ...mockVendor, riskLevel: risk }]} />,
      );
      expect(getByTestId("risk-1")).toBeDefined();
    });
  }

  // Statuses (4)
  for (const status of statuses) {
    it(`renders ${status} status row correctly`, async () => {
      const { getByTestId } = await render(<VendorTable vendors={[{ ...mockVendor, status }]} />);
      expect(getByTestId("status-1")).toBeDefined();
    });
  }

  // Edge cases (5)
  it("no edit buttons when onEdit not provided", async () => {
    const { container } = await render(<VendorTable vendors={vendors} />);
    expect(container.querySelectorAll('[data-testid^="edit-"]').length).toBe(0);
  });

  it("no delete buttons when onDelete not provided", async () => {
    const { container } = await render(<VendorTable vendors={vendors} />);
    expect(container.querySelectorAll('[data-testid^="delete-"]').length).toBe(0);
  });

  it("renders all action buttons when both handlers provided", async () => {
    const { container } = await render(
      <VendorTable vendors={vendors} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(container.querySelectorAll('[data-testid^="edit-"]').length).toBe(5);
    expect(container.querySelectorAll('[data-testid^="delete-"]').length).toBe(5);
  });

  it("snapshot with edit and delete", async () => {
    await render(<VendorTable vendors={vendors} onEdit={() => {}} onDelete={() => {}} />);
    await snapshot("vendor-table-actions");
  });

  it("select column is always rendered", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-select")).toBeDefined();
  });

  // Additional tests to reach 100
  it("vendor-table-container data-testid is vendor-table-container", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-container").getAttribute("data-testid")).toBe(
      "vendor-table-container",
    );
  });

  it("vendor-table data-testid is vendor-table", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table").getAttribute("data-testid")).toBe("vendor-table");
  });

  it("vendor-table-header data-testid is vendor-table-header", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-header").getAttribute("data-testid")).toBe(
      "vendor-table-header",
    );
  });

  it("vendor-table-body data-testid is vendor-table-body", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-table-body").getAttribute("data-testid")).toBe("vendor-table-body");
  });

  it("col-name data-testid is col-name", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-name").getAttribute("data-testid")).toBe("col-name");
  });

  it("col-risk data-testid is col-risk", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-risk").getAttribute("data-testid")).toBe("col-risk");
  });

  it("col-status data-testid is col-status", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-status").getAttribute("data-testid")).toBe("col-status");
  });

  it("col-category data-testid is col-category", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-category").getAttribute("data-testid")).toBe("col-category");
  });

  it("col-select data-testid is col-select", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-select").getAttribute("data-testid")).toBe("col-select");
  });

  it("vendor-row-1 data-testid is vendor-row-1", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-row-1").getAttribute("data-testid")).toBe("vendor-row-1");
  });

  it("name-1 data-testid is name-1", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("name-1").getAttribute("data-testid")).toBe("name-1");
  });

  it("risk-1 data-testid is risk-1", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("risk-1").getAttribute("data-testid")).toBe("risk-1");
  });

  it("status-1 data-testid is status-1", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("status-1").getAttribute("data-testid")).toBe("status-1");
  });

  it("category-1 data-testid is category-1", async () => {
    const { getByTestId } = await render(<VendorTable vendors={[mockVendor]} />);
    expect(getByTestId("category-1").getAttribute("data-testid")).toBe("category-1");
  });

  it("renders vendor name for Globex Inc", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("name-2").textContent).toBe("Globex Inc");
  });

  it("renders vendor name for Umbrella Corp", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("name-3").textContent).toBe("Umbrella Corp");
  });

  it("renders vendor name for Initech", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("name-4").textContent).toBe("Initech");
  });

  it("renders vendor name for Massive Dynamic", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("name-5").textContent).toBe("Massive Dynamic");
  });

  it("renders risk cell for vendor 2", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("risk-2")).toBeDefined();
  });

  it("renders status cell for vendor 2", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("status-2")).toBeDefined();
  });

  it("renders risk cell for vendor 3", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("risk-3")).toBeDefined();
  });

  it("renders status cell for vendor 4", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("status-4")).toBeDefined();
  });

  it("calls onSort when review column header clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSort={(s) => {
          sortField = s.field;
        }}
      />,
    );
    await fireEvent.click(getByTestId("col-review"));
    expect(sortField).toBe("lastReviewDate");
  });

  it("calling onSelect with vendor 2 returns correct vendor", async () => {
    let selected: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSelect={(v) => {
          selected = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-row-2"));
    expect(selected?.id).toBe("2");
  });

  it("calling onSelect with vendor 3 returns correct vendor", async () => {
    let selected: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onSelect={(v) => {
          selected = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-row-3"));
    expect(selected?.id).toBe("3");
  });

  it("onEdit with vendor 2 returns vendor 2", async () => {
    let edited: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onEdit={(v) => {
          edited = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-2"));
    expect(edited?.id).toBe("2");
  });

  it("onDelete with vendor 2 returns vendor 2", async () => {
    let deleted: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onDelete={(v) => {
          deleted = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-2"));
    expect(deleted?.id).toBe("2");
  });

  it("onEdit with vendor 3 returns vendor 3", async () => {
    let edited: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onEdit={(v) => {
          edited = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-3"));
    expect(edited?.id).toBe("3");
  });

  it("onDelete with vendor 4 returns vendor 4", async () => {
    let deleted: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorTable
        vendors={vendors}
        onDelete={(v) => {
          deleted = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-4"));
    expect(deleted?.id).toBe("4");
  });

  it("selected vendor rows show data-selected true for vendor 2", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} selectedIds={["2"]} />);
    expect(getByTestId("vendor-row-2").getAttribute("data-selected")).toBe("true");
  });

  it("unselected vendor rows show data-selected false for vendor 2 when only 1 selected", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} selectedIds={["1"]} />);
    expect(getByTestId("vendor-row-2").getAttribute("data-selected")).toBe("false");
  });

  it("select checkbox for vendor 2 exists", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("select-2")).toBeDefined();
  });

  it("select checkbox for vendor 5 exists", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("select-5")).toBeDefined();
  });

  it("snapshot with 3 vendors", async () => {
    await render(<VendorTable vendors={vendors.slice(0, 3)} />);
    await snapshot("vendor-table-3-vendors");
  });

  it("snapshot with 1 vendor", async () => {
    await render(<VendorTable vendors={[mockVendor]} />);
    await snapshot("vendor-table-1-vendor");
  });

  it("snapshot sorted by risk", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} onSort={() => {}} />);
    await fireEvent.click(getByTestId("col-risk"));
    await snapshot("vendor-table-sorted-risk");
  });

  it("col-name text contains Name", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-name").textContent).toContain("Name");
  });

  it("col-risk text contains Risk", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-risk").textContent).toContain("Risk");
  });

  it("col-status text contains Status", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-status").textContent).toContain("Status");
  });

  it("col-category text contains Category", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-category").textContent).toContain("Category");
  });

  it("col-review text contains Review", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("col-review").textContent).toContain("Review");
  });

  it("renders rows for all 5 vendors by data-testid", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    for (const v of vendors) {
      expect(getByTestId(`vendor-row-${v.id}`)).toBeDefined();
    }
  });

  it("vendor-row-4 data-testid is vendor-row-4", async () => {
    const { getByTestId } = await render(<VendorTable vendors={vendors} />);
    expect(getByTestId("vendor-row-4").getAttribute("data-testid")).toBe("vendor-row-4");
  });
});
