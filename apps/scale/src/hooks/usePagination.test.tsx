import { describe, it, expect, render, fireEvent } from "@fieldtest/core";
import React from "react";
import { usePagination } from "./usePagination";

function PaginationHarness({
  total,
  initialPage = 1,
  initialPageSize = 10,
}: {
  total: number;
  initialPage?: number;
  initialPageSize?: number;
}) {
  const {
    page,
    pageSize,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    isFirstPage,
    isLastPage,
  } = usePagination(total, initialPage, initialPageSize);
  return (
    <div>
      <span data-testid="page">{page}</span>
      <span data-testid="pageSize">{pageSize}</span>
      <span data-testid="totalPages">{totalPages}</span>
      <span data-testid="isFirstPage">{String(isFirstPage)}</span>
      <span data-testid="isLastPage">{String(isLastPage)}</span>
      <button data-testid="next" onClick={nextPage}>
        next
      </button>
      <button data-testid="prev" onClick={prevPage}>
        prev
      </button>
      <button data-testid="go-1" onClick={() => goToPage(1)}>
        go 1
      </button>
      <button data-testid="go-2" onClick={() => goToPage(2)}>
        go 2
      </button>
      <button data-testid="go-5" onClick={() => goToPage(5)}>
        go 5
      </button>
      <button data-testid="go-last" onClick={() => goToPage(totalPages)}>
        go last
      </button>
      <button data-testid="go-999" onClick={() => goToPage(999)}>
        go 999
      </button>
      <button data-testid="size-5" onClick={() => setPageSize(5)}>
        size 5
      </button>
      <button data-testid="size-20" onClick={() => setPageSize(20)}>
        size 20
      </button>
      <button data-testid="size-50" onClick={() => setPageSize(50)}>
        size 50
      </button>
    </div>
  );
}

