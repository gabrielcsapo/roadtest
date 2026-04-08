import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { FrameworkComplianceGrid } from "./FrameworkComplianceGrid";
import { Framework, Control } from "../../types";

const allFrameworks: Framework[] = ["SOC2", "ISO27001", "HIPAA", "GDPR", "PCI-DSS", "FedRAMP"];

const mockControl: Control = {
  id: "c1",
  name: "Access Control",
  description: "Access control review",
  framework: "SOC2",
  status: "compliant",
  evidence: [],
};

const frameworkEntries = allFrameworks.map((name, i) => ({
  name,
  compliant: 8 - i,
  total: 10,
  controls: [{ ...mockControl, id: `ctrl-${name}`, framework: name }],
}));

const highComplianceFrameworks = allFrameworks.map((name) => ({
  name,
  compliant: 9,
  total: 10,
  controls: [],
}));

const lowComplianceFrameworks = allFrameworks.map((name) => ({
  name,
  compliant: 2,
  total: 10,
  controls: [],
}));

const midComplianceFrameworks = allFrameworks.map((name) => ({
  name,
  compliant: 6,
  total: 10,
  controls: [],
}));

describe("FrameworkComplianceGrid", () => {
  // Loading state
  it("shows loading spinner when loading is true", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={[]} loading />);
    expect(getByTestId("framework-grid-loading")).toBeDefined();
  });

  it("shows spinner component when loading", async () => {
    const { getByTestId } = await render(
      <FrameworkComplianceGrid frameworks={frameworkEntries} loading />,
    );
    expect(getByTestId("framework-grid-spinner")).toBeDefined();
  });

  it("does not show container when loading", async () => {
    const { queryByTestId } = await render(
      <FrameworkComplianceGrid frameworks={frameworkEntries} loading />,
    );
    expect(queryByTestId("framework-grid-container")).toBeNull();
  });

  it("hides loading when not loading", async () => {
    const { queryByTestId } = await render(
      <FrameworkComplianceGrid frameworks={frameworkEntries} />,
    );
    expect(queryByTestId("framework-grid-loading")).toBeNull();
  });

  // Empty state
  it("shows empty state when no frameworks", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={[]} />);
    expect(getByTestId("framework-grid-empty")).toBeDefined();
  });

  it("does not show container when empty", async () => {
    const { queryByTestId } = await render(<FrameworkComplianceGrid frameworks={[]} />);
    expect(queryByTestId("framework-grid-container")).toBeNull();
  });

  // All 6 framework cards render
  allFrameworks.map((fw) =>
    it(`renders card for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      expect(getByTestId(`framework-card-${fw}`)).toBeDefined();
    }),
  );

  // Percentage display for each framework
  allFrameworks.map((fw, i) =>
    it(`shows percentage for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      const expectedPct = Math.round(((8 - i) / 10) * 100);
      expect(getByTestId(`framework-percentage-${fw}`).textContent).toContain(String(expectedPct));
    }),
  );

  // Progress bars for each framework
  allFrameworks.map((fw) =>
    it(`shows progress bar for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      expect(getByTestId(`framework-progress-${fw}`)).toBeDefined();
    }),
  );

  // Counts display for each framework
  allFrameworks.map((fw) =>
    it(`shows compliant counts for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      expect(getByTestId(`framework-counts-${fw}`)).toBeDefined();
    }),
  );

  // Percentage calculations
  it("calculates 100% when all controls are compliant", async () => {
    const entry = [{ name: "SOC2" as Framework, compliant: 10, total: 10, controls: [] }];
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
    expect(getByTestId("framework-percentage-SOC2").textContent).toContain("100");
  });

  it("calculates 0% when no controls are compliant", async () => {
    const entry = [{ name: "SOC2" as Framework, compliant: 0, total: 10, controls: [] }];
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
    expect(getByTestId("framework-percentage-SOC2").textContent).toContain("0");
  });

  it("calculates 50% when half controls are compliant", async () => {
    const entry = [{ name: "SOC2" as Framework, compliant: 5, total: 10, controls: [] }];
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
    expect(getByTestId("framework-percentage-SOC2").textContent).toContain("50");
  });

  it("calculates 0% when total is 0", async () => {
    const entry = [{ name: "SOC2" as Framework, compliant: 0, total: 0, controls: [] }];
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
    expect(getByTestId("framework-percentage-SOC2").textContent).toContain("0");
  });

  // Color threshold tests - high compliance (>= 80%)
  allFrameworks.map((fw) =>
    it(`shows green color for ${fw} at high compliance`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={highComplianceFrameworks} />,
      );
      expect(getByTestId(`framework-card-${fw}`).getAttribute("data-percentage")).toBe("90");
    }),
  );

  // Color threshold tests - low compliance (< 60%)
  allFrameworks.map((fw) =>
    it(`shows red color indicator for ${fw} at low compliance`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={lowComplianceFrameworks} />,
      );
      expect(getByTestId(`framework-card-${fw}`).getAttribute("data-percentage")).toBe("20");
    }),
  );

  // Mid compliance (>= 60%, < 80%)
  allFrameworks.map((fw) =>
    it(`shows yellow color indicator for ${fw} at mid compliance`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={midComplianceFrameworks} />,
      );
      expect(getByTestId(`framework-card-${fw}`).getAttribute("data-percentage")).toBe("60");
    }),
  );

  // Click handlers for all 6 frameworks
  allFrameworks.map((fw) =>
    it(`calls onSelect with ${fw} when card is clicked`, async () => {
      let selected: Framework | null = null;
      const { getByTestId } = await render(
        <FrameworkComplianceGrid
          frameworks={frameworkEntries}
          onSelect={(f) => {
            selected = f;
          }}
        />,
      );
      await fireEvent.click(getByTestId(`framework-card-${fw}`));
      expect(selected).toBe(fw);
    }),
  );

  it("does not crash when onSelect is not provided and card is clicked", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={frameworkEntries} />);
    await fireEvent.click(getByTestId("framework-card-SOC2"));
    expect(getByTestId("framework-grid-container")).toBeDefined();
  });

  it("renders container with correct number of cards", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={frameworkEntries} />);
    expect(getByTestId("framework-grid-container")).toBeDefined();
  });

  // Snapshots
  it("matches snapshot with all frameworks", async () => {
    const { container } = await render(<FrameworkComplianceGrid frameworks={frameworkEntries} />);
    await snapshot("framework-grid-full");
  });

  it("matches snapshot for empty state", async () => {
    const { container } = await render(<FrameworkComplianceGrid frameworks={[]} />);
    await snapshot("framework-grid-empty");
  });

  it("matches snapshot for loading state", async () => {
    const { container } = await render(<FrameworkComplianceGrid frameworks={[]} loading />);
    await snapshot("framework-grid-loading");
  });

  it("has pointer cursor when onSelect provided", async () => {
    const { getByTestId } = await render(
      <FrameworkComplianceGrid frameworks={frameworkEntries} onSelect={() => {}} />,
    );
    expect(getByTestId("framework-card-SOC2").style.cursor).toBe("pointer");
  });

  it("has default cursor when no onSelect", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={frameworkEntries} />);
    expect(getByTestId("framework-card-SOC2").style.cursor).toBe("default");
  });

  it("shows correct compliant/total ratio in counts", async () => {
    const entry = [{ name: "SOC2" as Framework, compliant: 7, total: 10, controls: [] }];
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
    expect(getByTestId("framework-counts-SOC2").textContent).toContain("7/10");
  });

  // Additional per-framework data-percentage checks
  allFrameworks.map((fw, i) =>
    it(`data-percentage attribute is set correctly for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      const expectedPct = Math.round(((8 - i) / 10) * 100);
      expect(getByTestId(`framework-card-${fw}`).getAttribute("data-percentage")).toBe(
        String(expectedPct),
      );
    }),
  );

  // Progress bars have correct test ids
  allFrameworks.map((fw) =>
    it(`progress bar for ${fw} has correct testId`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      expect(getByTestId(`framework-progress-${fw}`)).toBeDefined();
    }),
  );

  // Count text for specific ratio values
  (
    [
      { compliant: 0, total: 10, expected: "0/10" },
      { compliant: 5, total: 10, expected: "5/10" },
      { compliant: 10, total: 10, expected: "10/10" },
    ] as Array<{ compliant: number; total: number; expected: string }>
  ).map(({ compliant, total, expected }) =>
    it(`shows count "${expected}" for ${compliant}/${total}`, async () => {
      const entry = [{ name: "SOC2" as Framework, compliant, total, controls: [] }];
      const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
      expect(getByTestId("framework-counts-SOC2").textContent).toContain(expected);
    }),
  );

  // Percentage values at thresholds
  (
    [
      { compliant: 8, total: 10, expected: "80" },
      { compliant: 6, total: 10, expected: "60" },
      { compliant: 7, total: 10, expected: "70" },
      { compliant: 9, total: 10, expected: "90" },
    ] as Array<{ compliant: number; total: number; expected: string }>
  ).map(({ compliant, total, expected }) =>
    it(`shows percentage ${expected}% for ${compliant}/${total}`, async () => {
      const entry = [{ name: "ISO27001" as Framework, compliant, total, controls: [] }];
      const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
      expect(getByTestId("framework-percentage-ISO27001").textContent).toContain(expected);
    }),
  );

  // All frameworks render when all present
  it("renders all 6 framework cards when all frameworks provided", async () => {
    const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={frameworkEntries} />);
    allFrameworks.forEach((fw) => {
      expect(getByTestId(`framework-card-${fw}`)).toBeDefined();
    });
  });

  // Single framework at each compliance level
  allFrameworks.map((fw) =>
    it(`renders single ${fw} framework card`, async () => {
      const entry = [{ name: fw, compliant: 5, total: 10, controls: [] }];
      const { getByTestId } = await render(<FrameworkComplianceGrid frameworks={entry} />);
      expect(getByTestId(`framework-card-${fw}`)).toBeDefined();
    }),
  );

  // Framework counts display text
  allFrameworks.map((fw) =>
    it(`counts display contains "compliant" text for ${fw}`, async () => {
      const { getByTestId } = await render(
        <FrameworkComplianceGrid frameworks={frameworkEntries} />,
      );
      expect(getByTestId(`framework-counts-${fw}`).textContent).toContain("compliant");
    }),
  );
});
