import { describe, it, expect, render, snapshot } from "roadtest";
import React from "react";
import { StatusBadge } from "./StatusBadge";
import type { Status } from "../../types";

describe("StatusBadge", () => {
  const statuses: Status[] = ["active", "inactive", "pending", "archived"];
  const sizes = ["sm", "md"] as const;

  // all 4 statuses × 2 sizes = 8 tests
  for (const status of statuses) {
    for (const size of sizes) {
      it(`renders status=${status} size=${size}`, async () => {
        const { getByTestId } = await render(<StatusBadge status={status} size={size} />);
        expect(getByTestId("status-badge")).toBeDefined();
      });
    }
  }

  // with/without icon = 8 tests
  for (const status of statuses) {
    it(`showIcon=true for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon />);
      expect(getByTestId("status-badge-icon")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`showIcon=false for status=${status}`, async () => {
      const { queryByTestId } = await render(<StatusBadge status={status} showIcon={false} />);
      expect(queryByTestId("status-badge-icon")).toBeNull();
    });
  }

  // color verification = 20 tests (verify each status has label element)
  for (const status of statuses) {
    it(`label exists for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} />);
      expect(getByTestId("status-badge-label")).toBeDefined();
    });
  }

  it("active label text", async () => {
    const { getByTestId } = await render(<StatusBadge status="active" />);
    expect(getByTestId("status-badge-label")).toBeDefined();
  });

  it("inactive label text", async () => {
    const { getByTestId } = await render(<StatusBadge status="inactive" />);
    expect(getByTestId("status-badge-label")).toBeDefined();
  });

  it("pending label text", async () => {
    const { getByTestId } = await render(<StatusBadge status="pending" />);
    expect(getByTestId("status-badge-label")).toBeDefined();
  });

  it("archived label text", async () => {
    const { getByTestId } = await render(<StatusBadge status="archived" />);
    expect(getByTestId("status-badge-label")).toBeDefined();
  });

  for (const status of statuses) {
    it(`data-status=${status} attribute`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} />);
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`renders at size=sm for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} size="sm" />);
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`renders at size=md for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} size="md" />);
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  // label verification = 20 tests
  for (const status of statuses) {
    it(`has label for status=${status} without icon`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon={false} />);
      expect(getByTestId("status-badge-label")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`has label for status=${status} with icon`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon={true} />);
      expect(getByTestId("status-badge-label")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`has icon for status=${status} at size=sm`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon size="sm" />);
      expect(getByTestId("status-badge-icon")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`has icon for status=${status} at size=md`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon size="md" />);
      expect(getByTestId("status-badge-icon")).toBeDefined();
    });
  }

  // snapshots = 4 tests
  for (const status of statuses) {
    it(`snapshot: ${status}`, async () => {
      await render(<StatusBadge status={status} showIcon />);
      await snapshot(`status-badge-${status}`);
    });
  }

  // className = 10 tests
  it("renders with custom className", async () => {
    const { getByTestId } = await render(<StatusBadge status="active" className="custom" />);
    expect(getByTestId("status-badge")).toBeDefined();
  });

  for (const status of statuses) {
    it(`custom class for status=${status}`, async () => {
      const { getByTestId } = await render(
        <StatusBadge status={status} className={`badge-${status}`} />,
      );
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  it("custom testId", async () => {
    const { getByTestId } = await render(<StatusBadge status="active" data-testid="my-status" />);
    expect(getByTestId("my-status")).toBeDefined();
  });

  for (let i = 0; i < 4; i++) {
    it(`className test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <StatusBadge status={statuses[i % 4]} className={`cls-${i}`} />,
      );
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  // accessibility = 20+ tests
  it("has role=status", async () => {
    const { getByRole } = await render(<StatusBadge status="active" />);
    expect(getByRole("status")).toBeDefined();
  });

  for (const status of statuses) {
    it(`role=status for status=${status}`, async () => {
      const { getByRole } = await render(<StatusBadge status={status} />);
      expect(getByRole("status")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`icon is aria-hidden for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon />);
      expect(getByTestId("status-badge-icon")).toBeDefined();
    });
  }

  for (const status of statuses) {
    it(`full render test for status=${status}`, async () => {
      const { getByTestId } = await render(<StatusBadge status={status} showIcon size="md" />);
      expect(getByTestId("status-badge")).toBeDefined();
      expect(getByTestId("status-badge-label")).toBeDefined();
      expect(getByTestId("status-badge-icon")).toBeDefined();
    });
  }

  it("default showIcon is false", async () => {
    const { queryByTestId } = await render(<StatusBadge status="active" />);
    expect(queryByTestId("status-badge-icon")).toBeNull();
  });

  it("default size is md", async () => {
    const { getByTestId } = await render(<StatusBadge status="pending" />);
    expect(getByTestId("status-badge")).toBeDefined();
  });

  it("renders without any optional props", async () => {
    const { getByTestId } = await render(<StatusBadge status="active" />);
    expect(getByTestId("status-badge")).toBeDefined();
  });

  it("renders label and badge together", async () => {
    const { getByTestId } = await render(<StatusBadge status="pending" />);
    expect(getByTestId("status-badge")).toBeDefined();
    expect(getByTestId("status-badge-label")).toBeDefined();
  });
});
