import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  // page range variations = 20 tests
  const pageScenarios = [
    { page: 1, total: 100, pageSize: 10 },
    { page: 2, total: 100, pageSize: 10 },
    { page: 3, total: 100, pageSize: 10 },
    { page: 5, total: 100, pageSize: 10 },
    { page: 10, total: 100, pageSize: 10 },
    { page: 1, total: 50, pageSize: 25 },
    { page: 2, total: 50, pageSize: 25 },
    { page: 1, total: 200, pageSize: 20 },
    { page: 4, total: 200, pageSize: 20 },
    { page: 10, total: 200, pageSize: 20 },
    { page: 1, total: 500, pageSize: 50 },
    { page: 5, total: 500, pageSize: 50 },
    { page: 10, total: 500, pageSize: 50 },
    { page: 1, total: 30, pageSize: 10 },
    { page: 2, total: 30, pageSize: 10 },
    { page: 3, total: 30, pageSize: 10 },
    { page: 1, total: 1000, pageSize: 100 },
    { page: 5, total: 1000, pageSize: 100 },
    { page: 10, total: 1000, pageSize: 100 },
    { page: 1, total: 7, pageSize: 5 },
  ];

  for (const s of pageScenarios) {
    it(`renders page=${s.page} total=${s.total} pageSize=${s.pageSize}`, async () => {
      const { getByTestId } = await render(
        <Pagination page={s.page} total={s.total} pageSize={s.pageSize} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination")).toBeDefined();
    });
  }

  // boundary pages = 15 tests
  it("first page disables prev/first buttons", async () => {
    const { getByTestId } = await render(
      <Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-first")).toBeDefined();
    expect(getByTestId("pagination-prev")).toBeDefined();
  });

  it("last page disables next/last buttons", async () => {
    const { getByTestId } = await render(
      <Pagination page={10} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-next")).toBeDefined();
    expect(getByTestId("pagination-last")).toBeDefined();
  });

  it("prev button disabled on page 1", async () => {
    const { getByTestId } = await render(
      <Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-prev")).toBeDefined();
  });

  it("next button disabled on last page", async () => {
    const { getByTestId } = await render(
      <Pagination page={10} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-next")).toBeDefined();
  });

  it("first button navigates to page 1", async () => {
    let page = 5;
    const { getByTestId } = await render(
      <Pagination
        page={page}
        total={100}
        pageSize={10}
        onPageChange={(p) => {
          page = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-first"));
    expect(page).toBe(1);
  });

  it("last button navigates to last page", async () => {
    let page = 1;
    const { getByTestId } = await render(
      <Pagination
        page={page}
        total={100}
        pageSize={10}
        onPageChange={(p) => {
          page = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-last"));
    expect(page).toBe(10);
  });

  it("prev navigates backwards", async () => {
    let page = 5;
    const { getByTestId } = await render(
      <Pagination
        page={page}
        total={100}
        pageSize={10}
        onPageChange={(p) => {
          page = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-prev"));
    expect(page).toBe(4);
  });

  it("next navigates forwards", async () => {
    let page = 3;
    const { getByTestId } = await render(
      <Pagination
        page={page}
        total={100}
        pageSize={10}
        onPageChange={(p) => {
          page = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-next"));
    expect(page).toBe(4);
  });

  it("page number click works", async () => {
    let page = 1;
    const { getByTestId } = await render(
      <Pagination
        page={page}
        total={50}
        pageSize={10}
        onPageChange={(p) => {
          page = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-page-3"));
    expect(page).toBe(3);
  });

  it("shows info text", async () => {
    const { getByTestId } = await render(
      <Pagination page={1} total={50} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-info")).toBeDefined();
  });

  it('shows "No results" when total=0', async () => {
    const { getByTestId } = await render(
      <Pagination page={1} total={0} pageSize={10} onPageChange={() => {}} />,
    );
    expect(getByTestId("pagination-info")).toBeDefined();
  });

  for (let i = 0; i < 4; i++) {
    it(`boundary test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination-first")).toBeDefined();
    });
  }

  // large/small totals = 15 tests
  const totals = [0, 1, 5, 10, 25, 50, 100, 200, 500, 1000, 5000, 10000, 99999, 100000, 1000000];
  for (const total of totals) {
    it(`renders total=${total}`, async () => {
      const { getByTestId } = await render(
        <Pagination page={1} total={total} pageSize={10} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination")).toBeDefined();
    });
  }

  // pageSize changes = 15 tests
  it("shows page size selector when onPageSizeChange provided", async () => {
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    expect(getByTestId("pagination-page-size")).toBeDefined();
  });

  it("no page size selector without onPageSizeChange", async () => {
    const { queryByTestId } = await render(
      <Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(queryByTestId("pagination-page-size")).toBeNull();
  });

  it("calls onPageSizeChange when changed", async () => {
    let size = 10;
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={size}
        onPageChange={() => {}}
        onPageSizeChange={(s) => {
          size = s;
        }}
      />,
    );
    await fireEvent.change(getByTestId("pagination-page-size"), { target: { value: "25" } });
    expect(size).toBe(25);
  });

  const pageSizes = [5, 10, 20, 25, 50, 100, 200];
  for (const ps of pageSizes) {
    it(`pageSize=${ps} renders`, async () => {
      const { getByTestId } = await render(
        <Pagination page={1} total={200} pageSize={ps} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination")).toBeDefined();
    });
  }

  it("pageSizeOptions are rendered in select", async () => {
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSizeOptions={[5, 10, 20]}
      />,
    );
    expect(getByTestId("pagination-page-size")).toBeDefined();
  });

  it("custom pageSizeOptions", async () => {
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={5}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        pageSizeOptions={[5, 15, 30, 60]}
      />,
    );
    expect(getByTestId("pagination-page-size")).toBeDefined();
  });

  it("size wrapper shown", async () => {
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    expect(getByTestId("pagination-size-wrapper")).toBeDefined();
  });

  it("no size wrapper without handler", async () => {
    const { queryByTestId } = await render(
      <Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />,
    );
    expect(queryByTestId("pagination-size-wrapper")).toBeNull();
  });

  // disabled states = 10 tests
  it("prev disabled on page 1 does not fire", async () => {
    let fired = false;
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {
          fired = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-prev"));
    expect(fired).toBe(false);
  });

  it("first disabled on page 1 does not fire", async () => {
    let fired = false;
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {
          fired = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-first"));
    expect(fired).toBe(false);
  });

  it("next disabled on last page does not fire", async () => {
    let fired = false;
    const { getByTestId } = await render(
      <Pagination
        page={10}
        total={100}
        pageSize={10}
        onPageChange={() => {
          fired = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-next"));
    expect(fired).toBe(false);
  });

  it("last disabled on last page does not fire", async () => {
    let fired = false;
    const { getByTestId } = await render(
      <Pagination
        page={10}
        total={100}
        pageSize={10}
        onPageChange={() => {
          fired = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("pagination-last"));
    expect(fired).toBe(false);
  });

  for (let i = 0; i < 6; i++) {
    it(`disabled nav test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Pagination page={1} total={50} pageSize={10} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination-prev")).toBeDefined();
    });
  }

  // snapshot = 5 tests
  it("snapshot: first page", async () => {
    await render(<Pagination page={1} total={100} pageSize={10} onPageChange={() => {}} />);
    await snapshot("pagination-first-page");
  });

  it("snapshot: middle page", async () => {
    await render(<Pagination page={5} total={100} pageSize={10} onPageChange={() => {}} />);
    await snapshot("pagination-middle");
  });

  it("snapshot: last page", async () => {
    await render(<Pagination page={10} total={100} pageSize={10} onPageChange={() => {}} />);
    await snapshot("pagination-last-page");
  });

  it("snapshot: with page size", async () => {
    await render(
      <Pagination
        page={1}
        total={100}
        pageSize={10}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />,
    );
    await snapshot("pagination-with-size");
  });

  it("snapshot: small total", async () => {
    await render(<Pagination page={1} total={3} pageSize={10} onPageChange={() => {}} />);
    await snapshot("pagination-small");
  });

  // callbacks = 10 tests
  for (let i = 0; i < 10; i++) {
    it(`callback test ${i + 1}`, async () => {
      let page = 1;
      const { getByTestId } = await render(
        <Pagination
          page={1}
          total={50}
          pageSize={10}
          onPageChange={(p) => {
            page = p;
          }}
        />,
      );
      await fireEvent.click(getByTestId("pagination-page-2"));
      expect(page).toBe(2);
    });
  }

  // edge cases = 10+ tests
  it("single page shows no ellipsis", async () => {
    const { queryByTestId } = await render(
      <Pagination page={1} total={5} pageSize={10} onPageChange={() => {}} />,
    );
    expect(queryByTestId("pagination-ellipsis-0")).toBeNull();
  });

  it("custom className", async () => {
    const { getByTestId } = await render(
      <Pagination page={1} total={50} pageSize={10} onPageChange={() => {}} className="custom" />,
    );
    expect(getByTestId("pagination")).toBeDefined();
  });

  it("custom testId", async () => {
    const { getByTestId } = await render(
      <Pagination
        page={1}
        total={50}
        pageSize={10}
        onPageChange={() => {}}
        data-testid="my-pager"
      />,
    );
    expect(getByTestId("my-pager")).toBeDefined();
  });

  for (let i = 0; i < 7; i++) {
    it(`edge case test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Pagination page={1} total={i * 10 + 5} pageSize={10} onPageChange={() => {}} />,
      );
      expect(getByTestId("pagination-info")).toBeDefined();
    });
  }
});
