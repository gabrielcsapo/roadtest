import { describe, it, expect } from "roadtest";
import {
  sortByField,
  sortByMultiple,
  sortByRisk,
  sortByStatus,
  sortByDate,
  naturalSort,
} from "./sort";

describe("sort", () => {
  describe("sortByField - string fields", () => {
    const people = [
      { name: "Charlie", age: 30 },
      { name: "Alice", age: 25 },
      { name: "Bob", age: 35 },
    ];

    it("sorts strings ascending", () => {
      const result = sortByField(people, "name", "asc");
      expect(result[0].name).toBe("Alice");
      expect(result[1].name).toBe("Bob");
      expect(result[2].name).toBe("Charlie");
    });

    it("sorts strings descending", () => {
      const result = sortByField(people, "name", "desc");
      expect(result[0].name).toBe("Charlie");
      expect(result[1].name).toBe("Bob");
      expect(result[2].name).toBe("Alice");
    });

    it("sorts numbers ascending", () => {
      const result = sortByField(people, "age", "asc");
      expect(result[0].age).toBe(25);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(35);
    });

    it("sorts numbers descending", () => {
      const result = sortByField(people, "age", "desc");
      expect(result[0].age).toBe(35);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(25);
    });

    it("does not mutate the original array", () => {
      const original = [{ name: "B" }, { name: "A" }];
      sortByField(original, "name", "asc");
      expect(original[0].name).toBe("B");
    });

    it("handles empty array", () => {
      expect(sortByField([], "name", "asc")).toHaveLength(0);
    });

    it("handles single element", () => {
      const arr = [{ name: "Solo" }];
      expect(sortByField(arr, "name", "asc")).toHaveLength(1);
    });

    it("handles equal values", () => {
      const arr = [
        { name: "Alice", score: 10 },
        { name: "Bob", score: 10 },
      ];
      const result = sortByField(arr, "score", "asc");
      expect(result).toHaveLength(2);
    });

    it("defaults to ascending when no direction given", () => {
      const arr = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = sortByField(arr, "val");
      expect(result[0].val).toBe(1);
    });

    it("handles undefined values by putting them last", () => {
      const arr = [
        { name: "B", extra: undefined },
        { name: "A", extra: "defined" },
      ];
      const result = sortByField(arr, "extra", "asc");
      expect(result[0].name).toBe("A");
    });

    const numericCases = [
      { arr: [5, 3, 8, 1, 9, 2, 7, 4, 6, 0], expected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    ];
    for (const c of numericCases) {
      it("sorts 10-element numeric array ascending", () => {
        const input = c.arr.map((n) => ({ n }));
        const result = sortByField(input, "n", "asc");
        expect(result.map((x) => x.n)).toEqual(c.expected);
      });
    }

    const stringSortCases = [
      {
        arr: ["cherry", "apple", "banana", "date", "elderberry"],
        expected: ["apple", "banana", "cherry", "date", "elderberry"],
      },
      { arr: ["z", "a", "m", "b", "y"], expected: ["a", "b", "m", "y", "z"] },
    ];
    for (const c of stringSortCases) {
      it(`sorts [${c.arr.join(", ")}] alphabetically`, () => {
        const input = c.arr.map((s) => ({ s }));
        const result = sortByField(input, "s", "asc");
        expect(result.map((x) => x.s)).toEqual(c.expected);
      });
    }

    it("sorts by field with negative numbers", () => {
      const arr = [{ v: -1 }, { v: 0 }, { v: -5 }, { v: 3 }];
      const result = sortByField(arr, "v", "asc");
      expect(result[0].v).toBe(-5);
      expect(result[3].v).toBe(3);
    });

    it("preserves all elements when sorting", () => {
      const arr = [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 4 }, { v: 5 }];
      const result = sortByField(arr, "v", "desc");
      expect(result).toHaveLength(5);
    });

    it("handles large arrays", () => {
      const arr = Array.from({ length: 100 }, (_, i) => ({ n: 100 - i }));
      const result = sortByField(arr, "n", "asc");
      expect(result[0].n).toBe(1);
      expect(result[99].n).toBe(100);
    });
  });

  describe("sortByMultiple", () => {
    const data = [
      { dept: "Engineering", name: "Alice", age: 30 },
      { dept: "Engineering", name: "Bob", age: 25 },
      { dept: "Marketing", name: "Charlie", age: 35 },
      { dept: "Marketing", name: "Alice", age: 28 },
    ];

    it("sorts by primary field then secondary field", () => {
      const result = sortByMultiple(data, [
        { field: "dept", dir: "asc" },
        { field: "name", dir: "asc" },
      ]);
      expect(result[0].name).toBe("Alice");
      expect(result[0].dept).toBe("Engineering");
      expect(result[1].name).toBe("Bob");
    });

    it("sorts primary desc, secondary asc", () => {
      const result = sortByMultiple(data, [
        { field: "dept", dir: "desc" },
        { field: "name", dir: "asc" },
      ]);
      expect(result[0].dept).toBe("Marketing");
    });

    it("handles empty sorts array (preserves order)", () => {
      const result = sortByMultiple(data, []);
      expect(result).toHaveLength(4);
    });

    it("does not mutate original", () => {
      const original = [...data];
      sortByMultiple(data, [{ field: "name", dir: "asc" }]);
      expect(data[0]).toEqual(original[0]);
    });

    it("handles empty array", () => {
      expect(sortByMultiple([], [{ field: "name", dir: "asc" }])).toHaveLength(0);
    });

    it("sorts by three fields", () => {
      const items = [
        { a: 1, b: 2, c: 3 },
        { a: 1, b: 2, c: 1 },
        { a: 1, b: 1, c: 5 },
      ];
      const result = sortByMultiple(items, [
        { field: "a", dir: "asc" },
        { field: "b", dir: "asc" },
        { field: "c", dir: "asc" },
      ]);
      expect(result[0].c).toBe(5);
      expect(result[1].c).toBe(1);
    });
  });

  describe("sortByRisk", () => {
    const items = [
      { id: 1, riskLevel: "critical" as const },
      { id: 2, riskLevel: "low" as const },
      { id: 3, riskLevel: "high" as const },
      { id: 4, riskLevel: "medium" as const },
    ];

    it("sorts risks from low to critical", () => {
      const result = sortByRisk(items);
      expect(result[0].riskLevel).toBe("low");
      expect(result[1].riskLevel).toBe("medium");
      expect(result[2].riskLevel).toBe("high");
      expect(result[3].riskLevel).toBe("critical");
    });

    it("does not mutate original", () => {
      const original = [...items];
      sortByRisk(items);
      expect(items[0].riskLevel).toBe("critical");
    });

    it("handles empty array", () => {
      expect(sortByRisk([])).toHaveLength(0);
    });

    it("handles single element", () => {
      expect(sortByRisk([{ id: 1, riskLevel: "high" as const }])).toHaveLength(1);
    });

    it("handles all same risk level", () => {
      const arr = [{ riskLevel: "low" as const }, { riskLevel: "low" as const }];
      expect(sortByRisk(arr)).toHaveLength(2);
    });

    const riskOrders = [
      ["critical", "low"],
      ["high", "medium"],
      ["critical", "medium"],
      ["high", "low"],
    ] as const;
    for (const [first, second] of riskOrders) {
      it(`sorts [${first}, ${second}] to [${second}, ${first}]`, () => {
        const arr = [{ riskLevel: first }, { riskLevel: second }];
        const result = sortByRisk(arr);
        expect(result[0].riskLevel).toBe(second);
        expect(result[1].riskLevel).toBe(first);
      });
    }
  });

  describe("sortByStatus", () => {
    const items = [
      { id: 1, status: "archived" as const },
      { id: 2, status: "inactive" as const },
      { id: 3, status: "active" as const },
      { id: 4, status: "pending" as const },
    ];

    it("sorts statuses by weight ascending", () => {
      const result = sortByStatus(items);
      expect(result[0].status).toBe("active");
      expect(result[1].status).toBe("pending");
      expect(result[2].status).toBe("inactive");
      expect(result[3].status).toBe("archived");
    });

    it("does not mutate original", () => {
      sortByStatus(items);
      expect(items[0].status).toBe("archived");
    });

    it("handles empty array", () => {
      expect(sortByStatus([])).toHaveLength(0);
    });

    it("handles single element", () => {
      expect(sortByStatus([{ id: 1, status: "active" as const }])).toHaveLength(1);
    });
  });

  describe("sortByDate", () => {
    const items = [
      { name: "C", date: "2024-03-01T00:00:00Z" },
      { name: "A", date: "2024-01-01T00:00:00Z" },
      { name: "B", date: "2024-02-01T00:00:00Z" },
    ];

    it("sorts dates ascending", () => {
      const result = sortByDate(items, "date", "asc");
      expect(result[0].name).toBe("A");
      expect(result[1].name).toBe("B");
      expect(result[2].name).toBe("C");
    });

    it("sorts dates descending", () => {
      const result = sortByDate(items, "date", "desc");
      expect(result[0].name).toBe("C");
      expect(result[1].name).toBe("B");
      expect(result[2].name).toBe("A");
    });

    it("does not mutate original", () => {
      sortByDate(items, "date", "asc");
      expect(items[0].name).toBe("C");
    });

    it("handles empty array", () => {
      expect(sortByDate([], "date", "asc")).toHaveLength(0);
    });

    it("handles single element", () => {
      expect(sortByDate([{ name: "A", date: "2024-01-01T00:00:00Z" }], "date", "asc")).toHaveLength(
        1,
      );
    });

    it("defaults to ascending", () => {
      const result = sortByDate(items, "date");
      expect(result[0].name).toBe("A");
    });

    const dateCases = [
      { a: "2020-01-01T00:00:00Z", b: "2021-01-01T00:00:00Z", expectedFirst: "a" },
      { a: "2025-06-15T00:00:00Z", b: "2023-12-31T00:00:00Z", expectedFirst: "b" },
    ];
    for (const c of dateCases) {
      it(`sorts ${c.a} and ${c.b} correctly ascending`, () => {
        const arr = [
          { name: "a", date: c.a },
          { name: "b", date: c.b },
        ];
        const result = sortByDate(arr, "date", "asc");
        expect(result[0].name).toBe(c.expectedFirst);
      });
    }
  });

  describe("naturalSort", () => {
    it("sorts strings with numbers naturally", () => {
      const arr = [{ name: "item10" }, { name: "item2" }, { name: "item1" }];
      const result = naturalSort(arr, "name");
      expect(result[0].name).toBe("item1");
      expect(result[1].name).toBe("item2");
      expect(result[2].name).toBe("item10");
    });

    it("sorts alphabetically when no numbers", () => {
      const arr = [{ name: "cherry" }, { name: "apple" }, { name: "banana" }];
      const result = naturalSort(arr, "name");
      expect(result[0].name).toBe("apple");
    });

    it("handles empty array", () => {
      expect(naturalSort([], "name")).toHaveLength(0);
    });

    it("handles single element", () => {
      expect(naturalSort([{ name: "a" }], "name")).toHaveLength(1);
    });

    it("does not mutate original", () => {
      const arr = [{ name: "b" }, { name: "a" }];
      naturalSort(arr, "name");
      expect(arr[0].name).toBe("b");
    });

    it("sorts mixed alphanumeric strings naturally", () => {
      const arr = [{ v: "v10" }, { v: "v9" }, { v: "v1" }, { v: "v100" }];
      const result = naturalSort(arr, "v");
      expect(result[0].v).toBe("v1");
      expect(result[1].v).toBe("v9");
      expect(result[2].v).toBe("v10");
      expect(result[3].v).toBe("v100");
    });

    it("is case insensitive", () => {
      const arr = [{ name: "Banana" }, { name: "apple" }, { name: "Cherry" }];
      const result = naturalSort(arr, "name");
      expect(result[0].name).toBe("apple");
    });
  });

  describe("sortByField - additional edge cases", () => {
    it("sorts empty array", () => {
      expect(sortByField([], "name", "asc")).toHaveLength(0);
    });
    it("sorts single item array returns same item", () => {
      expect(sortByField([{ name: "a" }], "name", "asc")[0].name).toBe("a");
    });
    it("handles all same value asc", () => {
      const arr = [{ v: 5 }, { v: 5 }, { v: 5 }];
      expect(sortByField(arr, "v", "asc")).toHaveLength(3);
    });
    it("handles all same value desc", () => {
      const arr = [{ v: 5 }, { v: 5 }, { v: 5 }];
      expect(sortByField(arr, "v", "desc")).toHaveLength(3);
    });

    const fieldSortCases = [
      { arr: [{ v: 3 }, { v: 1 }, { v: 2 }], dir: "asc" as const, expected: [1, 2, 3] },
      { arr: [{ v: 3 }, { v: 1 }, { v: 2 }], dir: "desc" as const, expected: [3, 2, 1] },
      { arr: [{ v: 0 }, { v: -1 }, { v: 1 }], dir: "asc" as const, expected: [-1, 0, 1] },
      { arr: [{ v: 100 }, { v: 50 }, { v: 75 }], dir: "asc" as const, expected: [50, 75, 100] },
      { arr: [{ v: 100 }, { v: 50 }, { v: 75 }], dir: "desc" as const, expected: [100, 75, 50] },
    ];
    for (const c of fieldSortCases) {
      it(`sorts [${c.arr.map((x) => x.v)}] ${c.dir} => [${c.expected}]`, () => {
        const result = sortByField(c.arr, "v", c.dir);
        expect(result.map((x) => x.v)).toEqual(c.expected);
      });
    }

    const stringSortAdditional = [
      { arr: [{ s: "z" }, { s: "a" }], dir: "asc" as const, firstExpected: "a" },
      { arr: [{ s: "z" }, { s: "a" }], dir: "desc" as const, firstExpected: "z" },
      {
        arr: [{ s: "beta" }, { s: "alpha" }, { s: "gamma" }],
        dir: "asc" as const,
        firstExpected: "alpha",
      },
      {
        arr: [{ s: "beta" }, { s: "alpha" }, { s: "gamma" }],
        dir: "desc" as const,
        firstExpected: "gamma",
      },
      {
        arr: [{ s: "one" }, { s: "two" }, { s: "three" }],
        dir: "asc" as const,
        firstExpected: "one",
      },
    ];
    for (const c of stringSortAdditional) {
      it(`string sort [${c.arr.map((x) => x.s)}] ${c.dir} starts with "${c.firstExpected}"`, () => {
        const result = sortByField(c.arr, "s", c.dir);
        expect(result[0].s).toBe(c.firstExpected);
      });
    }
  });

  describe("sortByDate - additional cases", () => {
    const dateSortCases = [
      { name: "A", date: "2020-01-01T00:00:00Z" },
      { name: "B", date: "2021-06-15T00:00:00Z" },
      { name: "C", date: "2022-12-31T00:00:00Z" },
      { name: "D", date: "2023-03-20T00:00:00Z" },
      { name: "E", date: "2024-09-01T00:00:00Z" },
    ];
    it("sorts 5 items by date ascending", () => {
      const shuffled = [...dateSortCases].sort(() => Math.random() - 0.5);
      const result = sortByDate(shuffled, "date", "asc");
      expect(result[0].name).toBe("A");
      expect(result[4].name).toBe("E");
    });
    it("sorts 5 items by date descending", () => {
      const shuffled = [...dateSortCases].sort(() => Math.random() - 0.5);
      const result = sortByDate(shuffled, "date", "desc");
      expect(result[0].name).toBe("E");
      expect(result[4].name).toBe("A");
    });
    it("preserves all elements", () => {
      const result = sortByDate(dateSortCases, "date", "asc");
      expect(result).toHaveLength(5);
    });
  });

  describe("sortByRisk - additional cases", () => {
    const riskItems = [
      { id: "a", riskLevel: "critical" as const },
      { id: "b", riskLevel: "low" as const },
      { id: "c", riskLevel: "high" as const },
      { id: "d", riskLevel: "medium" as const },
      { id: "e", riskLevel: "low" as const },
    ];
    it("sorts 5 items by risk level", () => {
      const result = sortByRisk(riskItems);
      expect(result[0].riskLevel).toBe("low");
      expect(result[4].riskLevel).toBe("critical");
    });
    it("preserves all 5 items", () => {
      expect(sortByRisk(riskItems)).toHaveLength(5);
    });
    it("two low-risk items are before medium", () => {
      const result = sortByRisk(riskItems);
      const mediumIdx = result.findIndex((i) => i.riskLevel === "medium");
      const lowItems = result.filter((i) => i.riskLevel === "low");
      expect(lowItems.length).toBe(2);
      expect(mediumIdx).toBeGreaterThan(1);
    });
  });

  describe("sortByField - comprehensive numeric tests", () => {
    for (let n = 1; n <= 20; n++) {
      it(`sortByField correctly places ${n} at position 0 in descending sort`, () => {
        const arr = Array.from({ length: n }, (_, i) => ({ v: i + 1 }));
        const result = sortByField(arr, "v", "desc");
        expect(result[0].v).toBe(n);
      });
    }

    for (let n = 1; n <= 10; n++) {
      it(`sortByField ascending with ${n} items has first item as minimum`, () => {
        const arr = Array.from({ length: n }, (_, i) => ({ v: n - i }));
        const result = sortByField(arr, "v", "asc");
        expect(result[0].v).toBe(1);
      });
    }
  });

  describe("sortByStatus - additional cases", () => {
    it("active comes before inactive", () => {
      const arr = [{ status: "inactive" as const }, { status: "active" as const }];
      const result = sortByStatus(arr);
      expect(result[0].status).toBe("active");
    });
    it("active comes before pending", () => {
      const arr = [{ status: "pending" as const }, { status: "active" as const }];
      const result = sortByStatus(arr);
      expect(result[0].status).toBe("active");
    });
    it("active comes before archived", () => {
      const arr = [{ status: "archived" as const }, { status: "active" as const }];
      const result = sortByStatus(arr);
      expect(result[0].status).toBe("active");
    });
    it("pending comes before inactive", () => {
      const arr = [{ status: "inactive" as const }, { status: "pending" as const }];
      const result = sortByStatus(arr);
      expect(result[0].status).toBe("pending");
    });
    it("inactive comes before archived", () => {
      const arr = [{ status: "archived" as const }, { status: "inactive" as const }];
      const result = sortByStatus(arr);
      expect(result[0].status).toBe("inactive");
    });
    it("archived always last", () => {
      const arr = [
        { status: "archived" as const },
        { status: "active" as const },
        { status: "pending" as const },
        { status: "inactive" as const },
      ];
      const result = sortByStatus(arr);
      expect(result[3].status).toBe("archived");
    });
  });

  describe("sortByMultiple - additional", () => {
    it("returns empty array for empty input", () => {
      expect(sortByMultiple([], [])).toHaveLength(0);
    });
    it("handles single sort criterion", () => {
      const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
      const result = sortByMultiple(arr, [{ field: "v", dir: "asc" }]);
      expect(result[0].v).toBe(1);
    });
    it("handles all same values stably", () => {
      const arr = [
        { v: 5, id: 1 },
        { v: 5, id: 2 },
        { v: 5, id: 3 },
      ];
      const result = sortByMultiple(arr, [{ field: "v", dir: "asc" }]);
      expect(result).toHaveLength(3);
    });
  });
});

