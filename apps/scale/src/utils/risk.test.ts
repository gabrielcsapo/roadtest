import { describe, it, expect } from "fieldtest";
import {
  riskToColor,
  riskToLabel,
  riskToScore,
  scoreToRisk,
  compareRisk,
  isHighRisk,
  riskLevels,
} from "./risk";
import type { Risk } from "../types";

describe("risk", () => {
  const allRisks: Risk[] = ["low", "medium", "high", "critical"];

  describe("riskLevels array", () => {
    it("contains all four risk levels", () => {
      expect(riskLevels).toHaveLength(4);
    });
    it("starts with low", () => {
      expect(riskLevels[0]).toBe("low");
    });
    it("second element is medium", () => {
      expect(riskLevels[1]).toBe("medium");
    });
    it("third element is high", () => {
      expect(riskLevels[2]).toBe("high");
    });
    it("ends with critical", () => {
      expect(riskLevels[3]).toBe("critical");
    });
    it("contains low", () => {
      expect(riskLevels).toContain("low");
    });
    it("contains medium", () => {
      expect(riskLevels).toContain("medium");
    });
    it("contains high", () => {
      expect(riskLevels).toContain("high");
    });
    it("contains critical", () => {
      expect(riskLevels).toContain("critical");
    });
    it("riskLevels is an array", () => {
      expect(Array.isArray(riskLevels)).toBeTruthy();
    });
  });

  describe("riskToColor", () => {
    const cases: { risk: Risk; color: string }[] = [
      { risk: "low", color: "#22c55e" },
      { risk: "medium", color: "#f59e0b" },
      { risk: "high", color: "#ef4444" },
      { risk: "critical", color: "#7c3aed" },
    ];
    for (const c of cases) {
      it(`riskToColor("${c.risk}") returns "${c.color}"`, () => {
        expect(riskToColor(c.risk)).toBe(c.color);
      });
    }
    it("returns a string for all risk levels", () => {
      for (const risk of allRisks) {
        expect(typeof riskToColor(risk)).toBe("string");
      }
    });
    it("returns different colors for different risk levels", () => {
      const colors = allRisks.map(riskToColor);
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
    for (const risk of allRisks) {
      it(`riskToColor("${risk}") starts with #`, () => {
        expect(riskToColor(risk).startsWith("#")).toBeTruthy();
      });
    }
    it("low risk color is green (#22c55e)", () => {
      expect(riskToColor("low")).toBe("#22c55e");
    });
    it("medium risk color is amber (#f59e0b)", () => {
      expect(riskToColor("medium")).toBe("#f59e0b");
    });
    it("high risk color is red (#ef4444)", () => {
      expect(riskToColor("high")).toBe("#ef4444");
    });
    it("critical risk color is purple (#7c3aed)", () => {
      expect(riskToColor("critical")).toBe("#7c3aed");
    });
    it("riskToColor returns 7-character hex for low", () => {
      expect(riskToColor("low").length).toBe(7);
    });
    it("riskToColor returns 7-character hex for medium", () => {
      expect(riskToColor("medium").length).toBe(7);
    });
    it("riskToColor returns 7-character hex for high", () => {
      expect(riskToColor("high").length).toBe(7);
    });
    it("riskToColor returns 7-character hex for critical", () => {
      expect(riskToColor("critical").length).toBe(7);
    });
  });

  describe("riskToLabel", () => {
    const cases: { risk: Risk; label: string }[] = [
      { risk: "low", label: "Low" },
      { risk: "medium", label: "Medium" },
      { risk: "high", label: "High" },
      { risk: "critical", label: "Critical" },
    ];
    for (const c of cases) {
      it(`riskToLabel("${c.risk}") returns "${c.label}"`, () => {
        expect(riskToLabel(c.risk)).toBe(c.label);
      });
    }
    for (const risk of allRisks) {
      it(`riskToLabel("${risk}") returns capitalized string`, () => {
        const label = riskToLabel(risk);
        expect(label[0]).toBe(label[0].toUpperCase());
      });
    }
    for (const risk of allRisks) {
      it(`riskToLabel("${risk}") is non-empty`, () => {
        expect(riskToLabel(risk).length).toBeGreaterThan(0);
      });
    }
    it("returns different labels for different risk levels", () => {
      const labels = allRisks.map(riskToLabel);
      const unique = new Set(labels);
      expect(unique.size).toBe(4);
    });
    it("riskToLabel returns string for low", () => {
      expect(typeof riskToLabel("low")).toBe("string");
    });
    it("riskToLabel returns string for critical", () => {
      expect(typeof riskToLabel("critical")).toBe("string");
    });
  });

  describe("riskToScore", () => {
    const cases: { risk: Risk; score: number }[] = [
      { risk: "low", score: 25 },
      { risk: "medium", score: 50 },
      { risk: "high", score: 75 },
      { risk: "critical", score: 100 },
    ];
    for (const c of cases) {
      it(`riskToScore("${c.risk}") returns ${c.score}`, () => {
        expect(riskToScore(c.risk)).toBe(c.score);
      });
    }
    it("scores are strictly increasing low to critical", () => {
      const scores = allRisks.map(riskToScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
    });
    for (const risk of allRisks) {
      it(`riskToScore("${risk}") returns a positive number`, () => {
        expect(riskToScore(risk)).toBeGreaterThan(0);
      });
    }
    for (const risk of allRisks) {
      it(`riskToScore("${risk}") returns a number <= 100`, () => {
        expect(riskToScore(risk)).toBeLessThan(101);
      });
    }
    it("riskToScore returns number for low", () => {
      expect(typeof riskToScore("low")).toBe("number");
    });
    it("riskToScore low (25) < medium (50)", () => {
      expect(riskToScore("low")).toBeLessThan(riskToScore("medium"));
    });
    it("riskToScore medium (50) < high (75)", () => {
      expect(riskToScore("medium")).toBeLessThan(riskToScore("high"));
    });
    it("riskToScore high (75) < critical (100)", () => {
      expect(riskToScore("high")).toBeLessThan(riskToScore("critical"));
    });
  });

  describe("scoreToRisk", () => {
    const cases: { score: number; risk: Risk }[] = [
      { score: 0, risk: "low" },
      { score: 1, risk: "low" },
      { score: 10, risk: "low" },
      { score: 25, risk: "low" },
      { score: 26, risk: "medium" },
      { score: 30, risk: "medium" },
      { score: 50, risk: "medium" },
      { score: 51, risk: "high" },
      { score: 60, risk: "high" },
      { score: 75, risk: "high" },
      { score: 76, risk: "critical" },
      { score: 90, risk: "critical" },
      { score: 100, risk: "critical" },
      { score: 200, risk: "critical" },
    ];
    for (const c of cases) {
      it(`scoreToRisk(${c.score}) returns "${c.risk}"`, () => {
        expect(scoreToRisk(c.score)).toBe(c.risk);
      });
    }
    it("scoreToRisk is inverse of riskToScore at boundary values", () => {
      for (const risk of allRisks) {
        expect(scoreToRisk(riskToScore(risk))).toBe(risk);
      }
    });
    it("scoreToRisk returns a valid risk type", () => {
      for (const score of [0, 25, 50, 75, 100]) {
        expect(allRisks).toContain(scoreToRisk(score));
      }
    });
    it('scoreToRisk(0) is "low"', () => {
      expect(scoreToRisk(0)).toBe("low");
    });
    it('scoreToRisk(100) is "critical"', () => {
      expect(scoreToRisk(100)).toBe("critical");
    });
  });

  describe("compareRisk", () => {
    const cases: { a: Risk; b: Risk; result: "negative" | "zero" | "positive" }[] = [
      { a: "low", b: "medium", result: "negative" },
      { a: "low", b: "high", result: "negative" },
      { a: "low", b: "critical", result: "negative" },
      { a: "medium", b: "high", result: "negative" },
      { a: "medium", b: "critical", result: "negative" },
      { a: "high", b: "critical", result: "negative" },
      { a: "medium", b: "low", result: "positive" },
      { a: "high", b: "low", result: "positive" },
      { a: "critical", b: "low", result: "positive" },
      { a: "high", b: "medium", result: "positive" },
      { a: "critical", b: "medium", result: "positive" },
      { a: "critical", b: "high", result: "positive" },
      { a: "low", b: "low", result: "zero" },
      { a: "medium", b: "medium", result: "zero" },
      { a: "high", b: "high", result: "zero" },
      { a: "critical", b: "critical", result: "zero" },
    ];
    for (const c of cases) {
      it(`compareRisk("${c.a}", "${c.b}") is ${c.result}`, () => {
        const val = compareRisk(c.a, c.b);
        if (c.result === "negative") expect(val).toBeLessThan(0);
        else if (c.result === "positive") expect(val).toBeGreaterThan(0);
        else expect(val).toBe(0);
      });
    }
    it("compareRisk(a, a) is always 0 for all risk levels", () => {
      for (const risk of allRisks) {
        expect(compareRisk(risk, risk)).toBe(0);
      }
    });
  });

  describe("isHighRisk", () => {
    const cases: { risk: Risk; expected: boolean }[] = [
      { risk: "low", expected: false },
      { risk: "medium", expected: false },
      { risk: "high", expected: true },
      { risk: "critical", expected: true },
    ];
    for (const c of cases) {
      it(`isHighRisk("${c.risk}") is ${c.expected}`, () => {
        if (c.expected) {
          expect(isHighRisk(c.risk)).toBeTruthy();
        } else {
          expect(isHighRisk(c.risk)).toBeFalsy();
        }
      });
    }
    it("only high and critical are high risk", () => {
      const highRiskLevels = allRisks.filter(isHighRisk);
      expect(highRiskLevels).toHaveLength(2);
    });
    it("high is high risk", () => {
      expect(isHighRisk("high")).toBeTruthy();
    });
    it("critical is high risk", () => {
      expect(isHighRisk("critical")).toBeTruthy();
    });
    it("low is not high risk", () => {
      expect(isHighRisk("low")).toBeFalsy();
    });
    it("medium is not high risk", () => {
      expect(isHighRisk("medium")).toBeFalsy();
    });
    it("isHighRisk returns boolean", () => {
      expect(typeof isHighRisk("high")).toBe("boolean");
    });
    it("highRisk filter contains high", () => {
      expect(allRisks.filter(isHighRisk)).toContain("high");
    });
    it("highRisk filter contains critical", () => {
      expect(allRisks.filter(isHighRisk)).toContain("critical");
    });
    it("highRisk filter does not contain low", () => {
      expect(allRisks.filter(isHighRisk)).not.toContain("low");
    });
    it("highRisk filter does not contain medium", () => {
      expect(allRisks.filter(isHighRisk)).not.toContain("medium");
    });
  });

  describe("riskToScore and scoreToRisk round-trip", () => {
    const roundTripCases: Risk[] = ["low", "medium", "high", "critical"];
    for (const risk of roundTripCases) {
      it(`round-trip for ${risk}: scoreToRisk(riskToScore(risk)) === risk`, () => {
        expect(scoreToRisk(riskToScore(risk))).toBe(risk);
      });
    }
    it("riskToScore(low) is 25", () => {
      expect(riskToScore("low")).toBe(25);
    });
    it("riskToScore(medium) is 50", () => {
      expect(riskToScore("medium")).toBe(50);
    });
    it("riskToScore(high) is 75", () => {
      expect(riskToScore("high")).toBe(75);
    });
    it("riskToScore(critical) is 100", () => {
      expect(riskToScore("critical")).toBe(100);
    });
    it("scoreToRisk(0) is low", () => {
      expect(scoreToRisk(0)).toBe("low");
    });
    it("scoreToRisk(25) is low", () => {
      expect(scoreToRisk(25)).toBe("low");
    });
    it("scoreToRisk(26) is medium", () => {
      expect(scoreToRisk(26)).toBe("medium");
    });
    it("scoreToRisk(50) is medium", () => {
      expect(scoreToRisk(50)).toBe("medium");
    });
    it("scoreToRisk(51) is high", () => {
      expect(scoreToRisk(51)).toBe("high");
    });
    it("scoreToRisk(75) is high", () => {
      expect(scoreToRisk(75)).toBe("high");
    });
    it("scoreToRisk(76) is critical", () => {
      expect(scoreToRisk(76)).toBe("critical");
    });
    it("scoreToRisk(100) is critical", () => {
      expect(scoreToRisk(100)).toBe("critical");
    });
    it("compareRisk low vs medium is negative", () => {
      expect(compareRisk("low", "medium")).toBeLessThan(0);
    });
    it("compareRisk critical vs low is positive", () => {
      expect(compareRisk("critical", "low")).toBeGreaterThan(0);
    });
    it("compareRisk same levels equals 0", () => {
      expect(compareRisk("high", "high")).toBe(0);
    });
    it("all riskLevels have unique scores", () => {
      const scores = allRisks.map(riskToScore);
      const unique = new Set(scores);
      expect(unique.size).toBe(4);
    });
    it("all riskLevels have unique colors", () => {
      const colors = allRisks.map(riskToColor);
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
    it("all riskLevels have unique labels", () => {
      const labels = allRisks.map(riskToLabel);
      const unique = new Set(labels);
      expect(unique.size).toBe(4);
    });
    it("riskLevels sorted by score is correct order", () => {
      const sorted = [...allRisks].sort(compareRisk);
      expect(sorted[0]).toBe("low");
      expect(sorted[3]).toBe("critical");
    });
  });
});

describe("compareRisk - comprehensive sorting", () => {
  const compareCases = [
    { a: "low", b: "low", expectedSign: 0 },
    { a: "low", b: "medium", expectedSign: -1 },
    { a: "low", b: "high", expectedSign: -1 },
    { a: "low", b: "critical", expectedSign: -1 },
    { a: "medium", b: "low", expectedSign: 1 },
    { a: "medium", b: "medium", expectedSign: 0 },
    { a: "medium", b: "high", expectedSign: -1 },
    { a: "medium", b: "critical", expectedSign: -1 },
    { a: "high", b: "low", expectedSign: 1 },
    { a: "high", b: "medium", expectedSign: 1 },
    { a: "high", b: "high", expectedSign: 0 },
    { a: "high", b: "critical", expectedSign: -1 },
    { a: "critical", b: "low", expectedSign: 1 },
    { a: "critical", b: "medium", expectedSign: 1 },
    { a: "critical", b: "high", expectedSign: 1 },
    { a: "critical", b: "critical", expectedSign: 0 },
  ] as const;
  for (const c of compareCases) {
    const desc = c.expectedSign === 0 ? "zero" : c.expectedSign > 0 ? "positive" : "negative";
    it(`compareRisk("${c.a}", "${c.b}") sign is ${desc}`, () => {
      const result = compareRisk(c.a, c.b);
      if (c.expectedSign === 0) expect(result).toBe(0);
      else if (c.expectedSign > 0) expect(result).toBeGreaterThan(0);
      else expect(result).toBeLessThan(0);
    });
  }
});

describe("riskToScore - score ordering", () => {
  it("riskToScore ordering: low < medium", () => {
    expect(riskToScore("low")).toBeLessThan(riskToScore("medium"));
  });
  it("riskToScore ordering: medium < high", () => {
    expect(riskToScore("medium")).toBeLessThan(riskToScore("high"));
  });
  it("riskToScore ordering: high < critical", () => {
    expect(riskToScore("high")).toBeLessThan(riskToScore("critical"));
  });
  it("riskToScore low is 25", () => {
    expect(riskToScore("low")).toBe(25);
  });
  it("riskToScore medium is 50", () => {
    expect(riskToScore("medium")).toBe(50);
  });
  it("riskToScore high is 75", () => {
    expect(riskToScore("high")).toBe(75);
  });
  it("riskToScore critical is 100", () => {
    expect(riskToScore("critical")).toBe(100);
  });
  it("all scores are multiples of 25", () => {
    for (const r of ["low", "medium", "high", "critical"] as const) {
      expect(riskToScore(r) % 25).toBe(0);
    }
  });
});
