import { describe, it, expect } from "roadtest";
import {
  slugify,
  initials,
  capitalize,
  camelToTitle,
  escapeHtml,
  stripHtml,
  countWords,
  padStart,
  repeat,
} from "./string";

describe("string", () => {
  describe("slugify", () => {
    const cases = [
      { input: "Hello World", expected: "hello-world" },
      { input: "Hello  World", expected: "hello-world" },
      { input: "Hello World!", expected: "hello-world" },
      { input: "  leading and trailing  ", expected: "leading-and-trailing" },
      { input: "already-slugified", expected: "already-slugified" },
      { input: "Multiple   Spaces", expected: "multiple-spaces" },
      { input: "Special @#$ chars", expected: "special--chars" },
      { input: "camelCase", expected: "camelcase" },
      { input: "UPPER CASE", expected: "upper-case" },
      { input: "", expected: "" },
      { input: "   ", expected: "" },
      { input: "hello-world", expected: "hello-world" },
      { input: "123 items", expected: "123-items" },
      { input: "tab\there", expected: "tabhere" },
    ];
    for (const c of cases) {
      it(`slugify("${c.input}") = "${c.expected}"`, () => {
        expect(slugify(c.input)).toBe(c.expected);
      });
    }
    it("returns a string with no uppercase", () => {
      expect(slugify("HELLO WORLD")).toBe(slugify("HELLO WORLD").toLowerCase());
    });
    it("returns string with no spaces", () => {
      expect(slugify("hello world")).not.toContain(" ");
    });
  });

  describe("initials", () => {
    const cases = [
      { input: "John Doe", expected: "JD" },
      { input: "Jane Mary Smith", expected: "JMS" },
      { input: "Alice", expected: "A" },
      { input: "alice bob", expected: "AB" },
      { input: "a b c d", expected: "ABCD" },
      { input: "John  Doe", expected: "JD" },
      { input: "  leading  ", expected: "L" },
      { input: "Gabriel Csapo", expected: "GC" },
      { input: "X Y Z", expected: "XYZ" },
      { input: "one", expected: "O" },
    ];
    for (const c of cases) {
      it(`initials("${c.input}") = "${c.expected}"`, () => {
        expect(initials(c.input)).toBe(c.expected);
      });
    }
    it("returns uppercase initials", () => {
      expect(initials("alice bob")).toBe("AB");
    });
    it("handles multiple spaces between words", () => {
      expect(initials("Alice   Bob")).toBe("AB");
    });
  });

  describe("capitalize", () => {
    const cases = [
      { input: "hello", expected: "Hello" },
      { input: "HELLO", expected: "Hello" },
      { input: "Hello World", expected: "Hello world" },
      { input: "", expected: "" },
      { input: "a", expected: "A" },
      { input: "already Capitalized", expected: "Already capitalized" },
      { input: "123abc", expected: "123abc" },
      { input: "hELLO", expected: "Hello" },
    ];
    for (const c of cases) {
      it(`capitalize("${c.input}") = "${c.expected}"`, () => {
        expect(capitalize(c.input)).toBe(c.expected);
      });
    }
    it("first char is uppercase", () => {
      expect(capitalize("hello")[0]).toBe("H");
    });
    it("rest of string is lowercase", () => {
      const result = capitalize("HELLO WORLD");
      expect(result.slice(1)).toBe("ello world");
    });
  });

  describe("camelToTitle", () => {
    const cases = [
      { input: "camelCase", expected: "Camel Case" },
      { input: "myVariableName", expected: "My Variable Name" },
      { input: "helloWorld", expected: "Hello World" },
      { input: "simple", expected: "Simple" },
      { input: "aBC", expected: "A B C" },
      { input: "firstName", expected: "First Name" },
      { input: "lastName", expected: "Last Name" },
      { input: "emailAddress", expected: "Email Address" },
      { input: "phoneNumber", expected: "Phone Number" },
      { input: "startDate", expected: "Start Date" },
    ];
    for (const c of cases) {
      it(`camelToTitle("${c.input}") = "${c.expected}"`, () => {
        expect(camelToTitle(c.input)).toBe(c.expected);
      });
    }
    it("first letter is uppercase", () => {
      const result = camelToTitle("camelCase");
      expect(result[0]).toBe("C");
    });
  });

  describe("escapeHtml", () => {
    const cases = [
      { input: "<script>", expected: "&lt;script&gt;" },
      { input: "Hello & World", expected: "Hello &amp; World" },
      { input: '"quoted"', expected: "&quot;quoted&quot;" },
      { input: "it's", expected: "it&#039;s" },
      { input: "<b>bold</b>", expected: "&lt;b&gt;bold&lt;/b&gt;" },
      { input: "safe text", expected: "safe text" },
      { input: "", expected: "" },
      { input: "&&", expected: "&amp;&amp;" },
      { input: "<>", expected: "&lt;&gt;" },
    ];
    for (const c of cases) {
      it(`escapeHtml("${c.input}") = "${c.expected}"`, () => {
        expect(escapeHtml(c.input)).toBe(c.expected);
      });
    }
    it("does not contain unescaped < after escaping", () => {
      expect(escapeHtml("<b>test</b>")).not.toContain("<b>");
    });
    it("does not contain unescaped > after escaping", () => {
      expect(escapeHtml("<b>test</b>")).not.toContain("</b>");
    });
  });

  describe("stripHtml", () => {
    const cases = [
      { input: "<b>bold</b>", expected: "bold" },
      { input: "<p>Hello</p>", expected: "Hello" },
      { input: "no html", expected: "no html" },
      { input: "", expected: "" },
      { input: "<div><p>nested</p></div>", expected: "nested" },
      { input: "<br/>", expected: "" },
      { input: '<a href="url">link</a>', expected: "link" },
      { input: '<img src="x" />', expected: "" },
      { input: "text <b>bold</b> more", expected: "text bold more" },
    ];
    for (const c of cases) {
      it(`stripHtml("${c.input}") = "${c.expected}"`, () => {
        expect(stripHtml(c.input)).toBe(c.expected);
      });
    }
    it("removes all tags", () => {
      expect(stripHtml("<div><span>text</span></div>")).not.toContain("<");
    });
  });

  describe("countWords", () => {
    const cases = [
      { input: "", expected: 0 },
      { input: "   ", expected: 0 },
      { input: "hello", expected: 1 },
      { input: "hello world", expected: 2 },
      { input: "one two three", expected: 3 },
      { input: "  hello  world  ", expected: 2 },
      { input: "a b c d e", expected: 5 },
      { input: "word", expected: 1 },
      { input: "the quick brown fox", expected: 4 },
    ];
    for (const c of cases) {
      it(`countWords("${c.input}") = ${c.expected}`, () => {
        expect(countWords(c.input)).toBe(c.expected);
      });
    }
    it("counts words correctly regardless of extra whitespace", () => {
      expect(countWords("  hello   world  ")).toBe(2);
    });
  });

  describe("padStart", () => {
    const cases = [
      { s: "hi", len: 5, char: " ", expected: "   hi" },
      { s: "hi", len: 2, char: " ", expected: "hi" },
      { s: "5", len: 3, char: "0", expected: "005" },
      { s: "hello", len: 3, char: " ", expected: "hello" },
      { s: "", len: 3, char: "x", expected: "xxx" },
      { s: "abc", len: 5, char: "-", expected: "--abc" },
      { s: "test", len: 4, char: "0", expected: "test" },
      { s: "a", len: 5, char: "0", expected: "0000a" },
    ];
    for (const c of cases) {
      it(`padStart("${c.s}", ${c.len}, "${c.char}") = "${c.expected}"`, () => {
        expect(padStart(c.s, c.len, c.char)).toBe(c.expected);
      });
    }
    it("defaults to space padding", () => {
      expect(padStart("hi", 5)).toBe("   hi");
    });
    it("does not shorten strings longer than len", () => {
      expect(padStart("hello world", 3)).toBe("hello world");
    });
  });

  describe("repeat", () => {
    const cases = [
      { s: "hello", n: 1, expected: "hello" },
      { s: "hello", n: 2, expected: "hellohello" },
      { s: "hello", n: 0, expected: "" },
      { s: "hello", n: -1, expected: "" },
      { s: "ab", n: 3, expected: "ababab" },
      { s: "", n: 5, expected: "" },
      { s: "x", n: 10, expected: "xxxxxxxxxx" },
      { s: "-", n: 5, expected: "-----" },
    ];
    for (const c of cases) {
      it(`repeat("${c.s}", ${c.n}) = "${c.expected}"`, () => {
        expect(repeat(c.s, c.n)).toBe(c.expected);
      });
    }
    it("returns empty string for n=0", () => {
      expect(repeat("abc", 0)).toBe("");
    });
    it("returns empty string for negative n", () => {
      expect(repeat("abc", -5)).toBe("");
    });
  });
});

