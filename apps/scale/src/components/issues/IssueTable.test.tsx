import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { IssueTable } from "./IssueTable";
import { Issue, User, Risk } from "../../types";

const mockAssignee: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
};

const mockIssue: Issue = {
  id: "i1",
  title: "Missing MFA enforcement",
  description: "MFA is not enforced for admin accounts",
  severity: "high",
  status: "open",
  assignee: mockAssignee,
  dueDate: "2099-04-30",
  createdAt: "2024-03-01",
  framework: "SOC2",
};

const issues: Issue[] = [
  { ...mockIssue, id: "i1", severity: "critical", status: "open" },
  { ...mockIssue, id: "i2", severity: "high", status: "in-progress", title: "Unpatched systems" },
  { ...mockIssue, id: "i3", severity: "medium", status: "resolved", title: "Weak password policy" },
  {
    ...mockIssue,
    id: "i4",
    severity: "low",
    status: "wont-fix",
    title: "Missing audit log retention",
  },
  {
    ...mockIssue,
    id: "i5",
    severity: "high",
    status: "open",
    assignee: undefined,
    dueDate: undefined,
  },
];

const allSeverities: Risk[] = ["low", "medium", "high", "critical"];
const allStatuses = ["open", "in-progress", "resolved", "wont-fix"];

