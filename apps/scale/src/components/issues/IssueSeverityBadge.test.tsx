import { describe, it, expect, render, snapshot } from "@fieldtest/core";
import { IssueSeverityBadge } from "./IssueSeverityBadge";
import { Risk } from "../../types";

const allSeverities: Risk[] = ["low", "medium", "high", "critical"];
const sizes = ["sm", "md"] as const;

const expectedColors: Record<Risk, string> = {
  low: "green",
  medium: "yellow",
  high: "orange",
  critical: "red",
};

const expectedLabels: Record<Risk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

describe("IssueSeverityBadge", () => {
  // All 4 severities × 2 sizes = 8 tests
  allSeverities.forEach((severity) =>
    sizes.forEach((size) =>
      it(`renders ${severity} badge at size ${size}`, async () => {
        const { getByTestId } = await render(
          <IssueSeverityBadge severity={severity} size={size} />,
        );
        expect(getByTestId("severity-badge")).toBeDefined();
      }),
    ),
  );

  // All 4 severities × 2 sizes × showIcon = 16 tests
  allSeverities.forEach((severity) =>
    sizes.forEach((size) =>
      [true, false].forEach((showIcon) =>
        it(`renders ${severity} at size ${size} with showIcon=${showIcon}`, async () => {
          const { getByTestId } = await render(
            <IssueSeverityBadge severity={severity} size={size} showIcon={showIcon} />,
          );
          expect(getByTestId("severity-badge")).toBeDefined();
        }),
      ),
    ),
  );

  // Color mapping
  allSeverities.forEach((severity) =>
    it(`${severity} has correct color ${expectedColors[severity]}`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} />);
      expect(getByTestId("severity-badge").getAttribute("data-color")).toBe(
        expectedColors[severity],
      );
    }),
  );

  // Double-check each color specifically
  it("low severity has green color", async () => {
    const { getByTestId } = await render(<IssueSeverityBadge severity="low" />);
    expect(getByTestId("severity-badge").getAttribute("data-color")).toBe("green");
  });

  it("medium severity has yellow color", async () => {
    const { getByTestId } = await render(<IssueSeverityBadge severity="medium" />);
    expect(getByTestId("severity-badge").getAttribute("data-color")).toBe("yellow");
  });

  it("high severity has orange color", async () => {
    const { getByTestId } = await render(<IssueSeverityBadge severity="high" />);
    expect(getByTestId("severity-badge").getAttribute("data-color")).toBe("orange");
  });

  it("critical severity has red color", async () => {
    const { getByTestId } = await render(<IssueSeverityBadge severity="critical" />);
    expect(getByTestId("severity-badge").getAttribute("data-color")).toBe("red");
  });

  // Label text
  allSeverities.forEach((severity) =>
    it(`shows label "${expectedLabels[severity]}" for ${severity}`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} />);
      expect(getByTestId("severity-label").textContent).toBe(expectedLabels[severity]);
    }),
  );

  // Icon rendering
  allSeverities.forEach((severity) =>
    it(`shows icon for ${severity} when showIcon is true`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} showIcon />);
      expect(getByTestId("severity-icon")).toBeDefined();
    }),
  );

  allSeverities.forEach((severity) =>
    it(`does not show icon for ${severity} when showIcon is false`, async () => {
      const { queryByTestId } = await render(
        <IssueSeverityBadge severity={severity} showIcon={false} />,
      );
      expect(queryByTestId("severity-icon")).toBeNull();
    }),
  );

  it("does not show icon by default", async () => {
    const { queryByTestId } = await render(<IssueSeverityBadge severity="high" />);
    expect(queryByTestId("severity-icon")).toBeNull();
  });

  // Severity data attribute
  allSeverities.forEach((severity) =>
    it(`has data-severity attribute for ${severity}`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} />);
      expect(getByTestId("severity-badge").getAttribute("data-severity")).toBe(severity);
    }),
  );

  // Default size
  it("defaults to md size when size not provided", async () => {
    const { getByTestId } = await render(<IssueSeverityBadge severity="high" />);
    expect(getByTestId("severity-badge")).toBeDefined();
  });

  // Snapshots
  allSeverities.forEach((severity) =>
    it(`matches snapshot for ${severity} severity`, async () => {
      const { container } = await render(<IssueSeverityBadge severity={severity} />);
      await snapshot(`severity-badge-${severity}`);
    }),
  );

  allSeverities.forEach((severity) =>
    it(`matches snapshot for ${severity} with icon`, async () => {
      const { container } = await render(<IssueSeverityBadge severity={severity} showIcon />);
      await snapshot(`severity-badge-${severity}-icon`);
    }),
  );

  // Accessibility
  allSeverities.forEach((severity) =>
    it(`severity icon has aria-hidden for ${severity}`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} showIcon />);
      expect(getByTestId("severity-icon").getAttribute("aria-hidden")).toBe("true");
    }),
  );

  // sm size specific
  allSeverities.forEach((severity) =>
    it(`renders ${severity} at sm size`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} size="sm" />);
      expect(getByTestId("severity-label").textContent).toBe(expectedLabels[severity]);
    }),
  );

  // md size specific
  allSeverities.forEach((severity) =>
    it(`renders ${severity} at md size`, async () => {
      const { getByTestId } = await render(<IssueSeverityBadge severity={severity} size="md" />);
      expect(getByTestId("severity-label").textContent).toBe(expectedLabels[severity]);
    }),
  );

  // Verify data-severity with icon combinations
  allSeverities.forEach((severity) =>
    [true, false].forEach((showIcon) =>
      it(`has data-severity="${severity}" with showIcon=${showIcon}`, async () => {
        const { getByTestId } = await render(
          <IssueSeverityBadge severity={severity} showIcon={showIcon} />,
        );
        expect(getByTestId("severity-badge").getAttribute("data-severity")).toBe(severity);
      }),
    ),
  );

  // Color + size combos: verify data-color at both sizes
  allSeverities.forEach((severity) =>
    sizes.forEach((size) =>
      it(`has correct data-color for ${severity} at size ${size}`, async () => {
        const { getByTestId } = await render(
          <IssueSeverityBadge severity={severity} size={size} />,
        );
        expect(getByTestId("severity-badge").getAttribute("data-color")).toBe(
          expectedColors[severity],
        );
      }),
    ),
  );

  // Label text in all combos
  allSeverities.forEach((severity) =>
    sizes.forEach((size) =>
      it(`has correct label text for ${severity} at size ${size}`, async () => {
        const { getByTestId } = await render(
          <IssueSeverityBadge severity={severity} size={size} />,
        );
        expect(getByTestId("severity-label").textContent).toBe(expectedLabels[severity]);
      }),
    ),
  );

  // Icon presence in sm and md
  allSeverities.forEach((severity) =>
    sizes.forEach((size) =>
      it(`shows icon for ${severity} at ${size} when showIcon is true`, async () => {
        const { getByTestId } = await render(
          <IssueSeverityBadge severity={severity} size={size} showIcon />,
        );
        expect(getByTestId("severity-icon")).toBeDefined();
      }),
    ),
  );
});