describe("slugify - additional cases", () => {
  const slugCases = [
    { input: "Hello World", expected: "hello-world" },
    { input: "foo BAR baz", expected: "foo-bar-baz" },
    { input: "test-case", expected: "test-case" },
    { input: "Test Case 123", expected: "test-case-123" },
    { input: "Compliance Framework", expected: "compliance-framework" },
    { input: "SOC2 Audit Report", expected: "soc2-audit-report" },
    { input: "Risk Management Policy", expected: "risk-management-policy" },
    { input: "Vendor Review 2024", expected: "vendor-review-2024" },
    { input: "Background Check", expected: "background-check" },
    { input: "ISO 27001 Control", expected: "iso-27001-control" },
    { input: "GDPR Data Privacy", expected: "gdpr-data-privacy" },
    { input: "Incident Response Plan", expected: "incident-response-plan" },
    { input: "Access Control Policy", expected: "access-control-policy" },
    { input: "Security Operations Center", expected: "security-operations-center" },
    { input: "Multi Word Phrase Here", expected: "multi-word-phrase-here" },
    { input: "Single", expected: "single" },
    { input: "two words", expected: "two-words" },
  ];
  for (const c of slugCases) {
    it(`slugify("${c.input}") = "${c.expected}"`, () => {
      expect(slugify(c.input)).toBe(c.expected);
    });
  }
});

