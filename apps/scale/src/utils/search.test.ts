import { describe, it, expect } from "@fieldtest/core";
import { matchesSearch, highlightMatch, scoreMatch, searchItems, tokenize } from "./search";

describe("search", () => {
  describe("tokenize", () => {
    const cases = [
      { query: "hello", expected: ["hello"] },
      { query: "hello world", expected: ["hello", "world"] },
      { query: "  hello   world  ", expected: ["hello", "world"] },
      { query: "", expected: [] },
      { query: "   ", expected: [] },
      { query: "HELLO WORLD", expected: ["hello", "world"] },
      { query: "one two three", expected: ["one", "two", "three"] },
      { query: "abc", expected: ["abc"] },
      { query: "abc def ghi", expected: ["abc", "def", "ghi"] },
      { query: "A B C", expected: ["a", "b", "c"] },
      { query: "hello  world", expected: ["hello", "world"] },
      { query: "\thello\tworld", expected: ["hello", "world"] },
    ];
    for (const c of cases) {
      it(`tokenize("${c.query}") returns ${JSON.stringify(c.expected)}`, () => {
        expect(tokenize(c.query)).toEqual(c.expected);
      });
    }
    it("returns array type", () => {
      expect(Array.isArray(tokenize("hello"))).toBeTruthy();
    });
    it("all tokens are lowercase", () => {
      const tokens = tokenize("Hello World TEST");
      tokens.forEach((t) => expect(t).toBe(t.toLowerCase()));
    });
  });

  describe("matchesSearch", () => {
    const item = { name: "Acme Corporation", category: "cloud", description: "A cloud vendor" };

    it("returns true when query is empty", () => {
      expect(matchesSearch(item, ["name"], "")).toBeTruthy();
    });

    it("returns true when query is whitespace", () => {
      expect(matchesSearch(item, ["name"], "   ")).toBeTruthy();
    });

    it("matches single word in name field", () => {
      expect(matchesSearch(item, ["name"], "Acme")).toBeTruthy();
    });

    it("matches case insensitively", () => {
      expect(matchesSearch(item, ["name"], "acme")).toBeTruthy();
      expect(matchesSearch(item, ["name"], "ACME")).toBeTruthy();
    });

    it("matches across multiple fields", () => {
      expect(matchesSearch(item, ["name", "category"], "cloud")).toBeTruthy();
    });

    it("requires all tokens to match", () => {
      expect(matchesSearch(item, ["name", "description"], "Acme cloud")).toBeTruthy();
    });

    it("returns false when no fields match", () => {
      expect(matchesSearch(item, ["name"], "xyz_nonexistent")).toBeFalsy();
    });

    it("matches partial strings", () => {
      expect(matchesSearch(item, ["name"], "Corp")).toBeTruthy();
    });

    it("handles null field values", () => {
      const obj = { name: "Test", extra: null as unknown as string };
      expect(matchesSearch(obj, ["name", "extra"], "Test")).toBeTruthy();
    });

    it("handles undefined field values", () => {
      const obj: Record<string, unknown> = { name: "Test" };
      expect(matchesSearch(obj, ["name", "missing"], "Test")).toBeTruthy();
    });

    it("returns false when all tokens not present", () => {
      expect(matchesSearch(item, ["name"], "Acme XYZ")).toBeFalsy();
    });

    const searchCases = [
      { query: "corporation", expected: true },
      { query: "CORPORATION", expected: true },
      { query: "oration", expected: true },
      { query: "vendor", expected: false },
      { query: "cloud vendor", expected: false },
      { query: "Acme", expected: true },
    ];
    for (const c of searchCases) {
      it(`matchesSearch with query "${c.query}" in name returns ${c.expected}`, () => {
        if (c.expected) {
          expect(matchesSearch(item, ["name"], c.query)).toBeTruthy();
        } else {
          expect(matchesSearch(item, ["name"], c.query)).toBeFalsy();
        }
      });
    }

    for (let i = 0; i < 10; i++) {
      const items = Array.from({ length: 10 }, (_, j) => ({ name: `Item ${j}`, id: String(j) }));
      it(`matchesSearch finds "Item ${i}" by name`, () => {
        expect(matchesSearch(items[i], ["name"], `Item ${i}`)).toBeTruthy();
      });
    }
  });

  describe("highlightMatch", () => {
    it("returns original text when query is empty", () => {
      expect(highlightMatch("hello world", "")).toBe("hello world");
    });

    it("wraps match in mark tags", () => {
      expect(highlightMatch("hello world", "hello")).toBe("<mark>hello</mark> world");
    });

    it("is case insensitive", () => {
      expect(highlightMatch("Hello World", "hello")).toContain("<mark>");
    });

    it("highlights multiple occurrences", () => {
      const result = highlightMatch("hello hello", "hello");
      expect(result.split("<mark>").length - 1).toBe(2);
    });

    it("highlights multiple tokens", () => {
      const result = highlightMatch("hello world", "hello world");
      expect(result).toContain("<mark>hello</mark>");
      expect(result).toContain("<mark>world</mark>");
    });

    it("returns text unchanged when query has no match", () => {
      const result = highlightMatch("hello", "xyz");
      expect(result).toBe("hello");
    });

    it("handles special regex characters in query", () => {
      expect(() => highlightMatch("price: $10.00", "$10")).not.toThrow?.();
    });

    it("wraps with opening and closing mark tags", () => {
      const result = highlightMatch("test text", "test");
      expect(result).toContain("<mark>");
      expect(result).toContain("</mark>");
    });

    const highlightCases = [
      { text: "acme corporation", query: "acme", containsMark: true },
      { text: "beta llc", query: "gamma", containsMark: false },
      { text: "cloud services", query: "cloud", containsMark: true },
      { text: "data protection", query: "DATA", containsMark: true },
    ];
    for (const c of highlightCases) {
      it(`highlightMatch("${c.text}", "${c.query}") ${c.containsMark ? "contains" : "does not contain"} mark`, () => {
        const result = highlightMatch(c.text, c.query);
        if (c.containsMark) {
          expect(result).toContain("<mark>");
        } else {
          expect(result).toBe(c.text);
        }
      });
    }
  });

  describe("scoreMatch", () => {
    it("returns 0 for empty query", () => {
      expect(scoreMatch("hello", "")).toBe(0);
    });

    it("returns 100 for exact match", () => {
      expect(scoreMatch("hello", "hello")).toBe(100);
    });

    it("returns 80 for prefix match", () => {
      expect(scoreMatch("hello world", "hello")).toBe(80);
    });

    it("returns positive score for partial match", () => {
      expect(scoreMatch("hello world", "world")).toBeGreaterThan(0);
    });

    it("returns 0 for no match", () => {
      expect(scoreMatch("hello", "xyz")).toBe(0);
    });

    it("is case insensitive", () => {
      expect(scoreMatch("HELLO", "hello")).toBe(100);
    });

    it("exact match scores higher than prefix", () => {
      const exactScore = scoreMatch("hello", "hello");
      const prefixScore = scoreMatch("hello world", "hello");
      expect(exactScore).toBeGreaterThan(prefixScore);
    });

    it("prefix scores higher than partial", () => {
      const prefixScore = scoreMatch("hello world", "hello");
      const partialScore = scoreMatch("say hello", "hello");
      expect(prefixScore).toBeGreaterThan(partialScore);
    });

    it("returns a number", () => {
      expect(typeof scoreMatch("hello", "hello")).toBe("number");
    });

    const scoreCases = [
      { text: "exact match test", query: "exact match test", expected: 100 },
      { text: "starts here", query: "starts", expected: 80 },
    ];
    for (const c of scoreCases) {
      it(`scoreMatch("${c.text}", "${c.query}") = ${c.expected}`, () => {
        expect(scoreMatch(c.text, c.query)).toBe(c.expected);
      });
    }
  });

  describe("searchItems", () => {
    const items = [
      { id: "1", name: "Acme Corp", category: "cloud" },
      { id: "2", name: "Beta LLC", category: "saas" },
      { id: "3", name: "Gamma Inc", category: "cloud" },
      { id: "4", name: "Delta Corp", category: "on-prem" },
      { id: "5", name: "Epsilon SA", category: "saas" },
    ];

    it("returns all items for empty query", () => {
      expect(searchItems(items, ["name"], "")).toHaveLength(5);
    });

    it("returns all items for whitespace query", () => {
      expect(searchItems(items, ["name"], "   ")).toHaveLength(5);
    });

    it("finds item by exact name", () => {
      const result = searchItems(items, ["name"], "Acme Corp");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("finds items by partial name", () => {
      const result = searchItems(items, ["name"], "Corp");
      expect(result).toHaveLength(2);
    });

    it("searches by category field", () => {
      const result = searchItems(items, ["category"], "cloud");
      expect(result).toHaveLength(2);
    });

    it("searches across multiple fields", () => {
      const result = searchItems(items, ["name", "category"], "saas");
      expect(result).toHaveLength(2);
    });

    it("returns empty for no matches", () => {
      expect(searchItems(items, ["name"], "xyz_nonexistent")).toHaveLength(0);
    });

    it("is case insensitive", () => {
      const result = searchItems(items, ["name"], "acme corp");
      expect(result).toHaveLength(1);
    });

    it("handles empty items array", () => {
      expect(searchItems([], ["name"], "test")).toHaveLength(0);
    });

    it("does not mutate original array", () => {
      searchItems(items, ["name"], "Acme");
      expect(items).toHaveLength(5);
    });

    for (let i = 0; i < items.length; i++) {
      it(`searchItems finds "${items[i].name}" by name`, () => {
        const result = searchItems(items, ["name"], items[i].name);
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((r) => r.id === items[i].id)).toBeTruthy();
      });
    }

    it("finds items by multi-word query", () => {
      const result = searchItems(items, ["name"], "Acme Corp");
      expect(result).toHaveLength(1);
    });
  });

  describe("tokenize - additional cases", () => {
    const tokenizeCases = [
      { query: "single", expected: ["single"] },
      { query: "two words", expected: ["two", "words"] },
      { query: "THREE WORDS HERE", expected: ["three", "words", "here"] },
      { query: "a b c d e", expected: ["a", "b", "c", "d", "e"] },
      { query: "  leading", expected: ["leading"] },
      { query: "trailing  ", expected: ["trailing"] },
      { query: "MiXeD CaSe", expected: ["mixed", "case"] },
      { query: "one  two  three", expected: ["one", "two", "three"] },
    ];
    for (const c of tokenizeCases) {
      it(`tokenize("${c.query}") = ${JSON.stringify(c.expected)}`, () => {
        expect(tokenize(c.query)).toEqual(c.expected);
      });
    }
    it("tokenize of single word has length 1", () => {
      expect(tokenize("hello")).toHaveLength(1);
    });
    it("tokenize of two words has length 2", () => {
      expect(tokenize("hello world")).toHaveLength(2);
    });
  });

  describe("matchesSearch - additional cases", () => {
    const items = [
      { id: "1", name: "Acme Corp", category: "cloud", status: "active" },
      { id: "2", name: "Beta LLC", category: "saas", status: "inactive" },
      { id: "3", name: "Gamma Inc", category: "cloud", status: "pending" },
    ];

    const matchCases = [
      { fields: ["name"], query: "Acme", itemIdx: 0, expected: true },
      { fields: ["name"], query: "Beta", itemIdx: 1, expected: true },
      { fields: ["name"], query: "Gamma", itemIdx: 2, expected: true },
      { fields: ["name"], query: "Corp", itemIdx: 0, expected: true },
      { fields: ["name"], query: "Corp", itemIdx: 1, expected: false },
      { fields: ["category"], query: "cloud", itemIdx: 0, expected: true },
      { fields: ["category"], query: "cloud", itemIdx: 1, expected: false },
      { fields: ["status"], query: "active", itemIdx: 0, expected: true },
      { fields: ["status"], query: "active", itemIdx: 1, expected: true },
      { fields: ["name", "category"], query: "saas", itemIdx: 1, expected: true },
    ];
    for (const c of matchCases) {
      it(`matchesSearch(item[${c.itemIdx}], ${JSON.stringify(c.fields)}, "${c.query}") = ${c.expected}`, () => {
        if (c.expected) {
          expect(matchesSearch(items[c.itemIdx], c.fields, c.query)).toBeTruthy();
        } else {
          expect(matchesSearch(items[c.itemIdx], c.fields, c.query)).toBeFalsy();
        }
      });
    }
  });

  describe("highlightMatch - additional cases", () => {
    const highlightCases = [
      { text: "hello world", query: "hello", containsTag: true },
      { text: "hello world", query: "world", containsTag: true },
      { text: "hello world", query: "xyz", containsTag: false },
      { text: "HELLO WORLD", query: "hello", containsTag: true },
      { text: "test text", query: "", containsTag: false },
      { text: "foo bar baz", query: "bar", containsTag: true },
      { text: "acme corporation", query: "corp", containsTag: true },
      { text: "no match here", query: "xyz123", containsTag: false },
    ];
    for (const c of highlightCases) {
      it(`highlightMatch("${c.text}", "${c.query}") ${c.containsTag ? "contains" : "has no"} mark tag`, () => {
        const result = highlightMatch(c.text, c.query);
        if (c.containsTag) {
          expect(result).toContain("<mark>");
        } else {
          expect(result).not.toContain("<mark>");
        }
      });
    }
    it("returns string type always", () => {
      expect(typeof highlightMatch("hello", "h")).toBe("string");
    });
    it("does not modify text when no match", () => {
      expect(highlightMatch("hello", "xyz")).toBe("hello");
    });
    it("empty text returns empty string", () => {
      expect(highlightMatch("", "hello")).toBe("");
    });
  });

  describe("scoreMatch - additional cases", () => {
    const scoreCases = [
      { text: "hello", query: "hello", expected: 100 },
      { text: "HELLO", query: "hello", expected: 100 },
      { text: "hello world", query: "hello", expected: 80 },
      { text: "say hello world", query: "hello", expectedMin: 0, exactMatch: false },
    ];
    for (const c of scoreCases) {
      if (c.expected !== undefined) {
        it(`scoreMatch("${c.text}", "${c.query}") = ${c.expected}`, () => {
          expect(scoreMatch(c.text, c.query)).toBe(c.expected);
        });
      } else {
        it(`scoreMatch("${c.text}", "${c.query}") >= 0`, () => {
          expect(scoreMatch(c.text, c.query)).toBeGreaterThan(-1);
        });
      }
    }
    it("returns 0 for empty query", () => {
      expect(scoreMatch("hello", "")).toBe(0);
    });
    it("returns positive score for partial match in text", () => {
      expect(scoreMatch("hello world test", "world")).toBeGreaterThan(0);
    });
    it("score is a number", () => {
      expect(typeof scoreMatch("hello", "hi")).toBe("number");
    });
    it("exact match returns 100", () => {
      expect(scoreMatch("test", "test")).toBe(100);
    });
    it("prefix match returns 80", () => {
      expect(scoreMatch("testing", "test")).toBe(80);
    });
  });
});

describe("searchItems - comprehensive search tests", () => {
  const largeDataset = Array.from({ length: 20 }, (_, i) => ({
    id: String(i),
    name: `Item ${i}`,
    category: i % 2 === 0 ? "even" : "odd",
    score: i * 5,
  }));

  const searchCases = [
    { query: "Item 0", expectedId: "0" },
    { query: "Item 1", minCount: 1 },
    { query: "Item 5", expectedId: "5" },
    { query: "Item 10", expectedId: "10" },
    { query: "Item 15", expectedId: "15" },
    { query: "Item 19", expectedId: "19" },
    { query: "even", expectedCategory: "even" },
    { query: "odd", expectedCategory: "odd" },
    { query: "", allItems: 20 },
    { query: "xyz_nonexistent", allItems: 0 },
  ];

  for (const c of searchCases) {
    if (c.allItems !== undefined) {
      it(`searchItems with query "${c.query}" returns ${c.allItems} items`, () => {
        expect(searchItems(largeDataset, ["name", "category"], c.query)).toHaveLength(c.allItems);
      });
    } else if (c.expectedId) {
      it(`searchItems with "${c.query}" finds item with id ${c.expectedId}`, () => {
        const result = searchItems(largeDataset, ["name"], c.query);
        expect(result.some((r) => r.id === c.expectedId)).toBeTruthy();
      });
    } else {
      it(`searchItems with "${c.query}" returns at least 1 item`, () => {
        expect(searchItems(largeDataset, ["name", "category"], c.query).length).toBeGreaterThan(0);
      });
    }
  }
});

describe("tokenize - systematic tests", () => {
  const tokenCases = [
    { q: "a b c d e f g h i j", expected: 10 },
    { q: "one", expected: 1 },
    { q: "one two", expected: 2 },
    { q: "one two three", expected: 3 },
    { q: "  spaces  around  ", expected: 2 },
    { q: "UPPERCASE lowercase MiXeD", expected: 3 },
    { q: "hello world foo bar", expected: 4 },
  ];
  for (const c of tokenCases) {
    it(`tokenize("${c.q.slice(0, 20)}") has ${c.expected} tokens`, () => {
      expect(tokenize(c.q)).toHaveLength(c.expected);
    });
  }
});

describe("scoreMatch - range tests", () => {
  const rangeCases = [
    { text: "hello", query: "hello", min: 100, max: 100 },
    { text: "hello world", query: "hello", min: 79, max: 81 },
    { text: "say hello", query: "hello", min: 0, max: 100 },
    { text: "no match", query: "xyz", min: 0, max: 0 },
    { text: "", query: "hello", min: 0, max: 0 },
    { text: "test", query: "", min: 0, max: 0 },
  ];
  for (const c of rangeCases) {
    it(`scoreMatch("${c.text}", "${c.query}") in range [${c.min}, ${c.max}]`, () => {
      const score = scoreMatch(c.text, c.query);
      expect(score).toBeGreaterThan(c.min - 1);
      expect(score).toBeLessThan(c.max + 1);
    });
  }
});

describe("matchesSearch - multi-token search", () => {
  const mtCases = [
    {
      item: { name: "Acme Corp", desc: "A cloud company" },
      fields: ["name", "desc"],
      q: "Acme cloud",
      expected: true,
    },
    {
      item: { name: "Acme Corp", desc: "A cloud company" },
      fields: ["name", "desc"],
      q: "Acme AWS",
      expected: false,
    },
    {
      item: { name: "Beta LLC", desc: "SaaS provider" },
      fields: ["name", "desc"],
      q: "Beta SaaS",
      expected: true,
    },
    {
      item: { name: "Gamma Inc", desc: "On-premise" },
      fields: ["name", "desc"],
      q: "Gamma cloud",
      expected: false,
    },
    { item: { a: "foo", b: "bar" }, fields: ["a", "b"], q: "foo bar", expected: true },
  ];
  for (const c of mtCases) {
    it(`matchesSearch with multi-token "${c.q}" = ${c.expected}`, () => {
      if (c.expected) {
        expect(matchesSearch(c.item as Record<string, unknown>, c.fields, c.q)).toBeTruthy();
      } else {
        expect(matchesSearch(c.item as Record<string, unknown>, c.fields, c.q)).toBeFalsy();
      }
    });
  }
});
