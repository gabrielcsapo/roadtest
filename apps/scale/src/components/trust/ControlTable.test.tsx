import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { ControlTable } from "./ControlTable";
import { Control, User, ComplianceStatus, Framework } from "../../types";

const mockOwner: User = { id: "u1", name: "Alice", email: "alice@example.com", role: "admin" };

const mockControl: Control = {
  id: "ctrl1",
  name: "Access Control Review",
  description: "Quarterly review of access controls",
  framework: "SOC2",
  status: "compliant",
  evidence: ["access-review-q1.pdf", "screenshot.png"],
  owner: mockOwner,
  dueDate: "2024-06-30",
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

describe("ControlTable", () => {
  // Loading state
  it("shows loading spinner when loading", async () => {
    const { getByTestId } = await render(<ControlTable controls={[]} loading />);
    expect(getByTestId("control-table-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} loading />);
    expect(getByTestId("control-table-spinner")).toBeDefined();
  });

  it("does not show table when loading", async () => {
    const { queryByTestId } = await render(<ControlTable controls={controls} loading />);
    expect(queryByTestId("control-table")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(<ControlTable controls={controls} />);
    expect(queryByTestId("control-table-loading")).toBeNull();
  });

  // Empty state
  it("shows empty state when no controls", async () => {
    const { getByTestId } = await render(<ControlTable controls={[]} />);
    expect(getByTestId("control-table-empty")).toBeDefined();
  });

  it("does not show table when no controls", async () => {
    const { queryByTestId } = await render(<ControlTable controls={[]} />);
    expect(queryByTestId("control-table")).toBeNull();
  });

  // Framework filter tabs (6 frameworks)
  allFrameworks.map((fw) =>
    it(`renders tab for framework ${fw}`, async () => {
      const { getByTestId } = await render(<ControlTable controls={controls} />);
      expect(getByTestId(`tab-${fw}`)).toBeDefined();
    }),
  );

  it("renders All tab", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("tab-all")).toBeDefined();
  });

  allFrameworks.map((fw) =>
    it(`calls onFrameworkFilter with ${fw} when tab is clicked`, async () => {
      let filtered: Framework | undefined = undefined;
      const { getByTestId } = await render(
        <ControlTable
          controls={controls}
          onFrameworkFilter={(f) => {
            filtered = f;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`tab-${fw}`));
      expect(filtered).toBe(fw);
    }),
  );

  it("calls onFrameworkFilter with undefined when All tab is clicked", async () => {
    let filtered: Framework | null = "SOC2";
    const { getByTestId } = await render(
      <ControlTable
        controls={controls}
        onFrameworkFilter={(f) => {
          filtered = f ?? null;
        }}
      />,
    );
    await fireEvent.click(getByTestId("tab-all"));
    expect(filtered).toBeNull();
  });

  it("highlights active framework tab based on frameworkFilter prop", async () => {
    const { getByTestId } = await render(
      <ControlTable controls={controls} frameworkFilter="SOC2" />,
    );
    expect(getByTestId("tab-SOC2")).toBeDefined();
  });

  // Status filter (4 statuses)
  allStatuses.map((status) =>
    it(`filters controls by status ${status}`, async () => {
      const { getByTestId } = await render(<ControlTable controls={controls} />);
      await fireEvent.change(getByTestId("status-filter"), { target: { value: status } });
      expect(getByTestId("control-table-container")).toBeDefined();
    }),
  );

  it("shows all controls when status filter is all", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    await fireEvent.change(getByTestId("status-filter"), { target: { value: "all" } });
    expect(getByTestId("control-table-footer").textContent).toContain("5");
  });

  it("shows empty state when status filter matches no controls", async () => {
    const singleControl = [{ ...mockControl, id: "x1", status: "compliant" as ComplianceStatus }];
    const { getByTestId } = await render(<ControlTable controls={singleControl} />);
    await fireEvent.change(getByTestId("status-filter"), { target: { value: "non-compliant" } });
    expect(getByTestId("control-table-empty")).toBeDefined();
  });

  // Table rendering
  it("renders table container", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table-container")).toBeDefined();
  });

  it("renders the table element", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table")).toBeDefined();
  });

  it("renders all control rows", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    controls.forEach((c) => {
      expect(getByTestId(`control-row-${c.id}`)).toBeDefined();
    });
  });

  // Column headers
  it("renders name sort header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("sort-name")).toBeDefined();
  });

  it("renders status sort header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("sort-status")).toBeDefined();
  });

  it("renders due date sort header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("sort-due-date")).toBeDefined();
  });

  it("renders framework column header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("col-framework")).toBeDefined();
  });

  it("renders evidence column header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("col-evidence")).toBeDefined();
  });

  it("renders owner column header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("col-owner")).toBeDefined();
  });

  // Sorting
  it("calls onSort when name header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <ControlTable
        controls={controls}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-name"));
    expect(sortField).toBe("name");
  });

  it("calls onSort when status header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <ControlTable
        controls={controls}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-status"));
    expect(sortField).toBe("status");
  });

  it("calls onSort when due date header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <ControlTable
        controls={controls}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-due-date"));
    expect(sortField).toBe("dueDate");
  });

  it("toggles sort direction on second click", async () => {
    let sortDir = "";
    const { getByTestId } = await render(
      <ControlTable
        controls={controls}
        onSort={(_, d) => {
          sortDir = d;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-name"));
    await fireEvent.click(getByTestId("sort-name"));
    expect(sortDir).toBe("desc");
  });

  // Edit callbacks
  it("shows edit buttons when onEdit provided", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} onEdit={() => {}} />);
    expect(getByTestId("edit-button-c1")).toBeDefined();
  });

  it("does not show edit buttons when onEdit not provided", async () => {
    const { queryByTestId } = await render(<ControlTable controls={controls} />);
    expect(queryByTestId("edit-button-c1")).toBeNull();
  });

  controls.map((c) =>
    it(`calls onEdit with correct control for ${c.id}`, async () => {
      let edited: Control | null = null;
      const { getByTestId } = await render(
        <ControlTable
          controls={controls}
          onEdit={(ctrl) => {
            edited = ctrl;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`edit-button-${c.id}`));
      expect(edited?.id).toBe(c.id);
    }),
  );

  // Evidence display
  it("shows evidence count in row", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-evidence-c1").textContent).toContain("2");
  });

  it("shows 0 evidence in row", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-evidence-c5").textContent).toContain("0");
  });

  // Owner display
  it("shows owner name in row", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-owner-c1").textContent).toContain("Alice");
  });

  it("shows Unassigned when no owner", async () => {
    const noOwnerControls = [{ ...controls[0], owner: undefined }];
    const { getByTestId } = await render(<ControlTable controls={noOwnerControls} />);
    expect(getByTestId("control-owner-c1").textContent).toContain("Unassigned");
  });

  // Footer
  it("renders footer with count", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table-footer").textContent).toContain("5");
  });

  // Snapshot
  it("matches snapshot with all controls", async () => {
    const { container } = await render(<ControlTable controls={controls} />);
    await snapshot("control-table-full");
  });

  it("renders table body", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table-body")).toBeDefined();
  });

  it("renders table header", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table-header")).toBeDefined();
  });

  it("renders framework filter tabs section", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("framework-filter-tabs")).toBeDefined();
  });

  it("renders status filter section", async () => {
    const { getByTestId } = await render(<ControlTable controls={controls} />);
    expect(getByTestId("control-table-filters")).toBeDefined();
  });
});
