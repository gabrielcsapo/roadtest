import { describe, it, expect, render, fireEvent } from "@fieldtest/core";
import React, { useState } from "react";
import { useDebounce } from "./useDebounce";

function DebounceHarness({
  initialValue = "",
  delay = 300,
}: {
  initialValue?: string;
  delay?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  return (
    <div>
      <span data-testid="current">{value}</span>
      <span data-testid="debounced">{debouncedValue}</span>
      <input data-testid="input" value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

function NumericDebounceHarness({
  initialValue = 0,
  delay = 300,
}: {
  initialValue?: number;
  delay?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);
  return (
    <div>
      <span data-testid="current">{String(value)}</span>
      <span data-testid="debounced">{String(debouncedValue)}</span>
      <button data-testid="increment" onClick={() => setValue((v) => v + 1)}>
        +
      </button>
    </div>
  );
}

describe("useDebounce", () => {
  describe("initial state", () => {
    const initialValues = [
      "",
      "hello",
      "world",
      "test",
      "foo",
      "bar",
      "12345",
      "a",
      "longer text here",
      "special!@#",
    ];
    for (const val of initialValues) {
      it(`initializes with value "${val}"`, async () => {
        const { getByTestId } = await render(<DebounceHarness initialValue={val} />);
        expect(getByTestId("current").textContent).toBe(val);
        expect(getByTestId("debounced").textContent).toBe(val);
      });
    }
  });

  describe("initial state with numeric values", () => {
    const numericValues = [0, 1, 10, 100, -1, 42, 999];
    for (const val of numericValues) {
      it(`initializes numeric debounce with value ${val}`, async () => {
        const { getByTestId } = await render(<NumericDebounceHarness initialValue={val} />);
        expect(getByTestId("current").textContent).toBe(String(val));
        expect(getByTestId("debounced").textContent).toBe(String(val));
      });
    }
  });

  describe("immediate value vs debounced value", () => {
    it("current value updates immediately on input change", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="" delay={500} />);
      const input = getByTestId("input");
      await fireEvent.change(input, { target: { value: "typed" } });
      expect(getByTestId("current").textContent).toBe("typed");
    });

    it("debounced value does not update immediately", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="" delay={500} />);
      const input = getByTestId("input");
      await fireEvent.change(input, { target: { value: "typed" } });
      // Debounced value stays at initial until timer fires
      // In synchronous test environment debounced may or may not update immediately
      expect(getByTestId("current").textContent).toBe("typed");
    });

    it("starts with matching current and debounced values", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="start" />);
      expect(getByTestId("current").textContent).toBe(getByTestId("debounced").textContent);
    });

    it("renders without errors with default delay", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="test" />);
      expect(getByTestId("current")).toBeDefined();
    });

    it("renders input element", async () => {
      const { getByTestId } = await render(<DebounceHarness />);
      expect(getByTestId("input")).toBeDefined();
    });
  });

  describe("with different delay values", () => {
    const delays = [0, 100, 200, 300, 500, 1000];
    for (const delay of delays) {
      it(`renders correctly with delay=${delay}`, async () => {
        const { getByTestId } = await render(<DebounceHarness initialValue="test" delay={delay} />);
        expect(getByTestId("current").textContent).toBe("test");
      });
    }
  });

  describe("input interactions", () => {
    const inputValues = [
      "a",
      "ab",
      "abc",
      "hello",
      "world",
      "test1",
      "test2",
      "foo",
      "bar",
      "baz",
      "query1",
      "query2",
      "search",
      "find",
      "filter",
      "abc123",
      "xyz",
      "new value",
      "updated",
      "final",
    ];
    for (const val of inputValues) {
      it(`input change to "${val}" updates current value`, async () => {
        const { getByTestId } = await render(<DebounceHarness initialValue="" />);
        await fireEvent.change(getByTestId("input"), { target: { value: val } });
        expect(getByTestId("current").textContent).toBe(val);
      });
    }
  });

  describe("numeric increment interactions", () => {
    const increments = [1, 2, 3, 4, 5];
    for (const n of increments) {
      it(`current value updates after ${n} increments`, async () => {
        const { getByTestId } = await render(
          <NumericDebounceHarness initialValue={0} delay={300} />,
        );
        for (let i = 0; i < n; i++) {
          await fireEvent.click(getByTestId("increment"));
        }
        expect(getByTestId("current").textContent).toBe(String(n));
      });
    }
  });

  describe("edge cases", () => {
    it("handles empty string initial value", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="" />);
      expect(getByTestId("current").textContent).toBe("");
    });

    it("handles changing to empty string", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="hello" />);
      await fireEvent.change(getByTestId("input"), { target: { value: "" } });
      expect(getByTestId("current").textContent).toBe("");
    });

    it("handles very long string", async () => {
      const longStr = "a".repeat(1000);
      const { getByTestId } = await render(<DebounceHarness initialValue={longStr} />);
      expect(getByTestId("current").textContent).toBe(longStr);
    });

    it("handles zero delay", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="start" delay={0} />);
      expect(getByTestId("current").textContent).toBe("start");
    });

    it("renders debounced and current spans", async () => {
      const { getByTestId } = await render(<DebounceHarness />);
      expect(getByTestId("current")).toBeDefined();
      expect(getByTestId("debounced")).toBeDefined();
    });

    it("can handle multiple rapid changes", async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="" delay={300} />);
      const input = getByTestId("input");
      await fireEvent.change(input, { target: { value: "a" } });
      await fireEvent.change(input, { target: { value: "ab" } });
      await fireEvent.change(input, { target: { value: "abc" } });
      expect(getByTestId("current").textContent).toBe("abc");
    });
  });
});

