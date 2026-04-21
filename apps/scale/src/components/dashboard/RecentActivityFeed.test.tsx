import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { AuditLog, User } from "../../types";

const mockActor: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
};
const bobActor: User = { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "manager" };

const mockLog: AuditLog = {
  id: "log1",
  action: "vendor.created",
  actor: mockActor,
  target: "Acme Corp",
  targetType: "vendor",
  timestamp: "2024-03-15T14:23:00Z",
  metadata: { vendorId: "v1" },
};

const logs: AuditLog[] = [
  { ...mockLog, id: "l1", action: "vendor.created", targetType: "vendor" },
  {
    ...mockLog,
    id: "l2",
    action: "policy.updated",
    target: "Password Policy",
    targetType: "policy",
  },
  {
    ...mockLog,
    id: "l3",
    action: "credential.rotated",
    target: "AWS API Key",
    targetType: "credential",
  },
  {
    ...mockLog,
    id: "l4",
    action: "user.role_changed",
    target: "Bob Smith",
    targetType: "user",
    actor: bobActor,
  },
  { ...mockLog, id: "l5", action: "vendor.deleted", targetType: "vendor" },
];

describe("RecentActivityFeed", () => {
  // Loading state
  it("shows loading spinner when loading is true", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[]} loading />);
    expect(getByTestId("activity-feed-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} loading />);
    expect(getByTestId("activity-feed-spinner")).toBeDefined();
  });

  it("does not show container when loading", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={logs} loading />);
    expect(queryByTestId("activity-feed-container")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(queryByTestId("activity-feed-loading")).toBeNull();
  });

  // Empty state
  it("shows empty state when no logs", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[]} />);
    expect(getByTestId("activity-feed-empty")).toBeDefined();
  });

  it("does not show list when empty", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={[]} />);
    expect(queryByTestId("activity-feed-list")).toBeNull();
  });

  // 1 item
  it("renders container with single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-feed-container")).toBeDefined();
  });

  it("renders single log item", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-item-l1")).toBeDefined();
  });

  it("shows actor name for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-actor-l1").textContent).toContain("Alice Johnson");
  });

  it("shows target for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-target-l1").textContent).toContain("Acme Corp");
  });

  it("shows timestamp for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-timestamp-l1")).toBeDefined();
  });

  it("shows icon for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-icon-l1")).toBeDefined();
  });

  it("shows avatar for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-avatar-l1")).toBeDefined();
  });

  it("has correct item count attribute for single log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={[logs[0]]} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("1");
  });

  // 5 items
  logs.forEach((log) =>
    it(`renders activity item for log ${log.id}`, async () => {
      const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
      expect(getByTestId(`activity-item-${log.id}`)).toBeDefined();
    }),
  );

  logs.forEach((log) =>
    it(`shows actor name for log ${log.id}`, async () => {
      const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
      expect(getByTestId(`activity-actor-${log.id}`).textContent).toContain(log.actor.name);
    }),
  );

  logs.forEach((log) =>
    it(`shows target for log ${log.id}`, async () => {
      const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
      expect(getByTestId(`activity-target-${log.id}`)).toBeDefined();
    }),
  );

  logs.forEach((log) =>
    it(`shows timestamp for log ${log.id}`, async () => {
      const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
      expect(getByTestId(`activity-timestamp-${log.id}`)).toBeDefined();
    }),
  );

  it("shows 5 items with correct count", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("5");
  });

  // 10 items
  it("renders 10 activity items", async () => {
    const tenLogs = Array.from({ length: 10 }, (_, i) => ({ ...mockLog, id: `tl${i}` }));
    const { getByTestId } = await render(<RecentActivityFeed logs={tenLogs} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("10");
  });

  // 20 items
  it("renders 20 activity items", async () => {
    const twentyLogs = Array.from({ length: 20 }, (_, i) => ({ ...mockLog, id: `tl${i}` }));
    const { getByTestId } = await render(<RecentActivityFeed logs={twentyLogs} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("20");
  });

  // maxItems limit
  it("limits displayed items when maxItems is provided", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} maxItems={3} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("3");
  });

  it("shows truncation message when maxItems < total", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} maxItems={3} />);
    expect(getByTestId("activity-feed-truncated")).toBeDefined();
  });

  it("shows correct counts in truncation message", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} maxItems={3} />);
    expect(getByTestId("activity-feed-truncated").textContent).toContain("3");
    expect(getByTestId("activity-feed-truncated").textContent).toContain("5");
  });

  it("does not show truncation when maxItems >= total", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={logs} maxItems={10} />);
    expect(queryByTestId("activity-feed-truncated")).toBeNull();
  });

  it("does not show truncation when no maxItems", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(queryByTestId("activity-feed-truncated")).toBeNull();
  });

  it("shows maxItems=1 correctly", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} maxItems={1} />);
    expect(getByTestId("activity-feed-container").getAttribute("data-item-count")).toBe("1");
  });

  // View all callback
  it("shows view all button when onViewAll is provided", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} onViewAll={() => {}} />);
    expect(getByTestId("view-all-button")).toBeDefined();
  });

  it("calls onViewAll when view all button is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <RecentActivityFeed
        logs={logs}
        onViewAll={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("view-all-button"));
    expect(clicked).toBeTruthy();
  });

  it("does not show view all button when onViewAll is not provided", async () => {
    const { queryByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(queryByTestId("view-all-button")).toBeNull();
  });

  // Action type icons (varied)
  it("shows icon for vendor.created action", async () => {
    const { getByTestId } = await render(
      <RecentActivityFeed logs={[{ ...mockLog, id: "vc", action: "vendor.created" }]} />,
    );
    expect(getByTestId("activity-icon-vc")).toBeDefined();
  });

  it("shows icon for policy.updated action", async () => {
    const { getByTestId } = await render(
      <RecentActivityFeed logs={[{ ...mockLog, id: "pu", action: "policy.updated" }]} />,
    );
    expect(getByTestId("activity-icon-pu")).toBeDefined();
  });

  it("shows icon for credential.rotated action", async () => {
    const { getByTestId } = await render(
      <RecentActivityFeed logs={[{ ...mockLog, id: "cr", action: "credential.rotated" }]} />,
    );
    expect(getByTestId("activity-icon-cr")).toBeDefined();
  });

  it("shows icon for unknown action type", async () => {
    const { getByTestId } = await render(
      <RecentActivityFeed logs={[{ ...mockLog, id: "ua", action: "something.unknown" }]} />,
    );
    expect(getByTestId("activity-icon-ua")).toBeDefined();
  });

  // Actor info
  it("shows different actor name for different log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(getByTestId("activity-actor-l4").textContent).toContain("Bob Smith");
  });

  it("shows actor avatar for each log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    logs.forEach((log) => {
      expect(getByTestId(`activity-avatar-${log.id}`)).toBeDefined();
    });
  });

  // Header
  it("renders feed header", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(getByTestId("activity-feed-header")).toBeDefined();
  });

  it("shows feed list when logs exist", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    expect(getByTestId("activity-feed-list")).toBeDefined();
  });

  // Snapshots
  it("matches snapshot with 5 logs", async () => {
    const { container } = await render(<RecentActivityFeed logs={logs} />);
    await snapshot("activity-feed-full");
  });

  it("matches snapshot for empty state", async () => {
    const { container } = await render(<RecentActivityFeed logs={[]} />);
    await snapshot("activity-feed-empty");
  });

  it("matches snapshot for loading state", async () => {
    const { container } = await render(<RecentActivityFeed logs={[]} loading />);
    await snapshot("activity-feed-loading");
  });

  it("action badge renders for each log", async () => {
    const { getByTestId } = await render(<RecentActivityFeed logs={logs} />);
    logs.forEach((log) => {
      expect(getByTestId(`activity-action-badge-${log.id}`)).toBeDefined();
    });
  });
});
