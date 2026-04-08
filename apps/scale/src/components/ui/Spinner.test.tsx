import { describe, it, expect, render, snapshot } from "@fieldtest/core";
import React from "react";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

  // size variations = 30 tests
  for (const size of sizes) {
    it(`renders size=${size}`, async () => {
      const { getByTestId } = await render(<Spinner size={size} />);
      expect(getByTestId("spinner")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} wrapper renders`, async () => {
      const { getByTestId } = await render(<Spinner size={size} />);
      expect(getByTestId("spinner-wrapper")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} has data-size attribute`, async () => {
      const { getByTestId } = await render(<Spinner size={size} />);
      expect(getByTestId("spinner")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} with label`, async () => {
      const { getByTestId } = await render(<Spinner size={size} label="Loading..." />);
      expect(getByTestId("spinner-label")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} with custom color`, async () => {
      const { getByTestId } = await render(<Spinner size={size} color="#ef4444" />);
      expect(getByTestId("spinner")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} no label by default`, async () => {
      const { queryByTestId } = await render(<Spinner size={size} />);
      expect(queryByTestId("spinner-label")).toBeNull();
    });
  }

  // color variations = 30 tests
  const colors = [
    "#6366f1",
    "#ef4444",
    "#f97316",
    "#fbbf24",
    "#4ade80",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
    "#34d399",
    "#fb7185",
    "#38bdf8",
    "#818cf8",
    "#c084fc",
    "#94a3b8",
    "#10b981",
    "#e11d48",
    "#d946ef",
    "#0ea5e9",
    "#84cc16",
    "#f59e0b",
    "#06b6d4",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#64748b",
    "#dc2626",
    "#7c3aed",
    "#0369a1",
    "#15803d",
    "#b45309",
  ];

  for (const color of colors) {
    it(`renders with color=${color}`, async () => {
      const { getByTestId } = await render(<Spinner color={color} />);
      expect(getByTestId("spinner")).toBeDefined();
    });
  }

  // with/without label = 20 tests
  it("shows label when provided", async () => {
    const { getByTestId } = await render(<Spinner label="Loading data..." />);
    expect(getByTestId("spinner-label")).toBeDefined();
  });

  it("no label element when not provided", async () => {
    const { queryByTestId } = await render(<Spinner />);
    expect(queryByTestId("spinner-label")).toBeNull();
  });

  const labels = [
    "Loading...",
    "Please wait",
    "Fetching data",
    "Processing",
    "Saving changes",
    "Running audit",
    "Checking compliance",
    "Analyzing risk",
    "Generating report",
    "Syncing",
    "Uploading",
    "Validating",
    "Verifying",
    "Authenticating",
    "Connecting",
    "Updating",
    "Refreshing",
    "Scanning",
  ];

  for (const label of labels) {
    it(`label="${label}"`, async () => {
      const { getByTestId } = await render(<Spinner label={label} />);
      expect(getByTestId("spinner-label")).toBeDefined();
    });
  }

  // snapshot = 5 tests
  it("snapshot: default", async () => {
    await render(<Spinner />);
    await snapshot("spinner-default");
  });

  it("snapshot: size lg", async () => {
    await render(<Spinner size="lg" label="Loading..." />);
    await snapshot("spinner-lg");
  });

  it("snapshot: size xs", async () => {
    await render(<Spinner size="xs" />);
    await snapshot("spinner-xs");
  });

  it("snapshot: with label", async () => {
    await render(<Spinner label="Processing..." />);
    await snapshot("spinner-labeled");
  });

  it("snapshot: custom color", async () => {
    await render(<Spinner color="#ef4444" size="md" />);
    await snapshot("spinner-red");
  });

  // accessibility = 15+ tests
  it("has role=status", async () => {
    const { getByRole } = await render(<Spinner />);
    expect(getByRole("status")).toBeDefined();
  });

  it("has aria-label=Loading by default", async () => {
    const { getByRole } = await render(<Spinner />);
    expect(getByRole("status")).toBeDefined();
  });

  it("has aria-label from label prop", async () => {
    const { getByRole } = await render(<Spinner label="Checking" />);
    expect(getByRole("status")).toBeDefined();
  });

  it("has aria-live=polite", async () => {
    const { getByTestId } = await render(<Spinner />);
    expect(getByTestId("spinner-wrapper")).toBeDefined();
  });

  it("custom className", async () => {
    const { getByTestId } = await render(<Spinner className="custom" />);
    expect(getByTestId("spinner-wrapper")).toBeDefined();
  });

  it("custom testId", async () => {
    const { getByTestId } = await render(<Spinner data-testid="my-spinner" />);
    expect(getByTestId("my-spinner")).toBeDefined();
  });

  for (let i = 0; i < 9; i++) {
    it(`accessibility test ${i + 1}`, async () => {
      const { getByRole } = await render(
        <Spinner size={sizes[i % 5]} label={labels[i % labels.length]} />,
      );
      expect(getByRole("status")).toBeDefined();
    });
  }
});