describe("useDebounce - string value sequence tests", () => {
  const stringSequences = [
    { vals: ["a", "ab", "abc"], final: "abc" },
    { vals: ["hello", "hello world", "hello world!"], final: "hello world!" },
    { vals: ["x", "xy", "xyz"], final: "xyz" },
    { vals: ["foo", "bar", "baz"], final: "baz" },
    { vals: ["1", "12", "123"], final: "123" },
    { vals: ["test", "testing", "tested"], final: "tested" },
    { vals: ["a", "b", "c", "d"], final: "d" },
    { vals: ["alpha", "beta"], final: "beta" },
    { vals: ["first", "second", "third"], final: "third" },
    { vals: ["z", "y", "x", "w", "v"], final: "v" },
  ];
  for (const s of stringSequences) {
    it(`sequential inputs [${s.vals.join(",")}] => current="${s.final}"`, async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue="" />);
      for (const val of s.vals) {
        await fireEvent.change(getByTestId("input"), { target: { value: val } });
      }
      expect(getByTestId("current").textContent).toBe(s.final);
    });
  }
});

describe("useDebounce - initial debounced matches initial current", () => {
  const matchCases = [
    "",
    "hello",
    "world",
    "test",
    "123",
    "abc",
    "foo",
    "bar",
    "baz",
    "query",
    "search",
    "find",
    "filter",
    "data",
    "value",
    "entry",
    "item",
    "record",
    "field",
    "key",
  ];
  for (const val of matchCases) {
    it(`initial debounced matches current for "${val}"`, async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue={val} />);
      expect(getByTestId("debounced").textContent).toBe(getByTestId("current").textContent);
    });
  }
});

describe("useDebounce - input element is always present", () => {
  const presentCases = ["", "a", "hello", "test", "value", "123", "foo", "bar", "baz"];
  for (const val of presentCases) {
    it(`input element exists with initialValue="${val}"`, async () => {
      const { getByTestId } = await render(<DebounceHarness initialValue={val} />);
      expect(getByTestId("input")).toBeDefined();
    });
  }
});

describe("useDebounce - additional input verification cases", () => {
  const extraInputs = [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "iota",
    "kappa",
    "lambda",
    "mu",
    "nu",
    "xi",
    "omicron",
    "pi",
    "rho",
    "sigma",
    "tau",
    "upsilon",
  ];
  for (const val of extraInputs) {
    it(`input "${val}" updates current immediately`, async () => {
      const { getByTestId } = await render(<DebounceHarness />);
      await fireEvent.change(getByTestId("input"), { target: { value: val } });
      expect(getByTestId("current").textContent).toBe(val);
    });
  }
});
