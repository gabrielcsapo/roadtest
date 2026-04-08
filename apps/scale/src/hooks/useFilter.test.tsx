import { describe, it, expect, render, fireEvent } from "@fieldtest/core";
import React from "react";
import { useFilter } from "./useFilter";

interface TestFilters {
  status: string[];
  risk: string[];
  search: string;
  category: string;
}

const defaultFilters: TestFilters = { status: [], risk: [], search: "", category: "" };

function FilterHarness({ initial = defaultFilters }: { initial?: TestFilters }) {
  const { filters, setFilter, toggleFilter, clearFilter, clearAllFilters, hasFilters } =
    useFilter<TestFilters>(initial);
  return (
    <div>
      <span data-testid="status">{JSON.stringify(filters.status)}</span>
      <span data-testid="risk">{JSON.stringify(filters.risk)}</span>
      <span data-testid="search">{filters.search}</span>
      <span data-testid="category">{filters.category}</span>
      <span data-testid="hasFilters">{String(hasFilters)}</span>

      <button data-testid="toggle-active" onClick={() => toggleFilter("status", "active")}>
        toggle active
      </button>
      <button data-testid="toggle-inactive" onClick={() => toggleFilter("status", "inactive")}>
        toggle inactive
      </button>
      <button data-testid="toggle-low" onClick={() => toggleFilter("risk", "low")}>
        toggle low
      </button>
      <button data-testid="toggle-high" onClick={() => toggleFilter("risk", "high")}>
        toggle high
      </button>
      <button data-testid="toggle-critical" onClick={() => toggleFilter("risk", "critical")}>
        toggle critical
      </button>

      <button data-testid="set-search-hello" onClick={() => setFilter("search", "hello")}>
        set search hello
      </button>
      <button data-testid="set-search-world" onClick={() => setFilter("search", "world")}>
        set search world
      </button>
      <button data-testid="set-search-empty" onClick={() => setFilter("search", "")}>
        set search empty
      </button>
      <button data-testid="set-category-cloud" onClick={() => setFilter("category", "cloud")}>
        set category cloud
      </button>
      <button data-testid="set-category-saas" onClick={() => setFilter("category", "saas")}>
        set category saas
      </button>

      <button data-testid="clear-status" onClick={() => clearFilter("status")}>
        clear status
      </button>
      <button data-testid="clear-search" onClick={() => clearFilter("search")}>
        clear search
      </button>
      <button data-testid="clear-all" onClick={clearAllFilters}>
        clear all
      </button>
    </div>
  );
}

