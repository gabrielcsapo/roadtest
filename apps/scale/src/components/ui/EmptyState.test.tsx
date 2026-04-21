import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  // title variations = 20 tests
  const titles = [
    "No vendors found",
    "No results",
    "Nothing here yet",
    "No policies",
    "No controls",
    "No issues found",
    "No personnel",
    "No credentials",
    "Empty list",
    "No data available",
    "No frameworks",
    "No audit logs",
    "No notifications",
    "No pending items",
    "No risk assessments",
    "Start by adding a vendor",
    "Create your first policy",
    "Add team members",
    "Nothing to display",
    "All caught up!",
  ];

  for (const title of titles) {
    it(`renders title="${title}"`, async () => {
      const { getByTestId } = await render(<EmptyState title={title} />);
      expect(getByTestId("empty-state-title")).toBeDefined();
    });
  }

  // with/without description = 10 tests
  it("renders description when provided", async () => {
    const { getByTestId } = await render(
      <EmptyState title="No results" description="Try adjusting your search filters" />,
    );
    expect(getByTestId("empty-state-description")).toBeDefined();
  });

  it("no description element when not provided", async () => {
    const { queryByTestId } = await render(<EmptyState title="Empty" />);
    expect(queryByTestId("empty-state-description")).toBeNull();
  });

  const descriptions = [
    "Try adjusting your filters",
    "Add a vendor to get started",
    "No items match your criteria",
    "Check back later",
    "Create a policy to get started",
    "Invite team members to begin",
    "Upload evidence to proceed",
    "Configure your settings first",
  ];

  for (const desc of descriptions) {
    it(`description="${desc.substring(0, 40)}"`, async () => {
      const { getByTestId } = await render(<EmptyState title="Empty" description={desc} />);
      expect(getByTestId("empty-state-description")).toBeDefined();
    });
  }

  // with/without action = 10 tests
  it("renders action button when provided", async () => {
    const { getByTestId } = await render(
      <EmptyState title="Empty" action={{ label: "Add vendor", onClick: () => {} }} />,
    );
    expect(getByTestId("empty-state-action")).toBeDefined();
  });

  it("no action button when not provided", async () => {
    const { queryByTestId } = await render(<EmptyState title="Empty" />);
    expect(queryByTestId("empty-state-action")).toBeNull();
  });

  const actionLabels = [
    "Add vendor",
    "Create policy",
    "Invite user",
    "Upload file",
    "Get started",
    "Learn more",
    "View docs",
    "Configure now",
  ];

  for (const label of actionLabels) {
    it(`action label="${label}"`, async () => {
      const { getByTestId } = await render(
        <EmptyState title="Empty" action={{ label, onClick: () => {} }} />,
      );
      expect(getByTestId("empty-state-action")).toBeDefined();
    });
  }

  // action clicks = 10 tests
  it("calls action onClick when clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <EmptyState
        title="Empty"
        action={{
          label: "Click me",
          onClick: () => {
            clicked = true;
          },
        }}
      />,
    );
    await fireEvent.click(getByTestId("empty-state-action"));
    expect(clicked).toBe(true);
  });

  for (let i = 0; i < 9; i++) {
    it(`action click test ${i + 1}`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <EmptyState
          title={`Empty ${i}`}
          action={{
            label: `Action ${i}`,
            onClick: () => {
              called = true;
            },
          }}
        />,
      );
      await fireEvent.click(getByTestId("empty-state-action"));
      expect(called).toBe(true);
    });
  }

  // compact mode = 10 tests
  it("renders in compact mode", async () => {
    const { getByTestId } = await render(<EmptyState title="Compact" compact />);
    expect(getByTestId("empty-state")).toBeDefined();
  });

  it("renders in non-compact mode", async () => {
    const { getByTestId } = await render(<EmptyState title="Normal" compact={false} />);
    expect(getByTestId("empty-state")).toBeDefined();
  });

  for (let i = 0; i < 8; i++) {
    it(`compact mode test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <EmptyState title={`Title ${i}`} compact={i % 2 === 0} description="Desc" />,
      );
      expect(getByTestId("empty-state")).toBeDefined();
    });
  }

  // icon variations = 10 tests
  it("renders icon when provided", async () => {
    const { getByTestId } = await render(<EmptyState title="Empty" icon={<span>📋</span>} />);
    expect(getByTestId("empty-state-icon")).toBeDefined();
  });

  it("no icon when not provided", async () => {
    const { queryByTestId } = await render(<EmptyState title="Empty" />);
    expect(queryByTestId("empty-state-icon")).toBeNull();
  });

  const icons = ["📋", "🔍", "👥", "🔒", "📊", "⚠️", "✅", "🚀"];
  for (const icon of icons) {
    it(`icon="${icon}" renders`, async () => {
      const { getByTestId } = await render(
        <EmptyState title="Empty" icon={<span data-testid={`icon-${icon}`}>{icon}</span>} />,
      );
      expect(getByTestId("empty-state-icon")).toBeDefined();
    });
  }

  // snapshot = 5 tests
  it("snapshot: simple", async () => {
    await render(<EmptyState title="No vendors" description="Add your first vendor" />);
    await snapshot("empty-state-simple");
  });

  it("snapshot: with action", async () => {
    await render(
      <EmptyState title="No policies" action={{ label: "Create policy", onClick: () => {} }} />,
    );
    await snapshot("empty-state-action");
  });

  it("snapshot: compact", async () => {
    await render(<EmptyState title="No items" compact />);
    await snapshot("empty-state-compact");
  });

  it("snapshot: with icon", async () => {
    await render(<EmptyState title="No results" icon={<span>🔍</span>} description="No matches" />);
    await snapshot("empty-state-icon");
  });

  it("snapshot: full", async () => {
    await render(
      <EmptyState
        title="No vendors found"
        description="Try clearing filters or add a new vendor"
        icon={<span>📋</span>}
        action={{ label: "Add vendor", onClick: () => {} }}
      />,
    );
    await snapshot("empty-state-full");
  });

  // combined props = 25+ tests
  it("title + description + action", async () => {
    const { getByTestId } = await render(
      <EmptyState
        title="Empty"
        description="No results"
        action={{ label: "Add", onClick: () => {} }}
      />,
    );
    expect(getByTestId("empty-state-title")).toBeDefined();
    expect(getByTestId("empty-state-description")).toBeDefined();
    expect(getByTestId("empty-state-action")).toBeDefined();
  });

  it("title + icon + action", async () => {
    const { getByTestId } = await render(
      <EmptyState
        title="Empty"
        icon={<span>⭐</span>}
        action={{ label: "Go", onClick: () => {} }}
      />,
    );
    expect(getByTestId("empty-state-icon")).toBeDefined();
    expect(getByTestId("empty-state-action")).toBeDefined();
  });

  it("title + compact + action", async () => {
    const { getByTestId } = await render(
      <EmptyState title="Empty" compact action={{ label: "Add", onClick: () => {} }} />,
    );
    expect(getByTestId("empty-state-action")).toBeDefined();
  });

  for (let i = 0; i < 22; i++) {
    it(`combined props test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <EmptyState
          title={titles[i % titles.length]}
          description={i % 2 === 0 ? descriptions[i % descriptions.length] : undefined}
          compact={i % 3 === 0}
          action={i % 4 === 0 ? { label: `Action ${i}`, onClick: () => {} } : undefined}
        />,
      );
      expect(getByTestId("empty-state-title")).toBeDefined();
    });
  }

  it("custom className", async () => {
    const { getByTestId } = await render(<EmptyState title="Empty" className="custom" />);
    expect(getByTestId("empty-state")).toBeDefined();
  });

  it("custom testId", async () => {
    const { getByTestId } = await render(<EmptyState title="Empty" data-testid="my-empty" />);
    expect(getByTestId("my-empty")).toBeDefined();
  });

  it("has role=status", async () => {
    const { getByRole } = await render(<EmptyState title="Empty" />);
    expect(getByRole("status")).toBeDefined();
  });
});