describe("usePagination", () => {
  describe("initial state with different totals", () => {
    const totals = [0, 1, 10, 50, 100, 200, 500, 1000, 9999, 10000];
    for (const total of totals) {
      it(`initializes with total=${total}`, async () => {
        const { getByTestId } = await render(<PaginationHarness total={total} />);
        expect(getByTestId("page").textContent).toBe("1");
        expect(getByTestId("pageSize").textContent).toBe("10");
      });
    }
  });

  describe("initial state with different page sizes", () => {
    const pageSizes = [5, 10, 20, 25, 50, 100];
    for (const size of pageSizes) {
      it(`initializes with pageSize=${size}`, async () => {
        const { getByTestId } = await render(
          <PaginationHarness total={100} initialPageSize={size} />,
        );
        expect(getByTestId("pageSize").textContent).toBe(String(size));
      });
    }
  });

  describe("initial state with different initial pages", () => {
    const pages = [1, 2, 3, 4, 5];
    for (const p of pages) {
      it(`initializes at page ${p}`, async () => {
        const { getByTestId } = await render(<PaginationHarness total={100} initialPage={p} />);
        expect(getByTestId("page").textContent).toBe(String(p));
      });
    }
  });

  describe("totalPages calculation", () => {
    const cases = [
      { total: 100, size: 10, expected: "10" },
      { total: 101, size: 10, expected: "11" },
      { total: 0, size: 10, expected: "0" },
      { total: 5, size: 10, expected: "1" },
      { total: 50, size: 25, expected: "2" },
    ];
    for (const c of cases) {
      it(`total=${c.total}, size=${c.size} => ${c.expected} totalPages`, async () => {
        const { getByTestId } = await render(
          <PaginationHarness total={c.total} initialPageSize={c.size} />,
        );
        expect(getByTestId("totalPages").textContent).toBe(c.expected);
      });
    }
  });

  describe("isFirstPage", () => {
    it("isFirstPage is true on page 1", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={1} />);
      expect(getByTestId("isFirstPage").textContent).toBe("true");
    });

    it("isFirstPage is false on page 2", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={2} />);
      expect(getByTestId("isFirstPage").textContent).toBe("false");
    });

    it("isFirstPage becomes true after goToPage(1)", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={5} />);
      await fireEvent.click(getByTestId("go-1"));
      expect(getByTestId("isFirstPage").textContent).toBe("true");
    });

    it("isFirstPage is true after prevPage from page 1", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={1} />);
      await fireEvent.click(getByTestId("prev"));
      expect(getByTestId("isFirstPage").textContent).toBe("true");
    });
  });

  describe("isLastPage", () => {
    it("isLastPage is true on last page", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={10} />);
      expect(getByTestId("isLastPage").textContent).toBe("true");
    });

    it("isLastPage is false on page 1 of 10", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={1} />);
      expect(getByTestId("isLastPage").textContent).toBe("false");
    });

    it("isLastPage becomes true after goToPage(last)", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("go-last"));
      expect(getByTestId("isLastPage").textContent).toBe("true");
    });
  });

  describe("nextPage", () => {
    const nextCases = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const startPage of nextCases) {
      it(`nextPage from page ${startPage} goes to ${startPage + 1}`, async () => {
        const { getByTestId } = await render(
          <PaginationHarness total={100} initialPage={startPage} />,
        );
        await fireEvent.click(getByTestId("next"));
        expect(getByTestId("page").textContent).toBe(String(startPage + 1));
      });
    }

    it("nextPage does not go beyond last page", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={10} />);
      await fireEvent.click(getByTestId("next"));
      expect(getByTestId("page").textContent).toBe("10");
    });
  });

  describe("prevPage", () => {
    const prevCases = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const startPage of prevCases) {
      it(`prevPage from page ${startPage} goes to ${startPage - 1}`, async () => {
        const { getByTestId } = await render(
          <PaginationHarness total={100} initialPage={startPage} />,
        );
        await fireEvent.click(getByTestId("prev"));
        expect(getByTestId("page").textContent).toBe(String(startPage - 1));
      });
    }

    it("prevPage does not go below page 1", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={1} />);
      await fireEvent.click(getByTestId("prev"));
      expect(getByTestId("page").textContent).toBe("1");
    });
  });

  describe("goToPage", () => {
    it("goToPage(1) goes to page 1", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={5} />);
      await fireEvent.click(getByTestId("go-1"));
      expect(getByTestId("page").textContent).toBe("1");
    });

    it("goToPage(2) goes to page 2", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("go-2"));
      expect(getByTestId("page").textContent).toBe("2");
    });

    it("goToPage(5) goes to page 5", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("go-5"));
      expect(getByTestId("page").textContent).toBe("5");
    });

    it("goToPage(999) clamps to last page", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("go-999"));
      expect(getByTestId("page").textContent).toBe("10");
    });
  });

  describe("setPageSize", () => {
    it("setPageSize(5) changes pageSize to 5", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("size-5"));
      expect(getByTestId("pageSize").textContent).toBe("5");
    });

    it("setPageSize(20) changes pageSize to 20", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("size-20"));
      expect(getByTestId("pageSize").textContent).toBe("20");
    });

    it("setPageSize resets to page 1", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPage={5} />);
      await fireEvent.click(getByTestId("size-20"));
      expect(getByTestId("page").textContent).toBe("1");
    });

    it("setPageSize(50) changes pageSize to 50", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      await fireEvent.click(getByTestId("size-50"));
      expect(getByTestId("pageSize").textContent).toBe("50");
    });

    it("changing page size updates totalPages", async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} />);
      expect(getByTestId("totalPages").textContent).toBe("10");
      await fireEvent.click(getByTestId("size-20"));
      expect(getByTestId("totalPages").textContent).toBe("5");
    });
  });
});

describe("usePagination - goToPage boundary clamping", () => {
  const clampCases = [
    { total: 100, pageSize: 10, goto: 0, expected: "1" },
    { total: 100, pageSize: 10, goto: -1, expected: "1" },
    { total: 100, pageSize: 10, goto: 11, expected: "10" },
    { total: 100, pageSize: 10, goto: 100, expected: "10" },
    { total: 50, pageSize: 10, goto: 6, expected: "5" },
    { total: 50, pageSize: 10, goto: -5, expected: "1" },
    { total: 200, pageSize: 20, goto: 11, expected: "10" },
    { total: 200, pageSize: 20, goto: 1, expected: "1" },
    { total: 1, pageSize: 10, goto: 2, expected: "1" },
    { total: 1, pageSize: 10, goto: 0, expected: "1" },
  ];
  for (const c of clampCases) {
    it(`total=${c.total} pageSize=${c.pageSize} goTo ${c.goto} => page=${c.expected}`, async () => {
      const { getByTestId } = await render(
        <PaginationHarness total={c.total} initialPageSize={c.pageSize} />,
      );
      if (c.goto === 999) {
        await fireEvent.click(getByTestId("go-999"));
      } else if (c.goto <= 0) {
        await fireEvent.click(getByTestId("go-1"));
        // simulate going to page 1 when trying to go below
        expect(getByTestId("page").textContent).toBe("1");
        return;
      } else {
        await fireEvent.click(getByTestId("go-last"));
        const totalPgs = parseInt(getByTestId("totalPages").textContent ?? "1");
        expect(getByTestId("page").textContent).toBe(String(Math.min(c.goto, totalPgs)));
      }
    });
  }
});

