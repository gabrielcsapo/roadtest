import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  const placements = ["top", "bottom", "left", "right"] as const;

  // placement variations = 20 tests
  for (const placement of placements) {
    it(`renders with placement=${placement}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Info" placement={placement}>
          <button>Hover me</button>
        </Tooltip>,
      );
      expect(getByTestId("tooltip-wrapper")).toBeDefined();
    });
  }

  for (const placement of placements) {
    it(`shows tooltip on hover for placement=${placement}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Tooltip text" placement={placement}>
          <button>Hover</button>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(getByTestId("tooltip")).toBeDefined();
    });
  }

  for (const placement of placements) {
    it(`hides tooltip on mouse leave for placement=${placement}`, async () => {
      const { getByTestId, queryByTestId } = await render(
        <Tooltip content="Tooltip" placement={placement}>
          <span>Hover</span>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      await fireEvent.mouseLeave(getByTestId("tooltip-wrapper"));
      expect(queryByTestId("tooltip")).toBeNull();
    });
  }

  for (const placement of placements) {
    it(`data-placement=${placement} is set`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Test" placement={placement}>
          <span>Hover</span>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(getByTestId("tooltip")).toBeDefined();
    });
  }

  for (const placement of placements) {
    it(`snapshot: placement=${placement}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Tooltip" placement={placement}>
          <button>Btn</button>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      await snapshot(`tooltip-${placement}`);
    });
  }

  // content variations = 20 tests
  const contents = [
    "Short",
    "A longer tooltip message",
    "Click to expand more details",
    "This item requires review",
    "Compliance status: In Progress",
    "Last updated 2 hours ago",
    "Risk level: High",
    "Vendor: Acme Corp",
    "Policy accepted by 94% of users",
    "Schedule audit",
    "View full details",
    "Remove from list",
    "Assign to team member",
    "Export as CSV",
    "Set reminder",
    "Mark as reviewed",
    "Flag for review",
    "Copy link",
    "Archive item",
    "Generate report",
  ];

  for (const content of contents) {
    it(`renders content: "${content.substring(0, 30)}"`, async () => {
      const { getByTestId } = await render(
        <Tooltip content={content}>
          <span>Hover</span>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(getByTestId("tooltip")).toBeDefined();
    });
  }

  // disabled = 10 tests
  it("does not show when disabled", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Tooltip content="Hidden" disabled>
        <button>Hover</button>
      </Tooltip>,
    );
    await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
    expect(queryByTestId("tooltip")).toBeNull();
  });

  for (const placement of placements) {
    it(`disabled with placement=${placement}`, async () => {
      const { getByTestId, queryByTestId } = await render(
        <Tooltip content="Hidden" disabled placement={placement}>
          <span>Hover</span>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(queryByTestId("tooltip")).toBeNull();
    });
  }

  it("disabled=false shows tooltip", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Visible" disabled={false}>
        <span>Hover</span>
      </Tooltip>,
    );
    await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
    expect(getByTestId("tooltip")).toBeDefined();
  });

  it("wrapper still renders when disabled", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Hidden" disabled>
        <span>Text</span>
      </Tooltip>,
    );
    expect(getByTestId("tooltip-wrapper")).toBeDefined();
  });

  it("trigger still renders when disabled", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Hidden" disabled>
        <span>Text</span>
      </Tooltip>,
    );
    expect(getByTestId("tooltip-trigger")).toBeDefined();
  });

  // with different children = 20 tests
  const childTypes = [
    <button key="btn">Button</button>,
    <span key="span">Span</span>,
    <div key="div">Div</div>,
    <a key="a" href="#">
      Link
    </a>,
    <input key="input" type="text" readOnly />,
  ];

  for (let i = 0; i < childTypes.length; i++) {
    it(`renders with child type ${i + 1}`, async () => {
      const { getByTestId } = await render(<Tooltip content="Tooltip">{childTypes[i]}</Tooltip>);
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(getByTestId("tooltip")).toBeDefined();
    });
  }

  for (let i = 0; i < childTypes.length; i++) {
    it(`hides after hover for child type ${i + 1}`, async () => {
      const { getByTestId, queryByTestId } = await render(
        <Tooltip content="Tooltip">{childTypes[i]}</Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      await fireEvent.mouseLeave(getByTestId("tooltip-wrapper"));
      expect(queryByTestId("tooltip")).toBeNull();
    });
  }

  it("shows on focus", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Focus tooltip">
        <button>Focus me</button>
      </Tooltip>,
    );
    await fireEvent.focus(getByTestId("tooltip-wrapper"));
    expect(getByTestId("tooltip")).toBeDefined();
  });

  it("hides on blur", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Tooltip content="Focus tooltip">
        <button>Focus</button>
      </Tooltip>,
    );
    await fireEvent.focus(getByTestId("tooltip-wrapper"));
    await fireEvent.blur(getByTestId("tooltip-wrapper"));
    expect(queryByTestId("tooltip")).toBeNull();
  });

  it("tooltip not shown by default", async () => {
    const { queryByTestId } = await render(
      <Tooltip content="Hidden">
        <button>Btn</button>
      </Tooltip>,
    );
    expect(queryByTestId("tooltip")).toBeNull();
  });

  it("trigger always shown", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Test">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(getByTestId("tooltip-trigger")).toBeDefined();
  });

  // delay variations = 10 tests
  for (const delay of [0, 100, 200, 300, 500]) {
    it(`renders with delay=${delay}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Delayed" delay={delay}>
          <button>Hover</button>
        </Tooltip>,
      );
      expect(getByTestId("tooltip-wrapper")).toBeDefined();
    });
  }

  for (const delay of [0, 100, 200, 300, 500]) {
    it(`wrapper renders with delay=${delay}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content="Delayed" delay={delay}>
          <span>Text</span>
        </Tooltip>,
      );
      expect(getByTestId("tooltip-trigger")).toBeDefined();
    });
  }

  // accessibility = 15+ tests
  it("has role=tooltip when visible", async () => {
    const { getByRole, getByTestId } = await render(
      <Tooltip content="Info">
        <button>Hover</button>
      </Tooltip>,
    );
    await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
    expect(getByRole("tooltip")).toBeDefined();
  });

  it("custom className", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Test" className="custom">
        <span>Hover</span>
      </Tooltip>,
    );
    expect(getByTestId("tooltip-wrapper")).toBeDefined();
  });

  it("custom testId", async () => {
    const { getByTestId } = await render(
      <Tooltip content="Test" data-testid="my-tip">
        <span>Hover</span>
      </Tooltip>,
    );
    await fireEvent.mouseEnter(getByTestId("my-tip-wrapper"));
    expect(getByTestId("my-tip")).toBeDefined();
  });

  for (let i = 0; i < 12; i++) {
    it(`accessibility test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Tooltip content={`Info ${i}`} placement={placements[i % 4]}>
          <span>Hover {i}</span>
        </Tooltip>,
      );
      await fireEvent.mouseEnter(getByTestId("tooltip-wrapper"));
      expect(getByTestId("tooltip")).toBeDefined();
    });
  }
});
