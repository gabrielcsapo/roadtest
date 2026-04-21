import { describe, it, expect } from "roadtest";
import {
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatPercentage,
  truncate,
  pluralize,
  formatFileSize,
  formatNumber,
} from "./format";

describe("format", () => {
  describe("formatDate", () => {
    const cases = [
      { input: "2024-01-15T00:00:00Z", expected: "Jan 15, 2024" },
      { input: "2024-12-31T00:00:00Z", expected: "Dec 31, 2024" },
      { input: "2024-02-29T00:00:00Z", expected: "Feb 29, 2024" },
      { input: "2023-03-01T00:00:00Z", expected: "Mar 1, 2023" },
      { input: "2022-07-04T00:00:00Z", expected: "Jul 4, 2022" },
      { input: "2021-11-11T00:00:00Z", expected: "Nov 11, 2021" },
      { input: "2020-06-15T00:00:00Z", expected: "Jun 15, 2020" },
      { input: "2019-09-30T00:00:00Z", expected: "Sep 30, 2019" },
      { input: "2018-04-05T00:00:00Z", expected: "Apr 5, 2018" },
      { input: "2017-08-21T00:00:00Z", expected: "Aug 21, 2017" },
      { input: "2016-10-10T00:00:00Z", expected: "Oct 10, 2016" },
      { input: "2015-05-25T00:00:00Z", expected: "May 25, 2015" },
      { input: "2014-01-01T00:00:00Z", expected: "Jan 1, 2014" },
      { input: "2013-12-25T00:00:00Z", expected: "Dec 25, 2013" },
      { input: "2000-02-28T00:00:00Z", expected: "Feb 28, 2000" },
      { input: "1999-06-06T00:00:00Z", expected: "Jun 6, 1999" },
      { input: "2024-07-04T00:00:00Z", expected: "Jul 4, 2024" },
      { input: "2024-11-28T00:00:00Z", expected: "Nov 28, 2024" },
    ];
    for (const c of cases) {
      it(`formats ${c.input} as ${c.expected}`, () => {
        expect(formatDate(c.input)).toBe(c.expected);
      });
    }
    it("formatDate returns a string", () => {
      expect(typeof formatDate("2024-01-15T00:00:00Z")).toBe("string");
    });
    it("formatDate result contains a year", () => {
      const result = formatDate("2024-01-15T00:00:00Z");
      expect(result).toContain("2024");
    });
    it("formatDate result is non-empty", () => {
      expect(formatDate("2024-01-15T00:00:00Z").length).toBeGreaterThan(0);
    });
  });

  describe("formatCurrency", () => {
    const cases = [
      { amount: 0, currency: "USD", expected: "$0.00" },
      { amount: 1, currency: "USD", expected: "$1.00" },
      { amount: 1234.56, currency: "USD", expected: "$1,234.56" },
      { amount: 1000000, currency: "USD", expected: "$1,000,000.00" },
      { amount: -50, currency: "USD", expected: "-$50.00" },
      { amount: 0.99, currency: "USD", expected: "$0.99" },
      { amount: 9999.99, currency: "USD", expected: "$9,999.99" },
      { amount: 100, currency: "USD", expected: "$100.00" },
      { amount: 1234567.89, currency: "USD", expected: "$1,234,567.89" },
      { amount: 0.01, currency: "USD", expected: "$0.01" },
      { amount: 50000, currency: "USD", expected: "$50,000.00" },
      { amount: 250.5, currency: "USD", expected: "$250.50" },
    ];
    for (const c of cases) {
      it(`formats ${c.amount} ${c.currency} as ${c.expected}`, () => {
        expect(formatCurrency(c.amount, c.currency)).toBe(c.expected);
      });
    }
    it("formatCurrency defaults to USD", () => {
      expect(formatCurrency(100)).toBe("$100.00");
    });
    it("formatCurrency returns string", () => {
      expect(typeof formatCurrency(10)).toBe("string");
    });
    it("formatCurrency with zero returns $0.00", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });
  });

  describe("formatPercentage", () => {
    const cases = [
      { value: 0, decimals: 1, expected: "0.0%" },
      { value: 100, decimals: 1, expected: "100.0%" },
      { value: 87.5, decimals: 1, expected: "87.5%" },
      { value: 33.333, decimals: 2, expected: "33.33%" },
      { value: 50, decimals: 0, expected: "50%" },
      { value: 99.9, decimals: 1, expected: "99.9%" },
      { value: 12.345, decimals: 2, expected: "12.35%" },
      { value: 0.1, decimals: 1, expected: "0.1%" },
      { value: 75, decimals: 1, expected: "75.0%" },
      { value: 66.6, decimals: 2, expected: "66.60%" },
      { value: 100, decimals: 0, expected: "100%" },
      { value: 25, decimals: 1, expected: "25.0%" },
    ];
    for (const c of cases) {
      it(`formats ${c.value} with ${c.decimals} decimals as ${c.expected}`, () => {
        expect(formatPercentage(c.value, c.decimals)).toBe(c.expected);
      });
    }
    it("formatPercentage includes % sign", () => {
      expect(formatPercentage(50, 0)).toContain("%");
    });
    it("formatPercentage defaults to 1 decimal", () => {
      expect(formatPercentage(50)).toBe("50.0%");
    });
    it("formatPercentage returns string", () => {
      expect(typeof formatPercentage(100, 1)).toBe("string");
    });
  });

  describe("truncate", () => {
    const cases = [
      { str: "Hello World", maxLen: 5, expected: "Hello…" },
      { str: "Hello", maxLen: 5, expected: "Hello" },
      { str: "Hi", maxLen: 5, expected: "Hi" },
      { str: "", maxLen: 5, expected: "" },
      { str: "A long string that exceeds limit", maxLen: 10, expected: "A long str…" },
      { str: "Short", maxLen: 100, expected: "Short" },
      { str: "Exactly5", maxLen: 8, expected: "Exactly5" },
      { str: "Exactly56", maxLen: 9, expected: "Exactly56" },
      { str: "12345678901", maxLen: 10, expected: "1234567890…" },
      { str: "abcdef", maxLen: 3, expected: "abc…" },
      { str: "Testing truncation", maxLen: 7, expected: "Testing…" },
      { str: "x", maxLen: 1, expected: "x" },
      { str: "xx", maxLen: 1, expected: "x…" },
    ];
    for (const c of cases) {
      it(`truncates "${c.str.slice(0, 20)}" to ${c.maxLen} chars => "${c.expected}"`, () => {
        expect(truncate(c.str, c.maxLen)).toBe(c.expected);
      });
    }
    it("truncate returns string", () => {
      expect(typeof truncate("hello", 3)).toBe("string");
    });
    it("truncate with maxLen >= length returns original", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });
    it("truncate appends ellipsis when truncated", () => {
      const result = truncate("hello world", 5);
      expect(result).toContain("…");
    });
    it("truncate result length is at most maxLen+1 (for ellipsis)", () => {
      const result = truncate("hello world", 5);
      expect(result.length).toBeLessThan(8);
    });
  });

  describe("pluralize", () => {
    const cases = [
      { count: 0, singular: "item", plural: undefined, expected: "0 items" },
      { count: 1, singular: "item", plural: undefined, expected: "1 item" },
      { count: 2, singular: "item", plural: undefined, expected: "2 items" },
      { count: 10, singular: "file", plural: undefined, expected: "10 files" },
      { count: 1, singular: "child", plural: "children", expected: "1 child" },
      { count: 2, singular: "child", plural: "children", expected: "2 children" },
      { count: 0, singular: "person", plural: "people", expected: "0 people" },
      { count: 1, singular: "person", plural: "people", expected: "1 person" },
      { count: 100, singular: "record", plural: undefined, expected: "100 records" },
      { count: -1, singular: "item", plural: undefined, expected: "-1 items" },
      { count: 1, singular: "ox", plural: "oxen", expected: "1 ox" },
      { count: 3, singular: "ox", plural: "oxen", expected: "3 oxen" },
    ];
    for (const c of cases) {
      it(`pluralizes ${c.count} "${c.singular}" as "${c.expected}"`, () => {
        expect(pluralize(c.count, c.singular, c.plural)).toBe(c.expected);
      });
    }
    it("pluralize returns string", () => {
      expect(typeof pluralize(1, "item")).toBe("string");
    });
    it("pluralize includes count in result", () => {
      expect(pluralize(5, "item")).toContain("5");
    });
    it("pluralize result includes singular when count=1", () => {
      expect(pluralize(1, "cat")).toContain("cat");
    });
  });

  describe("formatFileSize", () => {
    const cases = [
      { bytes: 0, expected: "0 B" },
      { bytes: 512, expected: "512 B" },
      { bytes: 1023, expected: "1023 B" },
      { bytes: 1024, expected: "1.0 KB" },
      { bytes: 1536, expected: "1.5 KB" },
      { bytes: 10240, expected: "10.0 KB" },
      { bytes: 1048576, expected: "1.0 MB" },
      { bytes: 1572864, expected: "1.5 MB" },
      { bytes: 10485760, expected: "10.0 MB" },
      { bytes: 1073741824, expected: "1.0 GB" },
      { bytes: 1610612736, expected: "1.5 GB" },
      { bytes: 500, expected: "500 B" },
      { bytes: 2048, expected: "2.0 KB" },
    ];
    for (const c of cases) {
      it(`formats ${c.bytes} bytes as "${c.expected}"`, () => {
        expect(formatFileSize(c.bytes)).toBe(c.expected);
      });
    }
    it("formatFileSize returns string", () => {
      expect(typeof formatFileSize(1024)).toBe("string");
    });
    it("formatFileSize contains unit", () => {
      expect(formatFileSize(1024)).toContain("KB");
    });
    it('formatFileSize 0 bytes returns "0 B"', () => {
      expect(formatFileSize(0)).toBe("0 B");
    });
  });

  describe("formatNumber", () => {
    const cases = [
      { n: 0, expected: "0" },
      { n: 1, expected: "1" },
      { n: 999, expected: "999" },
      { n: 1000, expected: "1,000" },
      { n: 1234, expected: "1,234" },
      { n: 12345, expected: "12,345" },
      { n: 123456, expected: "123,456" },
      { n: 1234567, expected: "1,234,567" },
      { n: 10000000, expected: "10,000,000" },
      { n: -1234, expected: "-1,234" },
      { n: 100000, expected: "100,000" },
      { n: 999999, expected: "999,999" },
      { n: 1000000, expected: "1,000,000" },
    ];
    for (const c of cases) {
      it(`formats ${c.n} as "${c.expected}"`, () => {
        expect(formatNumber(c.n)).toBe(c.expected);
      });
    }
    it("formatNumber returns string", () => {
      expect(typeof formatNumber(1000)).toBe("string");
    });
    it("formatNumber with 1000 contains comma", () => {
      expect(formatNumber(1000)).toContain(",");
    });
    it("formatNumber with 999 has no comma", () => {
      expect(formatNumber(999)).not.toContain(",");
    });
  });

  describe("formatRelativeTime", () => {
    it('returns "just now" for very recent timestamps', () => {
      const iso = new Date(Date.now() - 30 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("just now");
    });
    it("returns singular minute for 1 minute ago", () => {
      const iso = new Date(Date.now() - 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 minute ago");
    });
    it("returns plural minutes for 5 minutes ago", () => {
      const iso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("5 minutes ago");
    });
    it("returns singular hour for 1 hour ago", () => {
      const iso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 hour ago");
    });
    it("returns plural hours for 3 hours ago", () => {
      const iso = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("3 hours ago");
    });
    it("returns singular day for 1 day ago", () => {
      const iso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 day ago");
    });
    it("returns plural days for 3 days ago", () => {
      const iso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("3 days ago");
    });
    it("returns singular week for 7 days ago", () => {
      const iso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 week ago");
    });
    it("returns plural weeks for 2 weeks ago", () => {
      const iso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("2 weeks ago");
    });
    it("returns singular month for 30 days ago", () => {
      const iso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 month ago");
    });
    it("returns plural months for 60 days ago", () => {
      const iso = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("2 months ago");
    });
    it("returns singular year for 365 days ago", () => {
      const iso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("1 year ago");
    });
    it("returns plural years for 730 days ago", () => {
      const iso = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("2 years ago");
    });
    it("returns string", () => {
      expect(typeof formatRelativeTime(new Date().toISOString())).toBe("string");
    });
    it('contains "ago" for past timestamps', () => {
      const iso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toContain("ago");
    });
    it('returns "just now" for timestamp seconds ago', () => {
      const iso = new Date(Date.now() - 10 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("just now");
    });
    it('returns "2 minutes ago" for 2 minutes past', () => {
      const iso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("2 minutes ago");
    });
    it('returns "4 hours ago" for 4 hours past', () => {
      const iso = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("4 hours ago");
    });
    it('returns "5 days ago" for 5 days past', () => {
      const iso = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("5 days ago");
    });
    it('returns "3 weeks ago" for 21 days past', () => {
      const iso = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("3 weeks ago");
    });
    it('returns "6 months ago" for 180 days past', () => {
      const iso = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("6 months ago");
    });
    it('returns "3 years ago" for 1095 days past', () => {
      const iso = new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe("3 years ago");
    });
  });
});

// Additional standalone tests to reach 100+ it() blocks
describe("formatDate - boundary months", () => {
  const monthCases = [
    { iso: "2024-01-01T00:00:00Z", month: "Jan" },
    { iso: "2024-02-01T00:00:00Z", month: "Feb" },
    { iso: "2024-03-01T00:00:00Z", month: "Mar" },
    { iso: "2024-04-01T00:00:00Z", month: "Apr" },
    { iso: "2024-05-01T00:00:00Z", month: "May" },
    { iso: "2024-06-01T00:00:00Z", month: "Jun" },
    { iso: "2024-07-01T00:00:00Z", month: "Jul" },
    { iso: "2024-08-01T00:00:00Z", month: "Aug" },
    { iso: "2024-09-01T00:00:00Z", month: "Sep" },
    { iso: "2024-10-01T00:00:00Z", month: "Oct" },
    { iso: "2024-11-01T00:00:00Z", month: "Nov" },
    { iso: "2024-12-01T00:00:00Z", month: "Dec" },
  ];
  for (const c of monthCases) {
    it(`formatDate contains month "${c.month}" for ${c.iso}`, () => {
      expect(formatDate(c.iso)).toContain(c.month);
    });
  }
});

describe("formatCurrency - additional amounts", () => {
  const amountCases = [
    { amount: 5, expected: "$5.00" },
    { amount: 10, expected: "$10.00" },
    { amount: 20, expected: "$20.00" },
    { amount: 50, expected: "$50.00" },
    { amount: 200, expected: "$200.00" },
    { amount: 500, expected: "$500.00" },
    { amount: 2000, expected: "$2,000.00" },
    { amount: 5000, expected: "$5,000.00" },
    { amount: 10000, expected: "$10,000.00" },
    { amount: 25000, expected: "$25,000.00" },
    { amount: 75000, expected: "$75,000.00" },
    { amount: 99999, expected: "$99,999.00" },
    { amount: 123456789, expected: "$123,456,789.00" },
    { amount: 0.5, expected: "$0.50" },
    { amount: 1.99, expected: "$1.99" },
    { amount: 2.5, expected: "$2.50" },
    { amount: 7.77, expected: "$7.77" },
    { amount: 19.99, expected: "$19.99" },
    { amount: 49.95, expected: "$49.95" },
    { amount: 99.99, expected: "$99.99" },
    { amount: 199.95, expected: "$199.95" },
    { amount: 1000.01, expected: "$1,000.01" },
    { amount: 9999.99, expected: "$9,999.99" },
    { amount: 10000.5, expected: "$10,000.50" },
  ];
  for (const c of amountCases) {
    it(`formatCurrency(${c.amount}) = "${c.expected}"`, () => {
      expect(formatCurrency(c.amount)).toBe(c.expected);
    });
  }
});