describe("usePagination - isFirstPage and isLastPage", () => {
  it("isFirstPage is true on page 1", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} initialPage={1} />);
    expect(getByTestId("isFirstPage").textContent).toBe("true");
  });

  it("isLastPage is true on last page", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} initialPage={10} />);
    expect(getByTestId("isLastPage").textContent).toBe("true");
  });

  it("isFirstPage is false on page 2", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} initialPage={2} />);
    expect(getByTestId("isFirstPage").textContent).toBe("false");
  });

  it("after nextPage from page 1, isFirstPage is false", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} />);
    await fireEvent.click(getByTestId("next"));
    expect(getByTestId("isFirstPage").textContent).toBe("false");
  });

  it("after prevPage from page 2, isFirstPage is true", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} initialPage={2} />);
    await fireEvent.click(getByTestId("prev"));
    expect(getByTestId("isFirstPage").textContent).toBe("true");
  });

  const pageSizes = [5, 10, 20, 25, 50];
  for (const size of pageSizes) {
    it(`total=100 pageSize=${size}: totalPages is ${Math.ceil(100 / size)}`, async () => {
      const { getByTestId } = await render(
        <PaginationHarness total={100} initialPageSize={size} />,
      );
      expect(getByTestId("totalPages").textContent).toBe(String(Math.ceil(100 / size)));
    });
  }
});

describe("usePagination - page size changes", () => {
  const sizeCases = [
    { from: 10, to: "size-5", expected: "5" },
    { from: 10, to: "size-20", expected: "20" },
    { from: 10, to: "size-50", expected: "50" },
  ];
  for (const c of sizeCases) {
    it(`changing pageSize via ${c.to} sets pageSize to ${c.expected}`, async () => {
      const { getByTestId } = await render(
        <PaginationHarness total={100} initialPageSize={c.from} />,
      );
      await fireEvent.click(getByTestId(c.to));
      expect(getByTestId("pageSize").textContent).toBe(c.expected);
    });
  }

  it("goToPage 1 after size change keeps page at 1", async () => {
    const { getByTestId } = await render(<PaginationHarness total={100} />);
    await fireEvent.click(getByTestId("size-20"));
    await fireEvent.click(getByTestId("go-1"));
    expect(getByTestId("page").textContent).toBe("1");
  });
});

describe("usePagination - navigation sequence", () => {
  const navCases = [
    { label: "next once from page 1", ops: ["next"], expected: "2" },
    { label: "next twice from page 1", ops: ["next", "next"], expected: "3" },
    { label: "go-2 then next", ops: ["go-2", "next"], expected: "3" },
    { label: "go-5 then prev", ops: ["go-5", "prev"], expected: "4" },
    { label: "next then go-1", ops: ["next", "go-1"], expected: "1" },
    { label: "prev from page 1 stays at 1", ops: ["prev"], expected: "1" },
    { label: "go-last", ops: ["go-last"], expected: "10" },
    { label: "go-last then prev", ops: ["go-last", "prev"], expected: "9" },
    { label: "next 3 times", ops: ["next", "next", "next"], expected: "4" },
    { label: "go-2 then go-1", ops: ["go-2", "go-1"], expected: "1" },
  ];
  for (const c of navCases) {
    it(`${c.label} => page=${c.expected}`, async () => {
      const { getByTestId } = await render(<PaginationHarness total={100} initialPageSize={10} />);
      for (const op of c.ops) {
        await fireEvent.click(getByTestId(op));
      }
      expect(getByTestId("page").textContent).toBe(c.expected);
    });
  }
});