describe("sortByField - string alphabetical tests", () => {
  const alphabetCases = [
    { arr: [{ s: "b" }, { s: "a" }], expected: ["a", "b"] },
    { arr: [{ s: "z" }, { s: "y" }, { s: "x" }], expected: ["x", "y", "z"] },
    {
      arr: [{ s: "charlie" }, { s: "alice" }, { s: "bob" }],
      expected: ["alice", "bob", "charlie"],
    },
    {
      arr: [{ s: "delta" }, { s: "alpha" }, { s: "beta" }, { s: "gamma" }],
      expected: ["alpha", "beta", "delta", "gamma"],
    },
    {
      arr: [{ s: "one" }, { s: "two" }, { s: "three" }, { s: "four" }, { s: "five" }],
      expected: ["five", "four", "one", "three", "two"],
    },
  ];
  for (const c of alphabetCases) {
    it(`sorts [${c.arr.map((x) => x.s).join(",")}] alphabetically as [${c.expected.join(",")}]`, () => {
      const result = sortByField(c.arr, "s", "asc");
      expect(result.map((x) => x.s)).toEqual(c.expected);
    });
  }
});

describe("sortByField - numeric tests with various ranges", () => {
  const numericRangeCases = [
    { values: [10, 1, 5, 3, 7], expected: [1, 3, 5, 7, 10] },
    { values: [100, 50, 75, 25], expected: [25, 50, 75, 100] },
    { values: [-3, -1, -2, 0], expected: [-3, -2, -1, 0] },
    { values: [1.5, 0.5, 2.5, 1.0], expected: [0.5, 1.0, 1.5, 2.5] },
    { values: [999, 1, 500, 250, 750], expected: [1, 250, 500, 750, 999] },
    { values: [0, 0, 0, 1], expected: [0, 0, 0, 1] },
    { values: [2, 1], expected: [1, 2] },
    { values: [1, 2, 3, 4, 5], expected: [1, 2, 3, 4, 5] },
    { values: [5, 4, 3, 2, 1], expected: [1, 2, 3, 4, 5] },
  ];
  for (const c of numericRangeCases) {
    it(`sorts [${c.values.join(",")}] as [${c.expected.join(",")}] ascending`, () => {
      const arr = c.values.map((v) => ({ v }));
      const result = sortByField(arr, "v", "asc");
      expect(result.map((x) => x.v)).toEqual(c.expected);
    });
  }
});

describe("sortByField - descending numeric tests", () => {
  const descCases = [
    { values: [1, 3, 2], expected: [3, 2, 1] },
    { values: [10, 20, 30], expected: [30, 20, 10] },
    { values: [5, 1, 3], expected: [5, 3, 1] },
    { values: [100, 200, 150, 50], expected: [200, 150, 100, 50] },
    { values: [-1, -3, -2], expected: [-1, -2, -3] },
  ];
  for (const c of descCases) {
    it(`sorts [${c.values.join(",")}] descending as [${c.expected.join(",")}]`, () => {
      const arr = c.values.map((v) => ({ v }));
      const result = sortByField(arr, "v", "desc");
      expect(result.map((x) => x.v)).toEqual(c.expected);
    });
  }
});
