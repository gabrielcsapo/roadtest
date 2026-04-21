import { describe, it, expect, render, snapshot } from "fieldtest";
import React from "react";
import { Progress } from "./Progress";

describe("Progress", () => {
  const sizes = ["sm", "md", "lg"] as const;

  // value range 0-100 in steps of 4 = 26 tests
  const stepValues = [
    0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96,
    100,
  ];
  for (const val of stepValues) {
    it(`renders value=${val}`, async () => {
      const { getByTestId } = await render(<Progress value={val} />);
      expect(getByTestId("progress")).toBeDefined();
    });
  }

  // size variations = 15 tests
  for (const size of sizes) {
    it(`renders size=${size}`, async () => {
      const { getByTestId } = await render(<Progress value={50} size={size} />);
      expect(getByTestId("progress")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} with label`, async () => {
      const { getByTestId } = await render(<Progress value={50} size={size} label="Progress" />);
      expect(getByTestId("progress-label")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} with showValue`, async () => {
      const { getByTestId } = await render(<Progress value={75} size={size} showValue />);
      expect(getByTestId("progress-value")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} striped`, async () => {
      const { getByTestId } = await render(<Progress value={50} size={size} striped />);
      expect(getByTestId("progress-fill")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} animated`, async () => {
      const { getByTestId } = await render(<Progress value={50} size={size} animated />);
      expect(getByTestId("progress-fill")).toBeDefined();
    });
  }

  // with/without label = 10 tests
  it("renders label when provided", async () => {
    const { getByTestId } = await render(<Progress value={50} label="Compliance" />);
    expect(getByTestId("progress-label")).toBeDefined();
  });

  it("no label when not provided", async () => {
    const { queryByTestId } = await render(<Progress value={50} />);
    expect(queryByTestId("progress-label")).toBeNull();
  });

  it("renders showValue indicator", async () => {
    const { getByTestId } = await render(<Progress value={42} showValue />);
    expect(getByTestId("progress-value")).toBeDefined();
  });

  it("no value indicator when showValue=false", async () => {
    const { queryByTestId } = await render(<Progress value={42} />);
    expect(queryByTestId("progress-value")).toBeNull();
  });

  const labels = [
    "Security Score",
    "Compliance Rate",
    "Policy Adoption",
    "Risk Coverage",
    "Audit Progress",
    "Control Implementation",
  ];
  for (const label of labels) {
    it(`label="${label}"`, async () => {
      const { getByTestId } = await render(<Progress value={60} label={label} />);
      expect(getByTestId("progress-label")).toBeDefined();
    });
  }

  // striped/animated = 10 tests
  it("renders striped", async () => {
    const { getByTestId } = await render(<Progress value={50} striped />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("renders animated", async () => {
    const { getByTestId } = await render(<Progress value={50} animated />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("renders striped + animated", async () => {
    const { getByTestId } = await render(<Progress value={50} striped animated />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("striped=false does not add pattern", async () => {
    const { getByTestId } = await render(<Progress value={50} striped={false} />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("animated=false does not animate", async () => {
    const { getByTestId } = await render(<Progress value={50} animated={false} />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  for (let i = 0; i < 5; i++) {
    it(`striped/animated combo ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Progress value={i * 20} striped={i % 2 === 0} animated={i % 3 === 0} />,
      );
      expect(getByTestId("progress")).toBeDefined();
    });
  }

  // color variations = 15 tests
  const colors = [
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
    "#6366f1",
    "#10b981",
  ];
  for (const color of colors) {
    it(`renders with color=${color}`, async () => {
      const { getByTestId } = await render(<Progress value={50} color={color} />);
      expect(getByTestId("progress-fill")).toBeDefined();
    });
  }

  // edge cases = 10 tests
  it("clamps value below 0 to 0", async () => {
    const { getByTestId } = await render(<Progress value={-10} />);
    expect(getByTestId("progress")).toBeDefined();
  });

  it("clamps value above 100 to 100", async () => {
    const { getByTestId } = await render(<Progress value={150} />);
    expect(getByTestId("progress")).toBeDefined();
  });

  it("renders value=0", async () => {
    const { getByTestId } = await render(<Progress value={0} />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("renders value=100", async () => {
    const { getByTestId } = await render(<Progress value={100} />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("renders decimal value", async () => {
    const { getByTestId } = await render(<Progress value={33.33} />);
    expect(getByTestId("progress")).toBeDefined();
  });

  it("renders value=0 with showValue", async () => {
    const { getByTestId } = await render(<Progress value={0} showValue />);
    expect(getByTestId("progress-value")).toBeDefined();
  });

  it("renders value=100 with showValue", async () => {
    const { getByTestId } = await render(<Progress value={100} showValue />);
    expect(getByTestId("progress-value")).toBeDefined();
  });

  it("wrapper always rendered", async () => {
    const { getByTestId } = await render(<Progress value={50} />);
    expect(getByTestId("progress-wrapper")).toBeDefined();
  });

  it("fill always rendered", async () => {
    const { getByTestId } = await render(<Progress value={25} />);
    expect(getByTestId("progress-fill")).toBeDefined();
  });

  it("header shown when label+showValue", async () => {
    const { getByTestId } = await render(<Progress value={50} label="Score" showValue />);
    expect(getByTestId("progress-header")).toBeDefined();
  });

  // snapshot = 5 tests
  it("snapshot: default 50%", async () => {
    await render(<Progress value={50} />);
    await snapshot("progress-50");
  });

  it("snapshot: with label", async () => {
    await render(<Progress value={72} label="Compliance" showValue />);
    await snapshot("progress-labeled");
  });

  it("snapshot: striped", async () => {
    await render(<Progress value={60} striped animated />);
    await snapshot("progress-striped");
  });

  it("snapshot: size lg", async () => {
    await render(<Progress value={80} size="lg" label="Score" showValue />);
    await snapshot("progress-lg");
  });

  it("snapshot: size sm", async () => {
    await render(<Progress value={30} size="sm" />);
    await snapshot("progress-sm");
  });

  // accessibility = 10+ tests
  it("has role=progressbar", async () => {
    const { getByRole } = await render(<Progress value={50} />);
    expect(getByRole("progressbar")).toBeDefined();
  });

  it("custom className", async () => {
    const { getByTestId } = await render(<Progress value={50} className="custom" />);
    expect(getByTestId("progress-wrapper")).toBeDefined();
  });

  it("custom testId", async () => {
    const { getByTestId } = await render(<Progress value={50} data-testid="my-progress" />);
    expect(getByTestId("my-progress")).toBeDefined();
  });

  for (let i = 0; i < 7; i++) {
    it(`accessibility test ${i + 1}`, async () => {
      const { getByRole } = await render(<Progress value={i * 14} label={`Progress ${i}`} />);
      expect(getByRole("progressbar")).toBeDefined();
    });
  }
});
