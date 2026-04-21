import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import { IssueStatusFlow } from "./IssueStatusFlow";
import { Issue, User } from "../../types";

const mockAssignee: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
};

const baseIssue: Issue = {
  id: "i1",
  title: "Missing MFA enforcement",
  description: "MFA is not enforced for admin accounts",
  severity: "high",
  status: "open",
  assignee: mockAssignee,
  dueDate: "2024-04-30",
  createdAt: "2024-03-01",
  framework: "SOC2",
};

const openIssue: Issue = { ...baseIssue, id: "i1", status: "open" };
const inProgressIssue: Issue = { ...baseIssue, id: "i2", status: "in-progress" };
const resolvedIssue: Issue = { ...baseIssue, id: "i3", status: "resolved" };
const wontFixIssue: Issue = { ...baseIssue, id: "i4", status: "wont-fix" };

const allIssues = [openIssue, inProgressIssue, resolvedIssue, wontFixIssue];

describe("IssueStatusFlow", () => {
  // Basic rendering for each status
  allIssues.forEach((issue) =>
    it(`renders status flow for ${issue.status} issue`, async () => {
      const { getByTestId } = await render(
        <IssueStatusFlow issue={issue} onTransition={() => {}} />,
      );
      expect(getByTestId("issue-status-flow")).toBeDefined();
    }),
  );

  // Current status badge for each status
  allIssues.forEach((issue) =>
    it(`shows current status badge for ${issue.status}`, async () => {
      const { getByTestId } = await render(
        <IssueStatusFlow issue={issue} onTransition={() => {}} />,
      );
      expect(getByTestId("current-status-badge")).toBeDefined();
    }),
  );

  it("shows Open label for open status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("current-status-badge").textContent).toContain("Open");
  });

  it("shows In Progress label for in-progress status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={inProgressIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("current-status-badge").textContent).toContain("In Progress");
  });

  it("shows Resolved label for resolved status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={resolvedIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("current-status-badge").textContent).toContain("Resolved");
  });

  it("shows Won't Fix label for wont-fix status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={wontFixIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("current-status-badge").textContent).toContain("Won't Fix");
  });

  // Data attribute for current status
  allIssues.forEach((issue) =>
    it(`has correct data-current-status for ${issue.status}`, async () => {
      const { getByTestId } = await render(
        <IssueStatusFlow issue={issue} onTransition={() => {}} />,
      );
      expect(getByTestId("issue-status-flow").getAttribute("data-current-status")).toBe(
        issue.status,
      );
    }),
  );

  // Transition buttons from 'open': in-progress, wont-fix
  it("shows in-progress transition button from open status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-in-progress")).toBeDefined();
  });

  it("shows wont-fix transition button from open status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-wont-fix")).toBeDefined();
  });

  it("does not show resolved transition from open status", async () => {
    const { queryByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(queryByTestId("transition-to-resolved")).toBeNull();
  });

  // Transition buttons from 'in-progress': resolved, open
  it("shows resolved transition button from in-progress status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={inProgressIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-resolved")).toBeDefined();
  });

  it("shows open transition button from in-progress status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={inProgressIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-open")).toBeDefined();
  });

  it("does not show wont-fix transition from in-progress", async () => {
    const { queryByTestId } = await render(
      <IssueStatusFlow issue={inProgressIssue} onTransition={() => {}} />,
    );
    expect(queryByTestId("transition-to-wont-fix")).toBeNull();
  });

  // Transition buttons from 'resolved': open
  it("shows open transition button from resolved status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={resolvedIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-open")).toBeDefined();
  });

  it("does not show in-progress transition from resolved", async () => {
    const { queryByTestId } = await render(
      <IssueStatusFlow issue={resolvedIssue} onTransition={() => {}} />,
    );
    expect(queryByTestId("transition-to-in-progress")).toBeNull();
  });

  // Transition buttons from 'wont-fix': open
  it("shows open transition button from wont-fix status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={wontFixIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-to-open")).toBeDefined();
  });

  it("does not show resolved transition from wont-fix", async () => {
    const { queryByTestId } = await render(
      <IssueStatusFlow issue={wontFixIssue} onTransition={() => {}} />,
    );
    expect(queryByTestId("transition-to-resolved")).toBeNull();
  });

  // Click handlers: from open
  it("calls onTransition with in-progress when in-progress button clicked from open", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={openIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-in-progress"));
    expect(transitioned).toBe("in-progress");
  });

  it("calls onTransition with wont-fix when wont-fix button clicked from open", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={openIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-wont-fix"));
    expect(transitioned).toBe("wont-fix");
  });

  // Click handlers: from in-progress
  it("calls onTransition with resolved when resolved button clicked from in-progress", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={inProgressIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-resolved"));
    expect(transitioned).toBe("resolved");
  });

  it("calls onTransition with open when open button clicked from in-progress", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={inProgressIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-open"));
    expect(transitioned).toBe("open");
  });

  // Click handlers: from resolved
  it("calls onTransition with open when open button clicked from resolved", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={resolvedIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-open"));
    expect(transitioned).toBe("open");
  });

  // Click handlers: from wont-fix
  it("calls onTransition with open when open button clicked from wont-fix", async () => {
    let transitioned = "";
    const { getByTestId } = await render(
      <IssueStatusFlow
        issue={wontFixIssue}
        onTransition={(s) => {
          transitioned = s;
        }}
      />,
    );
    await fireEvent.click(getByTestId("transition-to-open"));
    expect(transitioned).toBe("open");
  });

  // Loading state
  it("shows loading indicator when loading is true", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} loading />,
    );
    expect(getByTestId("status-flow-loading")).toBeDefined();
  });

  it("hides loading indicator when loading is false", async () => {
    const { queryByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} loading={false} />,
    );
    expect(queryByTestId("status-flow-loading")).toBeNull();
  });

  it("disables transition buttons when loading", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} loading />,
    );
    const btn = getByTestId("transition-to-in-progress");
    expect(btn.disabled).toBeTruthy();
  });

  it("enables transition buttons when not loading", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} loading={false} />,
    );
    const btn = getByTestId("transition-to-in-progress");
    expect(btn.disabled).toBeFalsy();
  });

  // History
  it("shows created date", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("status-flow-history").textContent).toContain("2024-03-01");
  });

  // Transition actions section
  it("shows transition actions section for open status", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("transition-actions")).toBeDefined();
  });

  it("shows current status section", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("current-status-section")).toBeDefined();
  });

  // Snapshots
  it("matches snapshot for open status", async () => {
    const { container } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
    );
    await snapshot("issue-status-flow-open");
  });

  it("matches snapshot for in-progress status", async () => {
    const { container } = await render(
      <IssueStatusFlow issue={inProgressIssue} onTransition={() => {}} />,
    );
    await snapshot("issue-status-flow-in-progress");
  });

  it("matches snapshot for resolved status", async () => {
    const { container } = await render(
      <IssueStatusFlow issue={resolvedIssue} onTransition={() => {}} />,
    );
    await snapshot("issue-status-flow-resolved");
  });

  it("matches snapshot for wont-fix status", async () => {
    const { container } = await render(
      <IssueStatusFlow issue={wontFixIssue} onTransition={() => {}} />,
    );
    await snapshot("issue-status-flow-wont-fix");
  });

  // Accessibility: transition buttons have text content
  (["in-progress", "wont-fix"] as Array<Issue["status"]>).map((target) =>
    it(`transition button to ${target} has accessible label`, async () => {
      const { getByTestId } = await render(
        <IssueStatusFlow issue={openIssue} onTransition={() => {}} />,
      );
      expect(getByTestId(`transition-to-${target}`)).toBeDefined();
    }),
  );

  it("does not crash when no transitions available (though all statuses have at least one)", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={resolvedIssue} onTransition={() => {}} />,
    );
    expect(getByTestId("issue-status-flow")).toBeDefined();
  });

  it("renders loading spinner inside transition buttons when loading", async () => {
    const { getByTestId } = await render(
      <IssueStatusFlow issue={openIssue} onTransition={() => {}} loading />,
    );
    expect(getByTestId("transition-spinner-in-progress")).toBeDefined();
  });
});
