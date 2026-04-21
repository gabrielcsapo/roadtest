import { describe, it, expect } from "fieldtest";
import {
  groupBy,
  unique,
  uniqueBy,
  chunk,
  flatten,
  intersection,
  difference,
  countBy,
  sumBy,
  maxBy,
  minBy,
} from "./array";

describe("array", () => {
  describe("groupBy", () => {
    const people = [
      { name: "Alice", dept: "Engineering" },
      { name: "Bob", dept: "Engineering" },
      { name: "Charlie", dept: "Marketing" },
      { name: "Diana", dept: "Marketing" },
      { name: "Eve", dept: "Sales" },
    ];

    it("groups by string key", () => {
      const result = groupBy(people, "dept");
      expect(result["Engineering"]).toHaveLength(2);
      expect(result["Marketing"]).toHaveLength(2);
      expect(result["Sales"]).toHaveLength(1);
    });

    it("creates correct groups", () => {
      const result = groupBy(people, "dept");
      expect(result["Engineering"][0].name).toBe("Alice");
    });

    it("handles empty array", () => {
      expect(groupBy([], "dept")).toEqual({});
    });

    it("handles all same key", () => {
      const arr = [
        { k: "a", v: 1 },
        { k: "a", v: 2 },
      ];
      expect(groupBy(arr, "k")["a"]).toHaveLength(2);
    });

    it("handles all unique keys", () => {
      const arr = [{ k: "a" }, { k: "b" }, { k: "c" }];
      const result = groupBy(arr, "k");
      expect(Object.keys(result)).toHaveLength(3);
    });

    it("does not mutate original", () => {
      groupBy(people, "dept");
      expect(people).toHaveLength(5);
    });

    it("preserves all items in groups", () => {
      const result = groupBy(people, "dept");
      const total = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
      expect(total).toBe(5);
    });

    it("groups by numeric field (converted to string)", () => {
      const arr = [
        { score: 90, name: "A" },
        { score: 90, name: "B" },
        { score: 80, name: "C" },
      ];
      const result = groupBy(arr, "score");
      expect(result["90"]).toHaveLength(2);
      expect(result["80"]).toHaveLength(1);
    });

    const sizes = [1, 2, 3, 5, 10];
    for (const size of sizes) {
      it(`groupBy with ${size} unique groups`, () => {
        const arr = Array.from({ length: size }, (_, i) => ({ group: `g${i}`, val: i }));
        const result = groupBy(arr, "group");
        expect(Object.keys(result)).toHaveLength(size);
      });
    }
  });

  describe("unique", () => {
    const cases = [
      { input: [1, 2, 3, 1, 2], expected: [1, 2, 3] },
      { input: [1, 1, 1], expected: [1] },
      { input: [], expected: [] },
      { input: [1], expected: [1] },
      { input: ["a", "b", "a", "c"], expected: ["a", "b", "c"] },
      { input: [true, false, true], expected: [true, false] },
      { input: [1, 2, 3], expected: [1, 2, 3] },
    ];
    for (const c of cases) {
      it(`unique([${c.input}]) = [${c.expected}]`, () => {
        expect(unique(c.input)).toEqual(c.expected);
      });
    }
    it("does not mutate original", () => {
      const arr = [1, 2, 1];
      unique(arr);
      expect(arr).toHaveLength(3);
    });
    it("preserves order of first occurrence", () => {
      expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
    });

    const countCases = [4, 10, 20];
    for (const n of countCases) {
      it(`unique removes duplicates from ${n}-element array with half unique`, () => {
        const arr = Array.from({ length: n }, (_, i) => i % (n / 2));
        expect(unique(arr)).toHaveLength(n / 2);
      });
    }
  });

  describe("uniqueBy", () => {
    const items = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "1", name: "Alice Duplicate" },
      { id: "3", name: "Charlie" },
    ];

    it("removes duplicates by key", () => {
      expect(uniqueBy(items, "id")).toHaveLength(3);
    });

    it("keeps first occurrence", () => {
      const result = uniqueBy(items, "id");
      expect(result.find((i) => i.id === "1")?.name).toBe("Alice");
    });

    it("handles empty array", () => {
      expect(uniqueBy([], "id")).toHaveLength(0);
    });

    it("handles all unique", () => {
      const arr = [{ id: "a" }, { id: "b" }, { id: "c" }];
      expect(uniqueBy(arr, "id")).toHaveLength(3);
    });

    it("handles all same key", () => {
      const arr = [{ id: "same" }, { id: "same" }, { id: "same" }];
      expect(uniqueBy(arr, "id")).toHaveLength(1);
    });

    it("does not mutate original", () => {
      uniqueBy(items, "id");
      expect(items).toHaveLength(4);
    });
  });

  describe("chunk", () => {
    const cases = [
      { arr: [1, 2, 3, 4, 5], size: 2, expected: [[1, 2], [3, 4], [5]] },
      {
        arr: [1, 2, 3, 4],
        size: 2,
        expected: [
          [1, 2],
          [3, 4],
        ],
      },
      { arr: [1], size: 1, expected: [[1]] },
      { arr: [], size: 2, expected: [] },
      { arr: [1, 2, 3], size: 10, expected: [[1, 2, 3]] },
      {
        arr: [1, 2, 3, 4, 5, 6],
        size: 3,
        expected: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      },
    ];
    for (const c of cases) {
      it(`chunk([${c.arr}], ${c.size})`, () => {
        expect(chunk(c.arr, c.size)).toEqual(c.expected);
      });
    }
    it("returns empty for size <= 0", () => {
      expect(chunk([1, 2, 3], 0)).toHaveLength(0);
    });
    it("does not mutate original", () => {
      const arr = [1, 2, 3];
      chunk(arr, 2);
      expect(arr).toHaveLength(3);
    });
    it("all items preserved across chunks", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      const flat = result.flat();
      expect(flat).toHaveLength(5);
    });

    for (let size = 1; size <= 5; size++) {
      it(`chunk 10 items by ${size}`, () => {
        const arr = Array.from({ length: 10 }, (_, i) => i);
        const result = chunk(arr, size);
        expect(result.length).toBe(Math.ceil(10 / size));
      });
    }
  });

  describe("flatten", () => {
    const cases = [
      {
        input: [
          [1, 2],
          [3, 4],
        ],
        expected: [1, 2, 3, 4],
      },
      { input: [[1], [2], [3]], expected: [1, 2, 3] },
      { input: [[], [1, 2]], expected: [1, 2] },
      { input: [[], []], expected: [] },
      { input: [[1, 2, 3]], expected: [1, 2, 3] },
      { input: [], expected: [] },
    ];
    for (const c of cases) {
      it(`flatten(${JSON.stringify(c.input)}) = ${JSON.stringify(c.expected)}`, () => {
        expect(flatten(c.input)).toEqual(c.expected);
      });
    }
    it("preserves all elements", () => {
      const arr = [[1, 2], [3, 4], [5]];
      expect(flatten(arr)).toHaveLength(5);
    });
    it("does not mutate original", () => {
      const arr = [
        [1, 2],
        [3, 4],
      ];
      flatten(arr);
      expect(arr).toHaveLength(2);
    });
  });

  describe("intersection", () => {
    const cases = [
      { a: [1, 2, 3], b: [2, 3, 4], expected: [2, 3] },
      { a: [1, 2, 3], b: [4, 5, 6], expected: [] },
      { a: [], b: [1, 2], expected: [] },
      { a: [1, 2], b: [], expected: [] },
      { a: [1, 2, 3], b: [1, 2, 3], expected: [1, 2, 3] },
      { a: ["a", "b", "c"], b: ["b", "c", "d"], expected: ["b", "c"] },
    ];
    for (const c of cases) {
      it(`intersection([${c.a}], [${c.b}]) = [${c.expected}]`, () => {
        expect(intersection(c.a, c.b)).toEqual(c.expected);
      });
    }
    it("does not mutate originals", () => {
      const a = [1, 2, 3];
      const b = [2, 3, 4];
      intersection(a, b);
      expect(a).toHaveLength(3);
      expect(b).toHaveLength(3);
    });
  });

  describe("difference", () => {
    const cases = [
      { a: [1, 2, 3], b: [2, 3], expected: [1] },
      { a: [1, 2, 3], b: [], expected: [1, 2, 3] },
      { a: [], b: [1, 2], expected: [] },
      { a: [1, 2, 3], b: [1, 2, 3], expected: [] },
      { a: ["a", "b", "c"], b: ["b"], expected: ["a", "c"] },
    ];
    for (const c of cases) {
      it(`difference([${c.a}], [${c.b}]) = [${c.expected}]`, () => {
        expect(difference(c.a, c.b)).toEqual(c.expected);
      });
    }
    it("does not mutate originals", () => {
      const a = [1, 2, 3];
      difference(a, [1]);
      expect(a).toHaveLength(3);
    });
  });

  describe("countBy", () => {
    const items = [
      { status: "active", dept: "eng" },
      { status: "active", dept: "eng" },
      { status: "inactive", dept: "mkt" },
    ];

    it("counts by key", () => {
      const result = countBy(items, "status");
      expect(result["active"]).toBe(2);
      expect(result["inactive"]).toBe(1);
    });

    it("handles empty array", () => {
      expect(countBy([], "status")).toEqual({});
    });

    it("counts single item", () => {
      expect(countBy([{ k: "a" }], "k")["a"]).toBe(1);
    });

    for (let n = 1; n <= 5; n++) {
      it(`countBy with ${n} identical items`, () => {
        const arr = Array.from({ length: n }, () => ({ type: "x" }));
        expect(countBy(arr, "type")["x"]).toBe(n);
      });
    }
  });

  describe("sumBy", () => {
    const items = [{ val: 1 }, { val: 2 }, { val: 3 }];

    it("sums by key", () => {
      expect(sumBy(items, "val")).toBe(6);
    });

    it("returns 0 for empty array", () => {
      expect(sumBy([], "val")).toBe(0);
    });

    it("sums single item", () => {
      expect(sumBy([{ val: 42 }], "val")).toBe(42);
    });

    it("handles negative values", () => {
      expect(sumBy([{ val: -1 }, { val: 3 }], "val")).toBe(2);
    });

    const sumCases = [
      { arr: [1, 2, 3, 4, 5], expected: 15 },
      { arr: [10, 20, 30], expected: 60 },
      { arr: [0, 0, 0], expected: 0 },
      { arr: [100], expected: 100 },
    ];
    for (const c of sumCases) {
      it(`sumBy([${c.arr}]) = ${c.expected}`, () => {
        const arr = c.arr.map((v) => ({ val: v }));
        expect(sumBy(arr, "val")).toBe(c.expected);
      });
    }
  });

  describe("maxBy", () => {
    it("returns item with max value", () => {
      const arr = [{ val: 1 }, { val: 5 }, { val: 3 }];
      expect(maxBy(arr, "val")?.val).toBe(5);
    });

    it("returns undefined for empty array", () => {
      expect(maxBy([], "val")).toBeUndefined();
    });

    it("returns single item for single-element array", () => {
      expect(maxBy([{ val: 42 }], "val")?.val).toBe(42);
    });

    const maxCases = [
      { arr: [3, 1, 4, 1, 5, 9, 2, 6], expected: 9 },
      { arr: [100, 200, 150], expected: 200 },
      { arr: [-1, -2, -3], expected: -1 },
    ];
    for (const c of maxCases) {
      it(`maxBy([${c.arr}]) = ${c.expected}`, () => {
        const arr = c.arr.map((v) => ({ val: v }));
        expect(maxBy(arr, "val")?.val).toBe(c.expected);
      });
    }
  });

  describe("minBy", () => {
    it("returns item with min value", () => {
      const arr = [{ val: 5 }, { val: 1 }, { val: 3 }];
      expect(minBy(arr, "val")?.val).toBe(1);
    });

    it("returns undefined for empty array", () => {
      expect(minBy([], "val")).toBeUndefined();
    });

    it("returns single item for single-element array", () => {
      expect(minBy([{ val: 42 }], "val")?.val).toBe(42);
    });

    const minCases = [
      { arr: [3, 1, 4, 1, 5, 9, 2, 6], expected: 1 },
      { arr: [100, 200, 150], expected: 100 },
      { arr: [-1, -2, -3], expected: -3 },
    ];
    for (const c of minCases) {
      it(`minBy([${c.arr}]) = ${c.expected}`, () => {
        const arr = c.arr.map((v) => ({ val: v }));
        expect(minBy(arr, "val")?.val).toBe(c.expected);
      });
    }
  });

  describe("groupBy - comprehensive", () => {
    for (let n = 1; n <= 5; n++) {
      it(`groupBy with ${n} items in same group returns group of ${n}`, () => {
        const arr = Array.from({ length: n }, (_, i) => ({ grp: "a", val: i }));
        expect(groupBy(arr, "grp")["a"]).toHaveLength(n);
      });
    }
    it("groupBy preserves insertion order of items within group", () => {
      const arr = [
        { grp: "a", val: 1 },
        { grp: "a", val: 2 },
      ];
      const result = groupBy(arr, "grp");
      expect(result["a"][0].val).toBe(1);
      expect(result["a"][1].val).toBe(2);
    });
    it("groupBy result has correct key count", () => {
      const arr = [{ k: "x" }, { k: "y" }, { k: "x" }, { k: "z" }];
      expect(Object.keys(groupBy(arr, "k"))).toHaveLength(3);
    });
  });

  describe("chunk - comprehensive", () => {
    for (let size = 1; size <= 5; size++) {
      it(`chunk 20 items by ${size} gives ${Math.ceil(20 / size)} chunks`, () => {
        const arr = Array.from({ length: 20 }, (_, i) => i);
        const result = chunk(arr, size);
        expect(result.length).toBe(Math.ceil(20 / size));
      });
    }
    it("first chunk always starts at index 0", () => {
      const arr = [1, 2, 3, 4, 5];
      const result = chunk(arr, 2);
      expect(result[0][0]).toBe(1);
    });
  });

  describe("unique - comprehensive", () => {
    for (let n = 1; n <= 10; n++) {
      it(`unique removes ${n} duplicates from 2*n array`, () => {
        const arr = [
          ...Array.from({ length: n }, (_, i) => i),
          ...Array.from({ length: n }, (_, i) => i),
        ];
        expect(unique(arr)).toHaveLength(n);
      });
    }
  });

  describe("sumBy - comprehensive", () => {
    for (let n = 1; n <= 10; n++) {
      it(`sumBy of ${n} items each with value 10 = ${n * 10}`, () => {
        const arr = Array.from({ length: n }, () => ({ val: 10 }));
        expect(sumBy(arr, "val")).toBe(n * 10);
      });
    }
  });

  describe("intersection and difference - additional", () => {
    it("intersection of disjoint sets is empty", () => {
      expect(intersection([1, 2, 3], [4, 5, 6])).toHaveLength(0);
    });
    it("intersection of identical sets returns same set", () => {
      expect(intersection([1, 2, 3], [1, 2, 3])).toHaveLength(3);
    });
    it("difference of same sets is empty", () => {
      expect(difference([1, 2, 3], [1, 2, 3])).toHaveLength(0);
    });
    it("difference with empty second set returns first set", () => {
      expect(difference([1, 2, 3], [])).toHaveLength(3);
    });
    it("difference [1,2,3] - [2] = [1,3]", () => {
      expect(difference([1, 2, 3], [2])).toEqual([1, 3]);
    });
    it("difference [1,2,3] - [1,3] = [2]", () => {
      expect(difference([1, 2, 3], [1, 3])).toEqual([2]);
    });
    it("intersection [1,2,3] ∩ [2,3,4] = [2,3]", () => {
      expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    });
    it("intersection returns items in order of first array", () => {
      const result = intersection([5, 3, 1, 4, 2], [2, 4]);
      expect(result[0]).toBe(4);
      expect(result[1]).toBe(2);
    });
  });

  describe("flatten - additional cases", () => {
    for (let n = 1; n <= 5; n++) {
      it(`flatten ${n} chunks of 3 items = ${n * 3} items`, () => {
        const arr = Array.from({ length: n }, () => [1, 2, 3]);
        expect(flatten(arr)).toHaveLength(n * 3);
      });
    }
    it("flatten empty nested arrays returns empty", () => {
      expect(flatten([[], [], []])).toHaveLength(0);
    });
    it("flatten preserves item order", () => {
      const result = flatten([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });
    it("flatten single chunk returns same items", () => {
      const result = flatten([[1, 2, 3]]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("uniqueBy - additional cases", () => {
    for (let n = 1; n <= 5; n++) {
      it(`uniqueBy with ${n} unique values returns ${n} items`, () => {
        const arr = Array.from({ length: n }, (_, i) => ({ id: String(i), val: i }));
        expect(uniqueBy(arr, "id")).toHaveLength(n);
      });
    }
    it("uniqueBy with all duplicates returns 1 item", () => {
      const arr = Array.from({ length: 10 }, () => ({ id: "same", val: 1 }));
      expect(uniqueBy(arr, "id")).toHaveLength(1);
    });
  });

  describe("countBy - additional cases", () => {
    it("countBy returns object type", () => {
      expect(typeof countBy([{ k: "a" }], "k")).toBe("object");
    });
    it("countBy with mixed keys has correct total", () => {
      const arr = [{ type: "a" }, { type: "a" }, { type: "b" }, { type: "c" }];
      const result = countBy(arr, "type");
      const total = Object.values(result).reduce((a, b) => a + b, 0);
      expect(total).toBe(4);
    });
    it("countBy with 10 same-key items", () => {
      const arr = Array.from({ length: 10 }, () => ({ k: "x" }));
      expect(countBy(arr, "k")["x"]).toBe(10);
    });
  });

  describe("maxBy and minBy - additional", () => {
    it("maxBy returns object with max numeric field", () => {
      const arr = [{ v: 7 }, { v: 2 }, { v: 9 }, { v: 1 }];
      expect(maxBy(arr, "v")?.v).toBe(9);
    });
    it("minBy returns object with min numeric field", () => {
      const arr = [{ v: 7 }, { v: 2 }, { v: 9 }, { v: 1 }];
      expect(minBy(arr, "v")?.v).toBe(1);
    });
    it("maxBy with single item returns that item", () => {
      expect(maxBy([{ v: 5 }], "v")?.v).toBe(5);
    });
    it("minBy with single item returns that item", () => {
      expect(minBy([{ v: 5 }], "v")?.v).toBe(5);
    });
    it("maxBy handles large array", () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ v: i }));
      expect(maxBy(arr, "v")?.v).toBe(99);
    });
    it("minBy handles large array", () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ v: i }));
      expect(minBy(arr, "v")?.v).toBe(0);
    });
  });
});