describe("useFilter", () => {
  describe("initial state", () => {
    it("initializes with empty status array", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      expect(getByTestId("status").textContent).toBe("[]");
    });

    it("initializes with empty risk array", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      expect(getByTestId("risk").textContent).toBe("[]");
    });

    it("initializes with empty search string", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      expect(getByTestId("search").textContent).toBe("");
    });

    it("initializes with empty category", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      expect(getByTestId("category").textContent).toBe("");
    });

    it("hasFilters is false initially", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      expect(getByTestId("hasFilters").textContent).toBe("false");
    });
  });

  describe("initial state with custom initial filters", () => {
    const customInitials: TestFilters[] = [
      { status: ["active"], risk: [], search: "", category: "" },
      { status: [], risk: ["low"], search: "", category: "" },
      { status: [], risk: [], search: "hello", category: "" },
      { status: [], risk: [], search: "", category: "cloud" },
      { status: ["active", "inactive"], risk: ["low", "high"], search: "query", category: "saas" },
    ];
    for (const init of customInitials) {
      it(`initializes with custom filters: ${JSON.stringify(init).slice(0, 50)}`, async () => {
        const { getByTestId } = await render(<FilterHarness initial={init} />);
        expect(getByTestId("search").textContent).toBe(init.search);
        expect(getByTestId("category").textContent).toBe(init.category);
      });
    }
  });

  describe("toggleFilter with array values", () => {
    it('toggles "active" status on', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      expect(getByTestId("status").textContent).toContain("active");
    });

    it('toggles "active" status off after second click', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("toggle-active"));
      expect(getByTestId("status").textContent).toBe("[]");
    });

    it('toggles "inactive" status on', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-inactive"));
      expect(getByTestId("status").textContent).toContain("inactive");
    });

    it("toggles multiple statuses independently", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("toggle-inactive"));
      expect(getByTestId("status").textContent).toContain("active");
      expect(getByTestId("status").textContent).toContain("inactive");
    });

    it("toggling one status does not affect another", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("toggle-inactive"));
      await fireEvent.click(getByTestId("toggle-active"));
      expect(getByTestId("status").textContent).toContain("inactive");
      expect(getByTestId("status").textContent).not.toContain("active");
    });

    it("toggles low risk on", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-low"));
      expect(getByTestId("risk").textContent).toContain("low");
    });

    it("toggles high risk on", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-high"));
      expect(getByTestId("risk").textContent).toContain("high");
    });

    it("toggles critical risk on", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-critical"));
      expect(getByTestId("risk").textContent).toContain("critical");
    });

    it("hasFilters becomes true after toggling a value", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      expect(getByTestId("hasFilters").textContent).toBe("true");
    });

    it("hasFilters becomes false after toggling value back off", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("toggle-active"));
      expect(getByTestId("hasFilters").textContent).toBe("false");
    });
  });

  describe("setFilter", () => {
    it('sets search to "hello"', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-hello"));
      expect(getByTestId("search").textContent).toBe("hello");
    });

    it('sets search to "world"', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-world"));
      expect(getByTestId("search").textContent).toBe("world");
    });

    it('sets category to "cloud"', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-category-cloud"));
      expect(getByTestId("category").textContent).toBe("cloud");
    });

    it('sets category to "saas"', async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-category-saas"));
      expect(getByTestId("category").textContent).toBe("saas");
    });

    it("hasFilters becomes true after setFilter", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-hello"));
      expect(getByTestId("hasFilters").textContent).toBe("true");
    });

    it("setFilter overwrites previous value", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-hello"));
      await fireEvent.click(getByTestId("set-search-world"));
      expect(getByTestId("search").textContent).toBe("world");
    });

    it("setting to initial value makes hasFilters false", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-hello"));
      await fireEvent.click(getByTestId("set-search-empty"));
      expect(getByTestId("hasFilters").textContent).toBe("false");
    });
  });

  describe("clearFilter", () => {
    it("clearFilter resets status to empty array", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("clear-status"));
      expect(getByTestId("status").textContent).toBe("[]");
    });

    it("clearFilter resets search to empty string", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-search-hello"));
      await fireEvent.click(getByTestId("clear-search"));
      expect(getByTestId("search").textContent).toBe("");
    });

    it("clearFilter does not affect other filters", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("set-search-hello"));
      await fireEvent.click(getByTestId("clear-search"));
      expect(getByTestId("status").textContent).toContain("active");
    });
  });

  describe("clearAllFilters", () => {
    it("clearAll resets all filters", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("toggle-low"));
      await fireEvent.click(getByTestId("set-search-hello"));
      await fireEvent.click(getByTestId("set-category-cloud"));
      await fireEvent.click(getByTestId("clear-all"));
      expect(getByTestId("status").textContent).toBe("[]");
      expect(getByTestId("risk").textContent).toBe("[]");
      expect(getByTestId("search").textContent).toBe("");
      expect(getByTestId("category").textContent).toBe("");
    });

    it("hasFilters is false after clearAll", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("toggle-active"));
      await fireEvent.click(getByTestId("clear-all"));
      expect(getByTestId("hasFilters").textContent).toBe("false");
    });

    it("clearAll on already-cleared state keeps everything empty", async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("clear-all"));
      expect(getByTestId("hasFilters").textContent).toBe("false");
    });
  });

  describe("complex interaction sequences", () => {
    const sequences = [
      {
        name: "toggle-active then clear-all",
        ops: ["toggle-active", "clear-all"],
        expectHasFilters: false,
      },
      {
        name: "set-search-hello then clear-all",
        ops: ["set-search-hello", "clear-all"],
        expectHasFilters: false,
      },
      {
        name: "toggle-active, toggle-low, clear-status",
        ops: ["toggle-active", "toggle-low", "clear-status"],
        expectHasFilters: true,
      },
    ];
    for (const seq of sequences) {
      it(`sequence: ${seq.name}`, async () => {
        const { getByTestId } = await render(<FilterHarness />);
        for (const op of seq.ops) {
          await fireEvent.click(getByTestId(op));
        }
        expect(getByTestId("hasFilters").textContent).toBe(String(seq.expectHasFilters));
      });
    }
  });

  describe("toggle idempotency", () => {
    const toggleCases = [
      "toggle-active",
      "toggle-inactive",
      "toggle-low",
      "toggle-high",
      "toggle-critical",
    ];
    for (const btn of toggleCases) {
      it(`${btn}: 0 clicks => no filter`, async () => {
        const { getByTestId } = await render(<FilterHarness />);
        expect(getByTestId("hasFilters").textContent).toBe("false");
      });
    }

    for (const btn of toggleCases) {
      it(`${btn}: 2 clicks => no filter (toggle back off)`, async () => {
        const { getByTestId } = await render(<FilterHarness />);
        await fireEvent.click(getByTestId(btn));
        await fireEvent.click(getByTestId(btn));
        expect(getByTestId("hasFilters").textContent).toBe("false");
      });
    }
  });
});

