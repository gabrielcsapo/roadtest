import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { ControlCard } from "./ControlCard";
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
  dueDate: "2099-06-30",
};

const controls: Control[] = [
  { ...mockControl, id: "c1", framework: "SOC2", status: "compliant" },
  { ...mockControl, id: "c2", framework: "ISO27001", status: "in-progress" },
  { ...mockControl, id: "c3", framework: "HIPAA", status: "non-compliant" },
  { ...mockControl, id: "c4", framework: "GDPR", status: "not-applicable" },
  { ...mockControl, id: "c5", framework: "PCI-DSS", status: "compliant", evidence: [] },
];

const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];
const allFrameworks: Framework[] = ["SOC2", "ISO27001", "HIPAA", "GDPR", "PCI-DSS", "FedRAMP"];

describe("ControlCard", () => {
  // All 5 controls render
  controls.map((c) =>
    it(`renders control card for ${c.id}`, async () => {
      const { getByTestId } = await render(<ControlCard control={c} />);
      expect(getByTestId("control-card")).toBeDefined();
    }),
  );

  // Control name and description
  it("shows control name", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("control-name").textContent).toContain("Access Control Review");
  });

  it("shows control description", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("control-description")).toBeDefined();
  });

  // Status badge for all 4 statuses
  allStatuses.map((status) =>
    it(`shows ${status} status badge`, async () => {
      const { getByTestId } = await render(<ControlCard control={{ ...mockControl, status }} />);
      expect(getByTestId("control-status-badge")).toBeDefined();
    }),
  );

  it("shows Compliant label", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, status: "compliant" }} />,
    );
    expect(getByTestId("control-status-badge").textContent).toContain("Compliant");
  });

  it("shows Non-Compliant label", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, status: "non-compliant" }} />,
    );
    expect(getByTestId("control-status-badge").textContent).toContain("Non-Compliant");
  });

  it("shows In Progress label", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, status: "in-progress" }} />,
    );
    expect(getByTestId("control-status-badge").textContent).toContain("In Progress");
  });

  it("shows Not Applicable label", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, status: "not-applicable" }} />,
    );
    expect(getByTestId("control-status-badge").textContent).toContain("Not Applicable");
  });

  // Framework × status combos (24 combos)
  allFrameworks.flatMap((fw) =>
    allStatuses.map((status) =>
      it(`renders ${fw} with ${status} status`, async () => {
        const { getByTestId } = await render(
          <ControlCard control={{ ...mockControl, framework: fw, status }} />,
        );
        expect(getByTestId("control-status-badge")).toBeDefined();
        expect(getByTestId("control-card")).toBeDefined();
      }),
    ),
  );

  // Evidence count display
  it("shows evidence count 0", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, evidence: [] }} />,
    );
    expect(getByTestId("evidence-count").textContent).toContain("0");
  });

  it("shows evidence count 1 with singular label", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, evidence: ["file.pdf"] }} />,
    );
    expect(getByTestId("evidence-count").textContent).toContain("1 file");
  });

  it("shows evidence count 3", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, evidence: ["a.pdf", "b.png", "c.doc"] }} />,
    );
    expect(getByTestId("evidence-count").textContent).toContain("3");
  });

  it("shows evidence count 10", async () => {
    const evidence = Array.from({ length: 10 }, (_, i) => `file${i}.pdf`);
    const { getByTestId } = await render(<ControlCard control={{ ...mockControl, evidence }} />);
    expect(getByTestId("evidence-count").textContent).toContain("10");
  });

  // Due date states
  it("shows upcoming due date", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, dueDate: "2099-06-30" }} />,
    );
    expect(getByTestId("control-due-date").textContent).toContain("Due:");
  });

  it("shows overdue label when due date is in the past", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, dueDate: "2020-01-01" }} />,
    );
    expect(getByTestId("control-due-date").textContent).toContain("Overdue:");
  });

  it("shows no-due-date message when dueDate is not set", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, dueDate: undefined }} />,
    );
    expect(getByTestId("no-due-date")).toBeDefined();
  });

  it("does not show due date element when dueDate is undefined", async () => {
    const { queryByTestId } = await render(
      <ControlCard control={{ ...mockControl, dueDate: undefined }} />,
    );
    expect(queryByTestId("control-due-date")).toBeNull();
  });

  // Owner display
  it("shows owner name", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("owner-name").textContent).toContain("Alice");
  });

  it("shows owner avatar", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("owner-avatar")).toBeDefined();
  });

  it("shows unassigned when owner is not provided", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, owner: undefined }} />,
    );
    expect(getByTestId("no-owner")).toBeDefined();
  });

  it("does not show owner section when no owner", async () => {
    const { queryByTestId } = await render(
      <ControlCard control={{ ...mockControl, owner: undefined }} />,
    );
    expect(queryByTestId("control-owner")).toBeNull();
  });

  // Click handler
  it("calls onClick when card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <ControlCard
        control={mockControl}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("control-card"));
    expect(clicked).toBeTruthy();
  });

  it("passes correct control to onClick", async () => {
    let received: Control | null = null;
    const { getByTestId } = await render(
      <ControlCard
        control={controls[2]}
        onClick={(c) => {
          received = c;
        }}
      />,
    );
    await fireEvent.click(getByTestId("control-card"));
    expect(received?.id).toBe("c3");
  });

  it("does not crash when onClick is not provided", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    await fireEvent.click(getByTestId("control-card"));
    expect(getByTestId("control-card")).toBeDefined();
  });

  // Edit button
  it("shows edit button when onEdit provided", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} onEdit={() => {}} />);
    expect(getByTestId("edit-button")).toBeDefined();
  });

  it("does not show edit button when onEdit not provided", async () => {
    const { queryByTestId } = await render(<ControlCard control={mockControl} />);
    expect(queryByTestId("edit-button")).toBeNull();
  });

  it("calls onEdit when edit button is clicked", async () => {
    let edited: Control | null = null;
    const { getByTestId } = await render(
      <ControlCard
        control={mockControl}
        onEdit={(c) => {
          edited = c;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(edited).toBeDefined();
  });

  // Add evidence button
  it("shows add evidence button when onAddEvidence provided", async () => {
    const { getByTestId } = await render(
      <ControlCard control={mockControl} onAddEvidence={() => {}} />,
    );
    expect(getByTestId("add-evidence-button")).toBeDefined();
  });

  it("calls onAddEvidence when button is clicked", async () => {
    let evidenceAdded: Control | null = null;
    const { getByTestId } = await render(
      <ControlCard
        control={mockControl}
        onAddEvidence={(c) => {
          evidenceAdded = c;
        }}
      />,
    );
    await fireEvent.click(getByTestId("add-evidence-button"));
    expect(evidenceAdded).toBeDefined();
  });

  it("does not show add evidence button when not provided", async () => {
    const { queryByTestId } = await render(<ControlCard control={mockControl} />);
    expect(queryByTestId("add-evidence-button")).toBeNull();
  });

  it("shows actions section when any action provided", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} onEdit={() => {}} />);
    expect(getByTestId("control-actions")).toBeDefined();
  });

  it("does not show actions section when no actions", async () => {
    const { queryByTestId } = await render(<ControlCard control={mockControl} />);
    expect(queryByTestId("control-actions")).toBeNull();
  });

  // Snapshots
  it("matches snapshot for compliant control", async () => {
    const { container } = await render(<ControlCard control={controls[0]} />);
    await snapshot("control-card-compliant");
  });

  it("matches snapshot for in-progress control", async () => {
    const { container } = await render(<ControlCard control={controls[1]} />);
    await snapshot("control-card-in-progress");
  });

  it("matches snapshot for non-compliant control", async () => {
    const { container } = await render(<ControlCard control={controls[2]} />);
    await snapshot("control-card-non-compliant");
  });

  it("matches snapshot for not-applicable control", async () => {
    const { container } = await render(<ControlCard control={controls[3]} />);
    await snapshot("control-card-not-applicable");
  });

  // Accessibility
  it("renders card header", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("control-card-header")).toBeDefined();
  });

  it("renders meta section", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("control-meta")).toBeDefined();
  });

  it("has pointer cursor when onClick provided", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} onClick={() => {}} />);
    expect(getByTestId("control-card").style.cursor).toBe("pointer");
  });

  it("has default cursor when no onClick", async () => {
    const { getByTestId } = await render(<ControlCard control={mockControl} />);
    expect(getByTestId("control-card").style.cursor).toBe("default");
  });

  it("stores control id in data attribute", async () => {
    const { getByTestId } = await render(<ControlCard control={controls[2]} />);
    expect(getByTestId("control-card").getAttribute("data-control-id")).toBe("c3");
  });

  it("renders with empty evidence and upcoming due date", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, evidence: [], dueDate: "2099-12-31" }} />,
    );
    expect(getByTestId("evidence-count").textContent).toContain("0");
    expect(getByTestId("control-due-date")).toBeDefined();
  });

  it("renders with no owner and overdue date", async () => {
    const { getByTestId } = await render(
      <ControlCard control={{ ...mockControl, owner: undefined, dueDate: "2020-01-01" }} />,
    );
    expect(getByTestId("no-owner")).toBeDefined();
    expect(getByTestId("control-due-date").textContent).toContain("Overdue:");
  });
});
