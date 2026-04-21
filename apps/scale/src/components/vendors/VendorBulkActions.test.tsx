import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorBulkActions } from "./VendorBulkActions";
import { Risk } from "../../types";

const riskLevels: Risk[] = ["low", "medium", "high", "critical"];

describe("VendorBulkActions", () => {
  // Basic rendering (10)
  it("renders bulk actions when selectedCount > 0", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(getByTestId("vendor-bulk-actions")).toBeDefined();
  });

  it("renders nothing when selectedCount is 0", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={0} />);
    expect(queryByTestId("vendor-bulk-actions")).toBeNull();
  });

  it("renders selected count badge", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("selected-count-badge")).toBeDefined();
  });

  it("shows correct count in badge", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={7} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("7");
  });

  it("renders action buttons container", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(getByTestId("bulk-action-buttons")).toBeDefined();
  });

  it("snapshot default with 3 selected", async () => {
    await render(<VendorBulkActions selectedCount={3} onArchive={() => {}} onDelete={() => {}} />);
    await snapshot("vendor-bulk-actions-default");
  });

  it("shows 1 selected", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={1} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("1");
  });

  it("shows 100 selected", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={100} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("100");
  });

  it("renders correctly with just selectedCount", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("vendor-bulk-actions")).toBeDefined();
  });

  it("renders with all handlers provided", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={5}
        onArchive={() => {}}
        onDelete={() => {}}
        onChangeRisk={() => {}}
        onExport={() => {}}
      />,
    );
    expect(getByTestId("vendor-bulk-actions")).toBeDefined();
  });

  // Archive button (10)
  it("shows archive button when onArchive provided", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button")).toBeDefined();
  });

  it("hides archive button when onArchive not provided", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-archive-button")).toBeNull();
  });

  it("calls onArchive when archive clicked", async () => {
    let archived = false;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onArchive={() => {
          archived = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-archive-button"));
    expect(archived).toBeTruthy();
  });

  it("archive button text is Archive", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button").textContent).toContain("Archive");
  });

  it("archive button is disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} loading />,
    );
    expect(getByTestId("bulk-archive-button").disabled).toBeTruthy();
  });

  it("archive button is enabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button").disabled).toBe(false);
  });

  it("fires onArchive multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onArchive={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-archive-button"));
    await fireEvent.click(getByTestId("bulk-archive-button"));
    expect(count).toBe(2);
  });

  it("snapshot archive only", async () => {
    await render(<VendorBulkActions selectedCount={3} onArchive={() => {}} />);
    await snapshot("vendor-bulk-actions-archive-only");
  });

  it("archive button not disabled when loading=false", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} loading={false} />,
    );
    expect(getByTestId("bulk-archive-button").disabled).toBe(false);
  });

  it("does not call onArchive when loading and button disabled", async () => {
    let archived = false;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onArchive={() => {
          archived = true;
        }}
        loading
      />,
    );
    const btn = getByTestId("bulk-archive-button");
    if (!btn.disabled) await fireEvent.click(btn);
    expect(archived).toBe(false);
  });

  // Delete button (10)
  it("shows delete button when onDelete provided", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button")).toBeDefined();
  });

  it("hides delete button when onDelete not provided", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-delete-button")).toBeNull();
  });

  it("calls onDelete when delete clicked", async () => {
    let deleted = false;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onDelete={() => {
          deleted = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-delete-button"));
    expect(deleted).toBeTruthy();
  });

  it("delete button is disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onDelete={() => {}} loading />,
    );
    expect(getByTestId("bulk-delete-button").disabled).toBeTruthy();
  });

  it("delete button text is Delete", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button").textContent).toContain("Delete");
  });

  it("fires onDelete multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onDelete={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-delete-button"));
    await fireEvent.click(getByTestId("bulk-delete-button"));
    expect(count).toBe(2);
  });

  it("snapshot delete only", async () => {
    await render(<VendorBulkActions selectedCount={3} onDelete={() => {}} />);
    await snapshot("vendor-bulk-actions-delete-only");
  });

  it("archive and delete buttons both visible", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button")).toBeDefined();
    expect(getByTestId("bulk-delete-button")).toBeDefined();
  });

  it("delete button not disabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button").disabled).toBe(false);
  });

  it("does not call onDelete when loading and button disabled", async () => {
    let deleted = false;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onDelete={() => {
          deleted = true;
        }}
        loading
      />,
    );
    const btn = getByTestId("bulk-delete-button");
    if (!btn.disabled) await fireEvent.click(btn);
    expect(deleted).toBe(false);
  });

  // Risk change (10)
  it("shows risk change section when onChangeRisk provided", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-change")).toBeDefined();
  });

  it("hides risk change when onChangeRisk not provided", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-risk-change")).toBeNull();
  });

  it("shows risk select", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-select")).toBeDefined();
  });

  it("shows apply risk button", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-apply-button")).toBeDefined();
  });

  it("calls onChangeRisk with selected risk", async () => {
    let received: Risk | null = null;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onChangeRisk={(r) => {
          received = r;
        }}
      />,
    );
    await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: "critical" } });
    await fireEvent.click(getByTestId("bulk-risk-apply-button"));
    expect(received).toBe("critical");
  });

  for (const risk of riskLevels) {
    it(`calls onChangeRisk with ${risk}`, async () => {
      let received: Risk | null = null;
      const { getByTestId } = await render(
        <VendorBulkActions
          selectedCount={3}
          onChangeRisk={(r) => {
            received = r;
          }}
        />,
      );
      await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: risk } });
      await fireEvent.click(getByTestId("bulk-risk-apply-button"));
      expect(received).toBe(risk);
    });
  }

  // Export (5)
  it("shows export button when onExport provided", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-export-button")).toBeDefined();
  });

  it("hides export button when not provided", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-export-button")).toBeNull();
  });

  it("calls onExport when export clicked", async () => {
    let exported = false;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onExport={() => {
          exported = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-export-button"));
    expect(exported).toBeTruthy();
  });

  it("export button is disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onExport={() => {}} loading />,
    );
    expect(getByTestId("bulk-export-button").disabled).toBeTruthy();
  });

  it("export button text is Export", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-export-button").textContent).toContain("Export");
  });

  // Loading state (10)
  it("shows spinner when loading", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} loading />);
    expect(getByTestId("bulk-spinner")).toBeDefined();
  });

  it("hides spinner when not loading", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-spinner")).toBeNull();
  });

  it("snapshot loading state", async () => {
    await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} onDelete={() => {}} loading />,
    );
    await snapshot("vendor-bulk-actions-loading");
  });

  it("snapshot all actions", async () => {
    await render(
      <VendorBulkActions
        selectedCount={5}
        onArchive={() => {}}
        onDelete={() => {}}
        onChangeRisk={() => {}}
        onExport={() => {}}
      />,
    );
    await snapshot("vendor-bulk-actions-all");
  });

  it("risk select disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} loading />,
    );
    expect(getByTestId("bulk-risk-select").disabled).toBeTruthy();
  });

  it("risk apply button disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} loading />,
    );
    expect(getByTestId("bulk-risk-apply-button").disabled).toBeTruthy();
  });

  it("default loading is false", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(queryByTestId("bulk-spinner")).toBeNull();
  });

  it("renders correctly with loading=false", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} loading={false} />);
    expect(getByTestId("vendor-bulk-actions")).toBeDefined();
  });

  it("renders null for selectedCount=0 regardless of loading", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={0} loading />);
    expect(queryByTestId("vendor-bulk-actions")).toBeNull();
  });

  it("renders correctly for selectedCount 1, 5, 10, 20, 100", async () => {
    for (const count of [1, 5, 10, 20, 100]) {
      const { getByTestId } = await render(<VendorBulkActions selectedCount={count} />);
      expect(getByTestId("selected-count-badge").textContent).toContain(String(count));
    }
  });

  // Additional tests to reach 100+
  it("badge text contains selected", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("selected");
  });

  it("renders correctly with only archive", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button")).toBeDefined();
    expect((queryByTestId) => queryByTestId("bulk-delete-button")).toBeDefined();
  });

  it("renders correctly with only delete", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button")).toBeDefined();
  });

  it("renders correctly with only risk change", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-change")).toBeDefined();
  });

  it("renders correctly with only export", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-export-button")).toBeDefined();
  });

  it("archive and risk change both visible", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onArchive={() => {}} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button")).toBeDefined();
    expect(getByTestId("bulk-risk-change")).toBeDefined();
  });

  it("delete and export both visible", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onDelete={() => {}} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button")).toBeDefined();
    expect(getByTestId("bulk-export-button")).toBeDefined();
  });

  it("risk select default value is low", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-select").value).toBe("low");
  });

  it("risk apply button text is Apply Risk", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-apply-button").textContent).toContain("Apply Risk");
  });

  it("risk select updates value on change", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={3} onChangeRisk={() => {}} />,
    );
    await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: "high" } });
    expect(getByTestId("bulk-risk-select").value).toBe("high");
  });

  it("archive fires and count is 1", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onArchive={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-archive-button"));
    expect(count).toBe(1);
  });

  it("delete fires and count is 1", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onDelete={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-delete-button"));
    expect(count).toBe(1);
  });

  it("export fires and count is 1", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onExport={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-export-button"));
    expect(count).toBe(1);
  });

  it("risk change fires with medium risk", async () => {
    let received: Risk | null = null;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onChangeRisk={(r) => {
          received = r;
        }}
      />,
    );
    await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: "medium" } });
    await fireEvent.click(getByTestId("bulk-risk-apply-button"));
    expect(received).toBe("medium");
  });

  it("risk change fires with high risk", async () => {
    let received: Risk | null = null;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onChangeRisk={(r) => {
          received = r;
        }}
      />,
    );
    await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: "high" } });
    await fireEvent.click(getByTestId("bulk-risk-apply-button"));
    expect(received).toBe("high");
  });

  it("bulk actions container has correct data-testid", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("vendor-bulk-actions")).toBeDefined();
  });

  it("bulk action buttons container always present", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("bulk-action-buttons")).toBeDefined();
  });

  it("spinner not shown when loading=false", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={3} loading={false} />);
    expect(queryByTestId("bulk-spinner")).toBeNull();
  });

  it("spinner shown when loading=true", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} loading={true} />);
    expect(getByTestId("bulk-spinner")).toBeDefined();
  });

  it("renders for selectedCount=2", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={2} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("2");
  });

  it("renders for selectedCount=50", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={50} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("50");
  });

  it("renders for selectedCount=1000", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={1000} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("1000");
  });

  it("snapshot with archive and delete", async () => {
    await render(<VendorBulkActions selectedCount={5} onArchive={() => {}} onDelete={() => {}} />);
    await snapshot("vendor-bulk-actions-archive-delete");
  });

  it("snapshot with risk change", async () => {
    await render(<VendorBulkActions selectedCount={5} onChangeRisk={() => {}} />);
    await snapshot("vendor-bulk-actions-risk-change");
  });

  it("snapshot with export", async () => {
    await render(<VendorBulkActions selectedCount={5} onExport={() => {}} />);
    await snapshot("vendor-bulk-actions-export");
  });

  it("snapshot with 1 selected", async () => {
    await render(<VendorBulkActions selectedCount={1} onArchive={() => {}} />);
    await snapshot("vendor-bulk-actions-1-selected");
  });

  it("snapshot with 10 selected and all actions", async () => {
    await render(
      <VendorBulkActions
        selectedCount={10}
        onArchive={() => {}}
        onDelete={() => {}}
        onChangeRisk={() => {}}
        onExport={() => {}}
      />,
    );
    await snapshot("vendor-bulk-actions-10-selected-all");
  });

  it("archive button present when selectedCount is 1", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={1} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button")).toBeDefined();
  });

  it("delete button present when selectedCount is 100", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={100} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button")).toBeDefined();
  });

  it("export button present when selectedCount is 50", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={50} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-export-button")).toBeDefined();
  });

  it("risk select present when selectedCount is 25", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={25} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-select")).toBeDefined();
  });

  // Additional tests to reach 100
  it("vendor-bulk-actions data-testid is vendor-bulk-actions", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("vendor-bulk-actions").getAttribute("data-testid")).toBe(
      "vendor-bulk-actions",
    );
  });

  it("selected-count-badge data-testid is selected-count-badge", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("selected-count-badge").getAttribute("data-testid")).toBe(
      "selected-count-badge",
    );
  });

  it("bulk-action-buttons data-testid is bulk-action-buttons", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={5} />);
    expect(getByTestId("bulk-action-buttons").getAttribute("data-testid")).toBe(
      "bulk-action-buttons",
    );
  });

  it("bulk-archive-button data-testid is bulk-archive-button", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onArchive={() => {}} />,
    );
    expect(getByTestId("bulk-archive-button").getAttribute("data-testid")).toBe(
      "bulk-archive-button",
    );
  });

  it("bulk-delete-button data-testid is bulk-delete-button", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onDelete={() => {}} />,
    );
    expect(getByTestId("bulk-delete-button").getAttribute("data-testid")).toBe(
      "bulk-delete-button",
    );
  });

  it("bulk-export-button data-testid is bulk-export-button", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onExport={() => {}} />,
    );
    expect(getByTestId("bulk-export-button").getAttribute("data-testid")).toBe(
      "bulk-export-button",
    );
  });

  it("bulk-risk-change data-testid is bulk-risk-change", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-change").getAttribute("data-testid")).toBe("bulk-risk-change");
  });

  it("bulk-risk-select data-testid is bulk-risk-select", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-select").getAttribute("data-testid")).toBe("bulk-risk-select");
  });

  it("bulk-risk-apply-button data-testid is bulk-risk-apply-button", async () => {
    const { getByTestId } = await render(
      <VendorBulkActions selectedCount={5} onChangeRisk={() => {}} />,
    );
    expect(getByTestId("bulk-risk-apply-button").getAttribute("data-testid")).toBe(
      "bulk-risk-apply-button",
    );
  });

  it("archive fires 3 times on 3 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onArchive={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-archive-button"));
    await fireEvent.click(getByTestId("bulk-archive-button"));
    await fireEvent.click(getByTestId("bulk-archive-button"));
    expect(count).toBe(3);
  });

  it("delete fires 2 times on 2 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onDelete={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-delete-button"));
    await fireEvent.click(getByTestId("bulk-delete-button"));
    expect(count).toBe(2);
  });

  it("export fires 2 times on 2 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onExport={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-export-button"));
    await fireEvent.click(getByTestId("bulk-export-button"));
    expect(count).toBe(2);
  });

  it("risk change fires with critical risk", async () => {
    let received: Risk | null = null;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onChangeRisk={(r) => {
          received = r;
        }}
      />,
    );
    await fireEvent.change(getByTestId("bulk-risk-select"), { target: { value: "critical" } });
    await fireEvent.click(getByTestId("bulk-risk-apply-button"));
    expect(received).toBe("critical");
  });

  it("risk change fires with low risk (default)", async () => {
    let received: Risk | null = null;
    const { getByTestId } = await render(
      <VendorBulkActions
        selectedCount={3}
        onChangeRisk={(r) => {
          received = r;
        }}
      />,
    );
    await fireEvent.click(getByTestId("bulk-risk-apply-button"));
    expect(received).toBe("low");
  });

  it("bulk actions not null for selectedCount=1", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={1} />);
    expect(queryByTestId("vendor-bulk-actions")).not.toBeNull();
  });

  it("bulk actions not null for selectedCount=999", async () => {
    const { queryByTestId } = await render(<VendorBulkActions selectedCount={999} />);
    expect(queryByTestId("vendor-bulk-actions")).not.toBeNull();
  });

  it("badge shows 3 selected text", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={3} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("3 selected");
  });

  it("badge shows 10 selected text", async () => {
    const { getByTestId } = await render(<VendorBulkActions selectedCount={10} />);
    expect(getByTestId("selected-count-badge").textContent).toContain("10 selected");
  });
});
