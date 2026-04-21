import { describe, it, expect } from "fieldtest";

describe("expect — toBe", () => {
  it("passes for identical primitives", () => {
    expect(1).toBe(1);
    expect("hello").toBe("hello");
    expect(true).toBe(true);
    expect(null).toBe(null);
    expect(undefined).toBe(undefined);
  });

  it("uses Object.is semantics (NaN equals NaN)", () => {
    expect(NaN).toBe(NaN);
  });

  it("throws on value mismatch", () => {
    let threw = false;
    try {
      expect(1).toBe(2);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toEqual", () => {
  it("passes for equal plain objects", () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  });

  it("passes for equal arrays", () => {
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it("passes for nested structures", () => {
    expect({ a: [1, 2] }).toEqual({ a: [1, 2] });
  });

  it("throws when objects differ", () => {
    let threw = false;
    try {
      expect({ a: 1 }).toEqual({ a: 2 });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toBeTruthy / toBeFalsy", () => {
  it("toBeTruthy passes for non-empty string", () => {
    expect("hello").toBeTruthy();
  });

  it("toBeTruthy passes for non-zero number", () => {
    expect(1).toBeTruthy();
  });

  it("toBeTruthy passes for objects", () => {
    expect({}).toBeTruthy();
    expect([]).toBeTruthy();
  });

  it("toBeFalsy passes for 0", () => {
    expect(0).toBeFalsy();
  });

  it("toBeFalsy passes for empty string", () => {
    expect("").toBeFalsy();
  });

  it("toBeFalsy passes for null", () => {
    expect(null).toBeFalsy();
  });

  it("toBeFalsy passes for undefined", () => {
    expect(undefined).toBeFalsy();
  });
});

describe("expect — toBeNull / toBeUndefined / toBeDefined", () => {
  it("toBeNull passes for null", () => {
    expect(null).toBeNull();
  });

  it("toBeNull throws for non-null", () => {
    let threw = false;
    try {
      expect(0).toBeNull();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("toBeUndefined passes for undefined", () => {
    expect(undefined).toBeUndefined();
  });

  it("toBeDefined passes for non-undefined values", () => {
    expect(0).toBeDefined();
    expect("").toBeDefined();
    expect(null).toBeDefined();
    expect(false).toBeDefined();
  });

  it("toBeDefined throws for undefined", () => {
    let threw = false;
    try {
      expect(undefined).toBeDefined();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toContain", () => {
  it("passes when array contains item", () => {
    expect([1, 2, 3]).toContain(2);
  });

  it("passes when string contains substring", () => {
    expect("hello world").toContain("world");
  });

  it("throws when array does not contain item", () => {
    let threw = false;
    try {
      expect([1, 2]).toContain(3);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws when string does not contain substring", () => {
    let threw = false;
    try {
      expect("hello").toContain("xyz");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toHaveLength", () => {
  it("passes for array with exact length", () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect([]).toHaveLength(0);
  });

  it("passes for string with exact length", () => {
    expect("hello").toHaveLength(5);
    expect("").toHaveLength(0);
  });

  it("throws for wrong length", () => {
    let threw = false;
    try {
      expect([1, 2]).toHaveLength(5);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toThrow", () => {
  it("passes when function throws", () => {
    expect(() => {
      throw new Error("boom");
    }).toThrow();
  });

  it("passes when thrown message matches", () => {
    expect(() => {
      throw new Error("specific error");
    }).toThrow("specific error");
  });

  it("throws when function does not throw", () => {
    let threw = false;
    try {
      expect(() => {}).toThrow();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toBeGreaterThan / toBeLessThan", () => {
  it("toBeGreaterThan passes when value is greater", () => {
    expect(5).toBeGreaterThan(3);
    expect(0).toBeGreaterThan(-1);
  });

  it("toBeGreaterThan throws when not greater", () => {
    let threw = false;
    try {
      expect(3).toBeGreaterThan(5);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("toBeLessThan passes when value is less", () => {
    expect(3).toBeLessThan(5);
    expect(-1).toBeLessThan(0);
  });

  it("toBeLessThan throws when not less", () => {
    let threw = false;
    try {
      expect(5).toBeLessThan(3);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — .not", () => {
  it("negates toBe", () => {
    expect(1).not.toBe(2);
    expect("hello").not.toBe("world");
  });

  it("negates toBeTruthy", () => {
    expect(0).not.toBeTruthy();
    expect("").not.toBeTruthy();
  });

  it("negates toBeNull", () => {
    expect(1).not.toBeNull();
    expect(undefined).not.toBeNull();
  });

  it("negates toContain", () => {
    expect([1, 2]).not.toContain(3);
  });

  it("negates toBeGreaterThan", () => {
    expect(3).not.toBeGreaterThan(5);
  });

  it(".not throws when the underlying assertion passes", () => {
    let threw = false;
    try {
      expect(1).not.toBe(1);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toBeGreaterThanOrEqual / toBeLessThanOrEqual", () => {
  it("toBeGreaterThanOrEqual passes when equal", () => {
    expect(5).toBeGreaterThanOrEqual(5);
  });

  it("toBeGreaterThanOrEqual passes when greater", () => {
    expect(6).toBeGreaterThanOrEqual(5);
  });

  it("toBeGreaterThanOrEqual throws when less", () => {
    let threw = false;
    try {
      expect(4).toBeGreaterThanOrEqual(5);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("toBeLessThanOrEqual passes when equal", () => {
    expect(5).toBeLessThanOrEqual(5);
  });

  it("toBeLessThanOrEqual passes when less", () => {
    expect(4).toBeLessThanOrEqual(5);
  });
});

describe("expect — toMatch", () => {
  it("passes with a regex", () => {
    expect("hello world").toMatch(/world/);
  });

  it("passes with a substring string", () => {
    expect("hello world").toMatch("hello");
  });

  it("throws when no match", () => {
    let threw = false;
    try {
      expect("hello").toMatch(/xyz/);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toMatchObject", () => {
  it("passes when object is a superset of expected", () => {
    expect({ a: 1, b: 2, c: 3 }).toMatchObject({ a: 1, b: 2 });
  });

  it("passes with nested objects", () => {
    expect({ user: { name: "Alice", age: 30 } }).toMatchObject({ user: { name: "Alice" } });
  });

  it("throws when a key differs", () => {
    let threw = false;
    try {
      expect({ a: 1 }).toMatchObject({ a: 2 });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws when a key is missing", () => {
    let threw = false;
    try {
      expect({ a: 1 }).toMatchObject({ b: 1 });
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toBeInstanceOf", () => {
  it("passes for correct class", () => {
    expect(new Error("boom")).toBeInstanceOf(Error);
    expect([]).toBeInstanceOf(Array);
  });

  it("throws for wrong class", () => {
    let threw = false;
    try {
      expect("string").toBeInstanceOf(Error);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — toHaveProperty", () => {
  it("passes when property exists", () => {
    expect({ a: 1 }).toHaveProperty("a");
  });

  it("passes for nested key path", () => {
    expect({ a: { b: 2 } }).toHaveProperty("a.b");
  });

  it("passes when property equals expected value", () => {
    expect({ a: 42 }).toHaveProperty("a", 42);
  });

  it("throws when property is missing", () => {
    let threw = false;
    try {
      expect({ a: 1 }).toHaveProperty("b");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws when value does not match", () => {
    let threw = false;
    try {
      expect({ a: 1 }).toHaveProperty("a", 2);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("expect — mock spy assertions", () => {
  it("toHaveBeenCalled passes after spy is called", () => {
    const spy = Object.assign(() => {}, {
      _isSpy: true as const,
      _spyCalls: [{ args: [], result: undefined, threw: false }],
    });
    expect(spy).toHaveBeenCalled();
  });

  it("toHaveBeenCalled throws when spy was not called", () => {
    const spy = Object.assign(() => {}, {
      _isSpy: true as const,
      _spyCalls: [] as Array<{ args: unknown[]; result: unknown; threw: boolean }>,
    });
    let threw = false;
    try {
      expect(spy).toHaveBeenCalled();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("toHaveBeenCalledTimes passes for exact count", () => {
    const spy = Object.assign(() => {}, {
      _isSpy: true as const,
      _spyCalls: [
        { args: [], result: undefined, threw: false },
        { args: [], result: undefined, threw: false },
      ],
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("toHaveBeenCalledWith passes when args match", () => {
    const spy = Object.assign(() => {}, {
      _isSpy: true as const,
      _spyCalls: [{ args: ["hello", 42], result: undefined, threw: false }],
    });
    expect(spy).toHaveBeenCalledWith("hello", 42);
  });

  it("toHaveBeenCalledWith throws when args differ", () => {
    const spy = Object.assign(() => {}, {
      _isSpy: true as const,
      _spyCalls: [{ args: ["hello"], result: undefined, threw: false }],
    });
    let threw = false;
    try {
      expect(spy).toHaveBeenCalledWith("world");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