describe("initials - additional cases", () => {
  const initialCases = [
    { name: "Alice", expected: "A" },
    { name: "Alice Bob", expected: "AB" },
    { name: "Alice Bob Charlie", expected: "ABC" },
    { name: "John Smith", expected: "JS" },
    { name: "Mary Jane Watson", expected: "MJW" },
    { name: "X Y", expected: "XY" },
    { name: "Gabriel Csapo", expected: "GC" },
    { name: "Security Officer", expected: "SO" },
    { name: "Chief Information Security Officer", expected: "CISO" },
    { name: "Data Protection", expected: "DP" },
    { name: "A B C D E", expected: "ABCDE" },
    { name: "lowercase name", expected: "LN" },
    { name: "UPPER CASE", expected: "UC" },
    { name: "mixed Case Name", expected: "MCN" },
  ];
  for (const c of initialCases) {
    it(`initials("${c.name}") = "${c.expected}"`, () => {
      expect(initials(c.name)).toBe(c.expected);
    });
  }
});

describe("escapeHtml - additional cases", () => {
  const escapeCases = [
    { input: "<div>", expected: "&lt;div&gt;" },
    { input: "</div>", expected: "&lt;/div&gt;" },
    {
      input: '<script>alert("xss")</script>',
      expected: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    },
    { input: "1 & 2", expected: "1 &amp; 2" },
    { input: 'He said "hello"', expected: "He said &quot;hello&quot;" },
    { input: "She said 'hi'", expected: "She said &#039;hi&#039;" },
    { input: "<br/>", expected: "&lt;br/&gt;" },
    { input: "a < b > c", expected: "a &lt; b &gt; c" },
    { input: "x && y", expected: "x &amp;&amp; y" },
    { input: "\"double\" & 'single'", expected: "&quot;double&quot; &amp; &#039;single&#039;" },
    { input: "no special chars", expected: "no special chars" },
    { input: "123", expected: "123" },
    { input: "", expected: "" },
  ];
  for (const c of escapeCases) {
    it(`escapeHtml("${c.input.slice(0, 20)}") = "${c.expected.slice(0, 30)}"`, () => {
      expect(escapeHtml(c.input)).toBe(c.expected);
    });
  }
});

describe("capitalize - additional cases", () => {
  const capitalizeCases = [
    { input: "hello", expected: "Hello" },
    { input: "world", expected: "World" },
    { input: "foo", expected: "Foo" },
    { input: "bar", expected: "Bar" },
    { input: "test", expected: "Test" },
    { input: "abc", expected: "Abc" },
    { input: "xyz", expected: "Xyz" },
    { input: "one two", expected: "One two" },
    { input: "HELLO", expected: "Hello" },
    { input: "hELLO", expected: "Hello" },
  ];
  for (const c of capitalizeCases) {
    it(`capitalize("${c.input}") = "${c.expected}"`, () => {
      expect(capitalize(c.input)).toBe(c.expected);
    });
  }
});