describe("groupBy - systematic tests", () => {
  const groupCases = [
    { items: [{ k: "a" }, { k: "b" }, { k: "a" }], key: "k", group: "a", count: 2 },
    { items: [{ k: "x" }, { k: "y" }, { k: "z" }], key: "k", group: "x", count: 1 },
    { items: [{ k: "a" }, { k: "a" }, { k: "a" }], key: "k", group: "a", count: 3 },
    { items: [{ k: "b" }, { k: "a" }, { k: "b" }, { k: "a" }], key: "k", group: "b", count: 2 },
    { items: [{ k: "c" }], key: "k", group: "c", count: 1 },
  ];
  for (const c of groupCases) {
    it(`groupBy groups "${c.group}" has ${c.count} items`, () => {
      expect(groupBy(c.items, c.key)[c.group]).toHaveLength(c.count);
    });
  }
});

describe("unique - systematic tests", () => {
  const uniqueCases = [
    { input: [1, 2, 3], expected: 3 },
    { input: [1, 1, 1], expected: 1 },
    { input: [1, 2, 1, 3], expected: 3 },
    { input: ["a", "b", "a"], expected: 2 },
    { input: [true, false, true], expected: 2 },
    { input: [], expected: 0 },
    { input: [null, null], expected: 1 },
    { input: [0, 0, 0, 1], expected: 2 },
  ];
  for (const c of uniqueCases) {
    it(`unique([${String(c.input).slice(0, 20)}]) has ${c.expected} unique items`, () => {
      expect(unique(c.input as unknown[])).toHaveLength(c.expected);
    });
  }
});