describe("IssueTable", () => {
  // Empty/loading states
  it("shows empty state when no issues", async () => {
    const { getByTestId } = await render(<IssueTable issues={[]} />);
    expect(getByTestId("issue-table-empty")).toBeDefined();
  });

  it("does not show table when no issues", async () => {
    const { queryByTestId } = await render(<IssueTable issues={[]} />);
    expect(queryByTestId("issue-table")).toBeNull();
  });

  it("shows loading spinner when loading", async () => {
    const { getByTestId } = await render(<IssueTable issues={[]} loading />);
    expect(getByTestId("issue-table-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} loading />);
    expect(getByTestId("issue-table-spinner")).toBeDefined();
  });

  it("does not show table when loading", async () => {
    const { queryByTestId } = await render(<IssueTable issues={issues} loading />);
    expect(queryByTestId("issue-table")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(<IssueTable issues={issues} />);
    expect(queryByTestId("issue-table-loading")).toBeNull();
  });

  // Table rendering
  it("renders table container", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table-container")).toBeDefined();
  });

  it("renders table when issues exist", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table")).toBeDefined();
  });

  it("renders all issue rows", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    issues.forEach((i) => {
      expect(getByTestId(`issue-row-${i.id}`)).toBeDefined();
    });
  });

  it("renders footer", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table-footer").textContent).toContain("5");
  });

  // Severity filter
  allSeverities.forEach((severity) =>
    it(`filters issues by severity ${severity}`, async () => {
      const { getByTestId } = await render(<IssueTable issues={issues} />);
      await fireEvent.change(getByTestId("severity-filter"), { target: { value: severity } });
      expect(getByTestId("issue-table-container")).toBeDefined();
    }),
  );

  it("shows all issues when severity filter is all", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    await fireEvent.change(getByTestId("severity-filter"), { target: { value: "all" } });
    expect(getByTestId("issue-table-footer").textContent).toContain("5");
  });

  it("filters to critical issues only", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    await fireEvent.change(getByTestId("severity-filter"), { target: { value: "critical" } });
    expect(getByTestId("issue-table-footer").textContent).toContain("1");
  });

  // Status filter
  allStatuses.map((status) =>
    it(`filters issues by status ${status}`, async () => {
      const { getByTestId } = await render(<IssueTable issues={issues} />);
      await fireEvent.change(getByTestId("status-filter"), { target: { value: status } });
      expect(getByTestId("issue-table-container")).toBeDefined();
    }),
  );

  it("shows all issues when status filter is all", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    await fireEvent.change(getByTestId("status-filter"), { target: { value: "all" } });
    expect(getByTestId("issue-table-footer").textContent).toContain("5");
  });

  it("filters to open issues only", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    await fireEvent.change(getByTestId("status-filter"), { target: { value: "open" } });
    expect(getByTestId("issue-table-footer").textContent).toContain("2");
  });

  // Sorting
  it("renders sortable title header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("sort-title")).toBeDefined();
  });

  it("renders sortable severity header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("sort-severity")).toBeDefined();
  });

  it("renders sortable status header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("sort-status")).toBeDefined();
  });

  it("renders sortable due date header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("sort-due-date")).toBeDefined();
  });

  it("calls onSort when title header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-title"));
    expect(sortField).toBe("title");
  });

  it("calls onSort when severity header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-severity"));
    expect(sortField).toBe("severity");
  });

  it("calls onSort when status header is clicked", async () => {
    let sortField = "";
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
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
      <IssueTable
        issues={issues}
        onSort={(f) => {
          sortField = f;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-due-date"));
    expect(sortField).toBe("dueDate");
  });

  it("toggles sort direction asc to desc", async () => {
    let dir = "";
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSort={(_, d) => {
          dir = d;
        }}
      />,
    );
    await fireEvent.click(getByTestId("sort-title"));
    await fireEvent.click(getByTestId("sort-title"));
    expect(dir).toBe("desc");
  });

  // Bulk selection
  it("shows select-all checkbox when onSelect provided", async () => {
    const { getByTestId } = await render(
      <IssueTable issues={issues} onSelect={() => {}} selectedIds={[]} />,
    );
    expect(getByTestId("select-all-checkbox")).toBeDefined();
  });

  it("calls onSelect with all ids when select-all is clicked", async () => {
    let selected: string[] = [];
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSelect={(ids) => {
          selected = ids;
        }}
        selectedIds={[]}
      />,
    );
    await fireEvent.click(getByTestId("select-all-checkbox"));
    expect(selected.length).toBe(5);
  });

  it("deselects all when select-all is unchecked", async () => {
    let selected = ["i1", "i2", "i3", "i4", "i5"];
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSelect={(ids) => {
          selected = ids;
        }}
        selectedIds={["i1", "i2", "i3", "i4", "i5"]}
      />,
    );
    await fireEvent.click(getByTestId("select-all-checkbox"));
    expect(selected.length).toBe(0);
  });

  issues.forEach((issue) =>
    it(`shows row checkbox for issue ${issue.id}`, async () => {
      const { getByTestId } = await render(
        <IssueTable issues={issues} onSelect={() => {}} selectedIds={[]} />,
      );
      expect(getByTestId(`select-checkbox-${issue.id}`)).toBeDefined();
    }),
  );

  it("selects single issue row", async () => {
    let selected: string[] = [];
    const { getByTestId } = await render(
      <IssueTable
        issues={issues}
        onSelect={(ids) => {
          selected = ids;
        }}
        selectedIds={[]}
      />,
    );
    await fireEvent.click(getByTestId("select-checkbox-i1"));
    expect(selected).toContain("i1");
  });

  // Resolve/dismiss callbacks
  it("shows resolve button for open issues", async () => {
    const { getByTestId } = await render(<IssueTable issues={[issues[0]]} onResolve={() => {}} />);
    expect(getByTestId("resolve-button-i1")).toBeDefined();
  });

  it("does not show resolve button for resolved issues", async () => {
    const { queryByTestId } = await render(
      <IssueTable issues={[issues[2]]} onResolve={() => {}} />,
    );
    expect(queryByTestId("resolve-button-i3")).toBeNull();
  });

  it("calls onResolve with correct issue", async () => {
    let resolved: Issue | null = null;
    const { getByTestId } = await render(
      <IssueTable
        issues={[issues[0]]}
        onResolve={(i) => {
          resolved = i;
        }}
      />,
    );
    await fireEvent.click(getByTestId("resolve-button-i1"));
    expect(resolved?.id).toBe("i1");
  });

  it("shows dismiss button when onDismiss provided", async () => {
    const { getByTestId } = await render(<IssueTable issues={[issues[0]]} onDismiss={() => {}} />);
    expect(getByTestId("dismiss-button-i1")).toBeDefined();
  });

  it("calls onDismiss with correct issue", async () => {
    let dismissed: Issue | null = null;
    const { getByTestId } = await render(
      <IssueTable
        issues={[issues[0]]}
        onDismiss={(i) => {
          dismissed = i;
        }}
      />,
    );
    await fireEvent.click(getByTestId("dismiss-button-i1"));
    expect(dismissed?.id).toBe("i1");
  });

  // Overdue highlighting
  it("marks overdue rows with data-overdue attribute", async () => {
    const overdueIssue = { ...mockIssue, id: "od1", dueDate: "2020-01-01" };
    const { getByTestId } = await render(<IssueTable issues={[overdueIssue]} />);
    expect(getByTestId("issue-row-od1").getAttribute("data-overdue")).toBe("true");
  });

  it("marks non-overdue rows with data-overdue false", async () => {
    const { getByTestId } = await render(
      <IssueTable issues={[{ ...mockIssue, id: "future", dueDate: "2099-01-01" }]} />,
    );
    expect(getByTestId("issue-row-future").getAttribute("data-overdue")).toBe("false");
  });

  // Assignment display
  it("shows assignee name in row", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-assignee-i1").textContent).toContain("Alice Johnson");
  });

  it("shows Unassigned when no assignee", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-assignee-i5").textContent).toContain("Unassigned");
  });

  // Column headers
  it("renders assignee column header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("col-assignee")).toBeDefined();
  });

  it("renders framework column header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("col-framework")).toBeDefined();
  });

  it("renders actions column when actions provided", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} onResolve={() => {}} />);
    expect(getByTestId("col-actions")).toBeDefined();
  });

  // Snapshot
  it("matches snapshot with all issues", async () => {
    const { container } = await render(<IssueTable issues={issues} />);
    await snapshot("issue-table-full");
  });

  it("renders filters section", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table-filters")).toBeDefined();
  });

  it("renders table body", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table-body")).toBeDefined();
  });

  it("renders table header", async () => {
    const { getByTestId } = await render(<IssueTable issues={issues} />);
    expect(getByTestId("issue-table-header")).toBeDefined();
  });
});