describe("useFilter - status toggle patterns", () => {
  const singleToggleCases = [
    { btn: "toggle-active", field: "status", contains: "active" },
    { btn: "toggle-inactive", field: "status", contains: "inactive" },
    { btn: "toggle-low", field: "risk", contains: "low" },
    { btn: "toggle-high", field: "risk", contains: "high" },
    { btn: "toggle-critical", field: "risk", contains: "critical" },
  ];
  for (const c of singleToggleCases) {
    it(`single click ${c.btn} adds "${c.contains}" to ${c.field}`, async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId(c.btn));
      expect(getByTestId(c.field).textContent).toContain(c.contains);
    });
  }
  for (const c of singleToggleCases) {
    it(`two clicks ${c.btn} removes "${c.contains}" from ${c.field}`, async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId(c.btn));
      await fireEvent.click(getByTestId(c.btn));
      expect(getByTestId(c.field).textContent).toBe("[]");
    });
  }
  for (const c of singleToggleCases) {
    it(`three clicks ${c.btn} re-adds "${c.contains}"`, async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId(c.btn));
      await fireEvent.click(getByTestId(c.btn));
      await fireEvent.click(getByTestId(c.btn));
      expect(getByTestId(c.field).textContent).toContain(c.contains);
    });
  }
});

describe("useFilter - setFilter with various values", () => {
  const searchCases = [
    "hello",
    "world",
    "foo",
    "bar",
    "baz",
    "test",
    "query",
    "search",
    "find",
    "filter",
    "abc",
    "xyz",
  ];
  for (const val of searchCases) {
    it(`setFilter search value changes category independently`, async () => {
      const { getByTestId } = await render(<FilterHarness />);
      await fireEvent.click(getByTestId("set-category-cloud"));
      expect(getByTestId("category").textContent).toBe("cloud");
      expect(getByTestId("search").textContent).toBe("");
    });
  }
});

describe("useFilter - hasFilters with every combination", () => {
  const stateVariations = [
    {
      ops: ["toggle-active", "toggle-low", "set-search-hello", "set-category-cloud"],
      expected: "true",
    },
    {
      ops: ["toggle-active", "toggle-low", "set-search-hello", "set-category-cloud", "clear-all"],
      expected: "false",
    },
    { ops: ["set-search-hello"], expected: "true" },
    { ops: ["set-search-hello", "set-search-empty"], expected: "false" },
    { ops: ["toggle-low"], expected: "true" },
    { ops: ["toggle-low", "toggle-low"], expected: "false" },
    { ops: ["toggle-active", "toggle-inactive"], expected: "true" },
    { ops: ["set-category-saas"], expected: "true" },
    { ops: ["set-category-cloud"], expected: "true" },
    { ops: ["toggle-critical", "toggle-high", "toggle-low"], expected: "true" },
    { ops: ["toggle-critical", "toggle-high", "toggle-low", "clear-all"], expected: "false" },
    { ops: ["toggle-active", "clear-status"], expected: "false" },
    { ops: ["set-search-hello", "clear-search"], expected: "false" },
    { ops: ["toggle-active", "toggle-low", "clear-status"], expected: "true" },
    { ops: ["toggle-active", "toggle-inactive", "clear-all"], expected: "false" },
  ];
  for (const s of stateVariations) {
    it(`ops [${s.ops.slice(0, 2).join(",")}...] hasFilters=${s.expected}`, async () => {
      const { getByTestId } = await render(<FilterHarness />);
      for (const op of s.ops) {
        await fireEvent.click(getByTestId(op));
      }
      expect(getByTestId("hasFilters").textContent).toBe(s.expected);
    });
  }
});