describe("chunk - with various data types", () => {
  const chunkCases = [
    { input: ["a", "b", "c", "d"], size: 2, expectedChunks: 2 },
    { input: [1, 2, 3, 4, 5], size: 3, expectedChunks: 2 },
    { input: [true, false, true], size: 1, expectedChunks: 3 },
    { input: [1, 2, 3, 4, 5, 6], size: 6, expectedChunks: 1 },
    { input: [1], size: 5, expectedChunks: 1 },
  ];
  for (const c of chunkCases) {
    it(`chunk([${c.input}], ${c.size}) gives ${c.expectedChunks} chunks`, () => {
      expect(chunk(c.input, c.size)).toHaveLength(c.expectedChunks);
    });
  }
});

describe("sumBy - various values", () => {
  const sumCases = [
    { vals: [1, 2, 3, 4, 5], expected: 15 },
    { vals: [10, 20, 30], expected: 60 },
    { vals: [100, -100], expected: 0 },
    { vals: [0.5, 0.5], expected: 1 },
    { vals: [1], expected: 1 },
    { vals: [0], expected: 0 },
    { vals: [-5, -5], expected: -10 },
  ];
  for (const c of sumCases) {
    it(`sumBy([${c.vals}]) = ${c.expected}`, () => {
      const arr = c.vals.map((v) => ({ val: v }));
      expect(sumBy(arr, "val")).toBe(c.expected);
    });
  }
});

describe("intersection - various cases", () => {
  const intCases = [
    { a: [1, 2, 3], b: [2, 3, 4], expected: [2, 3] },
    { a: ["a", "b"], b: ["b", "c"], expected: ["b"] },
    { a: [1, 2, 3], b: [4, 5, 6], expected: [] },
    { a: [], b: [1, 2], expected: [] },
    { a: [1, 2], b: [], expected: [] },
  ];
  for (const c of intCases) {
    it(`intersection([${c.a}], [${c.b}]) = [${c.expected}]`, () => {
      expect(intersection(c.a, c.b)).toEqual(c.expected);
    });
  }
});

describe("difference - various cases", () => {
  const diffCases = [
    { a: [1, 2, 3], b: [2], expected: [1, 3] },
    { a: [1, 2, 3], b: [1, 2, 3], expected: [] },
    { a: [1, 2, 3], b: [], expected: [1, 2, 3] },
    { a: [], b: [1, 2], expected: [] },
    { a: ["a", "b", "c"], b: ["b"], expected: ["a", "c"] },
  ];
  for (const c of diffCases) {
    it(`difference([${c.a}], [${c.b}]) = [${c.expected}]`, () => {
      expect(difference(c.a, c.b)).toEqual(c.expected);
    });
  }
});
