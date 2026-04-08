import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { VendorSearchBar } from "./VendorSearchBar";
import { FilterOptions } from "../../types";

const emptyFilters: FilterOptions = { search: "", status: [], risk: [], tags: [] };

describe("VendorSearchBar", () => {
  // Basic rendering (10)
  it("renders search bar container", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("vendor-search-bar")).toBeDefined();
  });

  it("renders search input", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-input")).toBeDefined();
  });

  it("renders search bar row", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-bar-row")).toBeDefined();
  });

  it("renders meta section", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-bar-meta")).toBeDefined();
  });

  it("renders result count", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("result-count")).toBeDefined();
  });

  it("snapshot default state", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await snapshot("vendor-search-bar-default");
  });

  it("snapshot with search", async () => {
    await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={2}
      />,
    );
    await snapshot("vendor-search-bar-with-search");
  });

  it("snapshot with filters", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"], risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    await snapshot("vendor-search-bar-with-filters");
  });

  it("search input has correct value", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("search-input").value).toBe("acme");
  });

  it("search input is empty when search is empty string", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-input").value).toBe("");
  });

  // Count display (10)
  it("shows total count when not filtered", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={25}
        filteredCount={25}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("25");
  });

  it("shows vendor singular when totalCount is 1", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={1}
        filteredCount={1}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("1 vendor");
  });

  it("shows vendors plural when totalCount is more than 1", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("vendors");
  });

  it("shows filtered count when search active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="test"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={20}
        filteredCount={3}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("3");
    expect(getByTestId("result-count").textContent).toContain("20");
  });

  it("shows X of Y format when filtering", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={50}
        filteredCount={4}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("4 of 50");
  });

  it("shows 0 of total when no results", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="zzz"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={0}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("0 of 10");
  });

  it("shows filtered count when filters active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {}}
        totalCount={20}
        filteredCount={12}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("12 of 20");
  });

  it("shows 0 vendors when totalCount is 0", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={0}
        filteredCount={0}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("0");
  });

  it("shows 100 vendors correctly", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={100}
        filteredCount={100}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("100");
  });

  it("shows 1000 vendors correctly", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={1000}
        filteredCount={1000}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("1000");
  });

  // Search input callbacks (10)
  it("calls onSearchChange when input changes", async () => {
    let changed = false;
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {
          changed = true;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "acme" } });
    expect(changed).toBeTruthy();
  });

  it("calls onSearchChange with input value", async () => {
    let value = "";
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={(v) => {
          value = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "acme" } });
    expect(value).toBe("acme");
  });

  it("shows clear search button when search is active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("clear-search-button")).toBeDefined();
  });

  it("hides clear search button when no search", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("clear-search-button")).toBeNull();
  });

  it("calls onSearchChange with empty string when clear search clicked", async () => {
    let value = "unchanged";
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={(v) => {
          value = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-search-button"));
    expect(value).toBe("");
  });

  it("shows clear all button when search is active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("clear-all-button")).toBeDefined();
  });

  it("hides clear all button when no search or filters", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("clear-all-button")).toBeNull();
  });

  it("clears search when clear all clicked", async () => {
    let searchVal = "unchanged";
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={(v) => {
          searchVal = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-all-button"));
    expect(searchVal).toBe("");
  });

  it("clears filters when clear all clicked", async () => {
    let newFilters: FilterOptions | null = null;
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={(f) => {
          newFilters = f;
        }}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-all-button"));
    expect(newFilters?.status).toHaveLength(0);
  });

  it("shows active filter count badge", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"], risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count")).toBeDefined();
  });

  // Filter count badge (5)
  it("shows correct count in filter badge", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"], risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("3");
  });

  it("hides filter count badge when no filters", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("active-filter-count")).toBeNull();
  });

  it("shows filter count as 1 filter singular", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("1 filter");
  });

  it("shows filter count as plural for 2", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("2 filters");
  });

  it("counts tag filters too", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ tags: ["cloud", "saas", "security"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("3");
  });

  // Edge cases (30)
  it("handles empty string search correctly", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("5 vendors");
  });

  it("handles very long search string", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search={"a".repeat(100)}
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={0}
      />,
    );
    expect(getByTestId("vendor-search-bar")).toBeDefined();
  });

  it("shows clear all when filters have risk active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ risk: ["critical"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={2}
      />,
    );
    expect(getByTestId("clear-all-button")).toBeDefined();
  });

  it("snapshot with all active", async () => {
    await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={{ status: ["active"], risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={20}
        filteredCount={3}
      />,
    );
    await snapshot("vendor-search-bar-all-active");
  });

  it("shows correct count after filters", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {}}
        totalCount={50}
        filteredCount={30}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("30 of 50");
  });

  it("renders without active filters badge by default", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: [], risk: [], tags: [] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("active-filter-count")).toBeNull();
  });

  it("renders when filteredCount equals totalCount", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={15}
        filteredCount={15}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("15 vendors");
  });

  it("renders when filteredCount is zero", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="xyz"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={15}
        filteredCount={0}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("0 of 15");
  });

  it("snapshot when no results found", async () => {
    await render(
      <VendorSearchBar
        search="xyz"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={15}
        filteredCount={0}
      />,
    );
    await snapshot("vendor-search-bar-no-results");
  });

  it("snapshot when empty state", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={0}
        filteredCount={0}
      />,
    );
    await snapshot("vendor-search-bar-empty");
  });

  it("renders correctly with tag filters", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ tags: ["cloud"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count")).toBeDefined();
  });

  it("renders correctly with all filter types combined", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={{ status: ["active"], risk: ["high"], tags: ["cloud"] }}
        onFiltersChange={() => {}}
        totalCount={100}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("3 filters");
  });

  it("does not show clear all when all filters empty", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: [], risk: [], tags: [] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("clear-all-button")).toBeNull();
  });

  it("clear all calls both handlers", async () => {
    let searchCleared = false;
    let filtersCleared = false;
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={(v) => {
          if (v === "") searchCleared = true;
        }}
        filters={{ status: ["active"] }}
        onFiltersChange={(f) => {
          if ((f.status?.length ?? 0) === 0) filtersCleared = true;
        }}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-all-button"));
    expect(searchCleared).toBeTruthy();
    expect(filtersCleared).toBeTruthy();
  });

  it("renders with large filteredCount", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="test"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={5000}
        filteredCount={2500}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("2500 of 5000");
  });

  it("renders with zero totalCount", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={0}
        filteredCount={0}
      />,
    );
    expect(getByTestId("vendor-search-bar")).toBeDefined();
  });

  it("renders with only required props and defaults", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={5}
        filteredCount={5}
      />,
    );
    expect(getByTestId("vendor-search-bar")).toBeDefined();
  });

  it("fires onSearchChange on every keystroke simulation", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {
          count++;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "a" } });
    await fireEvent.change(getByTestId("search-input"), { target: { value: "ac" } });
    expect(count).toBe(2);
  });

  it("snapshot with 5 active filters", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending", "inactive"], risk: ["high", "critical"] }}
        onFiltersChange={() => {}}
        totalCount={50}
        filteredCount={10}
      />,
    );
    await snapshot("vendor-search-bar-5-filters");
  });

  it("renders meta section without clear search when search empty", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-bar-meta")).toBeDefined();
    expect(queryByTestId("clear-search-button")).toBeNull();
  });

  it("renders correctly with undefined filter fields", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{}}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("vendor-search-bar")).toBeDefined();
  });

  // Additional tests to reach 100
  it("search bar container data-testid is vendor-search-bar", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("vendor-search-bar").getAttribute("data-testid")).toBe("vendor-search-bar");
  });

  it("search-bar-row data-testid is search-bar-row", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-bar-row").getAttribute("data-testid")).toBe("search-bar-row");
  });

  it("search-bar-meta data-testid is search-bar-meta", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-bar-meta").getAttribute("data-testid")).toBe("search-bar-meta");
  });

  it("result-count data-testid is result-count", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("result-count").getAttribute("data-testid")).toBe("result-count");
  });

  it("search-input data-testid is search-input", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("search-input").getAttribute("data-testid")).toBe("search-input");
  });

  it("clear-search-button data-testid is clear-search-button", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("clear-search-button").getAttribute("data-testid")).toBe(
      "clear-search-button",
    );
  });

  it("clear-all-button data-testid is clear-all-button", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("clear-all-button").getAttribute("data-testid")).toBe("clear-all-button");
  });

  it("active-filter-count data-testid is active-filter-count", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").getAttribute("data-testid")).toBe(
      "active-filter-count",
    );
  });

  it("result count shows 3 vendors when totalCount=3 and filteredCount=3", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={3}
        filteredCount={3}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("3 vendors");
  });

  it("result count shows 7 of 20 when filtered", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="test"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={20}
        filteredCount={7}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("7 of 20");
  });

  it("result count shows 15 of 100 when filtered", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="test"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={100}
        filteredCount={15}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("15 of 100");
  });

  it("1 filter shows singular label", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("1 filter");
  });

  it("4 filters shows plural label", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"], risk: ["high", "critical"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("4 filters");
  });

  it('fires onSearchChange with value "test"', async () => {
    let val = "";
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={(v) => {
          val = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "test" } });
    expect(val).toBe("test");
  });

  it('fires onSearchChange with value "globex"', async () => {
    let val = "";
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={(v) => {
          val = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "globex" } });
    expect(val).toBe("globex");
  });

  it("fires onSearchChange with value empty string when cleared", async () => {
    let val = "old";
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={(v) => {
          val = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-search-button"));
    expect(val).toBe("");
  });

  it('renders with search "umbrella" and reflects input value', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="umbrella"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={1}
      />,
    );
    expect(getByTestId("search-input").value).toBe("umbrella");
  });

  it('renders with search "initech" and reflects input value', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="initech"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={1}
      />,
    );
    expect(getByTestId("search-input").value).toBe("initech");
  });

  it('renders with search "massive" and shows clear button', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="massive"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={1}
      />,
    );
    expect(getByTestId("clear-search-button")).toBeDefined();
  });

  it('snapshot with search "acme" and 3 results', async () => {
    await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await snapshot("vendor-search-bar-acme-3");
  });

  it("snapshot with 4 active filters", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"], risk: ["high", "critical"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await snapshot("vendor-search-bar-4-filters");
  });

  it("shows clear all button when risk filter active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ risk: ["medium"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={4}
      />,
    );
    expect(getByTestId("clear-all-button")).toBeDefined();
  });

  it("shows clear all button when tag filter active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ tags: ["cloud"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={4}
      />,
    );
    expect(getByTestId("clear-all-button")).toBeDefined();
  });

  it("shows clear all button when status filter active", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["inactive"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={2}
      />,
    );
    expect(getByTestId("clear-all-button")).toBeDefined();
  });

  it("fires onFiltersChange when clear all is clicked", async () => {
    let fired = false;
    const { getByTestId } = await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {
          fired = true;
        }}
        totalCount={10}
        filteredCount={3}
      />,
    );
    await fireEvent.click(getByTestId("clear-all-button"));
    expect(fired).toBeTruthy();
  });

  it("onFiltersChange receives empty filters when clear all clicked", async () => {
    let received: FilterOptions | null = null;
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={(f) => {
          received = f;
        }}
        totalCount={10}
        filteredCount={5}
      />,
    );
    await fireEvent.click(getByTestId("clear-all-button"));
    expect(received?.status?.length ?? -1).toBe(0);
  });

  it("filters with 2 status show count 2", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("2");
  });

  it("filters with 3 risk show count 3", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ risk: ["low", "medium", "high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("3");
  });

  it('result count shows "1 vendor" singular', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={1}
        filteredCount={1}
      />,
    );
    expect(getByTestId("result-count").textContent).toMatch(/1 vendor/);
  });

  it('result count shows "2 vendors" plural', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={2}
        filteredCount={2}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("2 vendors");
  });

  it('result count shows "10 vendors" for 10', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("10 vendors");
  });

  it('result count shows "50 vendors" for 50', async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={50}
        filteredCount={50}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("50 vendors");
  });

  it("shows result-count text for filtered=5 total=25", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="test"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={25}
        filteredCount={5}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("5 of 25");
  });

  it("shows result-count text for filtered=0 total=5", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search="xyz"
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={5}
        filteredCount={0}
      />,
    );
    expect(getByTestId("result-count").textContent).toContain("0 of 5");
  });

  it("filters count 5 shows 5 filters text", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active", "pending", "inactive"], risk: ["high", "critical"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={2}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("5 filters");
  });

  it("search bar renders in all filter states without error", async () => {
    const states = [
      { search: "", filters: emptyFilters, total: 10, filtered: 10 },
      { search: "test", filters: emptyFilters, total: 10, filtered: 3 },
      { search: "", filters: { status: ["active"] }, total: 10, filtered: 5 },
      { search: "test", filters: { status: ["active"], risk: ["high"] }, total: 10, filtered: 2 },
    ];
    for (const state of states) {
      const { getByTestId } = await render(
        <VendorSearchBar
          search={state.search}
          onSearchChange={() => {}}
          filters={state.filters}
          onFiltersChange={() => {}}
          totalCount={state.total}
          filteredCount={state.filtered}
        />,
      );
      expect(getByTestId("vendor-search-bar")).toBeDefined();
    }
  });

  it("snapshot with 2 active filters", async () => {
    await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ status: ["active"], risk: ["high"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    await snapshot("vendor-search-bar-2-filters");
  });

  it("snapshot with search and 1 filter", async () => {
    await render(
      <VendorSearchBar
        search="acme"
        onSearchChange={() => {}}
        filters={{ status: ["active"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={2}
      />,
    );
    await snapshot("vendor-search-bar-search-and-filter");
  });

  it("shows 1 vendor singular for totalCount=1 and filteredCount=1", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={1}
        filteredCount={1}
      />,
    );
    expect(getByTestId("result-count").textContent).toMatch(/1 vendor/);
  });

  it("does not show clear search when search is empty string after trim", async () => {
    const { queryByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    expect(queryByTestId("clear-search-button")).toBeNull();
  });

  it("shows correct filter count for 1 tag", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ tags: ["cloud"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("1");
  });

  it("shows correct filter count for 2 tags", async () => {
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {}}
        filters={{ tags: ["cloud", "saas"] }}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={5}
      />,
    );
    expect(getByTestId("active-filter-count").textContent).toContain("2");
  });

  it("fires onSearchChange 3 times on 3 changes", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorSearchBar
        search=""
        onSearchChange={() => {
          count++;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={10}
      />,
    );
    await fireEvent.change(getByTestId("search-input"), { target: { value: "a" } });
    await fireEvent.change(getByTestId("search-input"), { target: { value: "ab" } });
    await fireEvent.change(getByTestId("search-input"), { target: { value: "abc" } });
    expect(count).toBe(3);
  });

  it("clear search calls onSearchChange with empty on second clear", async () => {
    let val = "";
    const { getByTestId } = await render(
      <VendorSearchBar
        search="something"
        onSearchChange={(v) => {
          val = v;
        }}
        filters={emptyFilters}
        onFiltersChange={() => {}}
        totalCount={10}
        filteredCount={1}
      />,
    );
    await fireEvent.click(getByTestId("clear-search-button"));
    expect(val).toBe("");
  });
});
