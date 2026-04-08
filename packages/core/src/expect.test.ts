import { describe, it, expect } from "@fieldtest/core";

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
