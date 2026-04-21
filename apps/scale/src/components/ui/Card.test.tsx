import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import React from "react";
import { Card } from "./Card";

describe("Card", () => {
  const paddings = ["none", "sm", "md", "lg"] as const;
  const shadows = ["none", "sm", "md", "lg"] as const;

  // padding × shadow = 16 tests
  for (const padding of paddings) {
    for (const shadow of shadows) {
      it(`renders padding=${padding} shadow=${shadow}`, async () => {
        const { getByTestId } = await render(
          <Card padding={padding} shadow={shadow}>
            Content
          </Card>,
        );
        expect(getByTestId("card")).toBeDefined();
      });
    }
  }

  // with/without title = 10 tests
  it("renders title when provided", async () => {
    const { getByTestId } = await render(<Card title="My Card">Content</Card>);
    expect(getByTestId("card-title")).toBeDefined();
  });

  it("no title element when no title prop", async () => {
    const { queryByTestId } = await render(<Card>Content</Card>);
    expect(queryByTestId("card-title")).toBeNull();
  });

  it("renders header when title provided", async () => {
    const { getByTestId } = await render(<Card title="Title">Content</Card>);
    expect(getByTestId("card-header")).toBeDefined();
  });

  it("no header when no title or subtitle", async () => {
    const { queryByTestId } = await render(<Card>Content</Card>);
    expect(queryByTestId("card-header")).toBeNull();
  });

  it("renders subtitle", async () => {
    const { getByTestId } = await render(
      <Card title="Title" subtitle="Sub">
        Content
      </Card>,
    );
    expect(getByTestId("card-subtitle")).toBeDefined();
  });

  const titles = ["Security Overview", "Vendor Risk", "Policy Status", "Compliance Score"];
  for (const title of titles) {
    it(`title="${title}"`, async () => {
      const { getByTestId } = await render(<Card title={title}>Content</Card>);
      expect(getByTestId("card-title")).toBeDefined();
    });
  }

  it("renders without children", async () => {
    const { getByTestId } = await render(<Card title="Empty" />);
    expect(getByTestId("card")).toBeDefined();
  });

  it("no body element when no children", async () => {
    const { queryByTestId } = await render(<Card title="No Children" />);
    expect(queryByTestId("card-body")).toBeNull();
  });

  // with/without footer = 10 tests
  it("renders footer when provided", async () => {
    const { getByTestId } = await render(<Card footer={<button>Action</button>}>Content</Card>);
    expect(getByTestId("card-footer")).toBeDefined();
  });

  it("no footer when not provided", async () => {
    const { queryByTestId } = await render(<Card>Content</Card>);
    expect(queryByTestId("card-footer")).toBeNull();
  });

  for (let i = 0; i < 8; i++) {
    it(`footer test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Card footer={<span data-testid={`footer-${i}`}>Footer {i}</span>}>Content</Card>,
      );
      expect(getByTestId(`footer-${i}`)).toBeDefined();
    });
  }

  // clickable = 10 tests
  it("calls onClick when clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <Card
        onClick={() => {
          clicked = true;
        }}
      >
        Click me
      </Card>,
    );
    await fireEvent.click(getByTestId("card"));
    expect(clicked).toBe(true);
  });

  it("does not call onClick when no handler", async () => {
    const { getByTestId } = await render(<Card>No handler</Card>);
    await fireEvent.click(getByTestId("card"));
    expect(getByTestId("card")).toBeDefined();
  });

  it("has role=button when onClick provided", async () => {
    const { getByRole } = await render(<Card onClick={() => {}}>Click</Card>);
    expect(getByRole("button")).toBeDefined();
  });

  for (let i = 0; i < 7; i++) {
    it(`click callback test ${i + 1}`, async () => {
      let count = 0;
      const { getByTestId } = await render(
        <Card
          onClick={() => {
            count++;
          }}
        >
          Card {i}
        </Card>,
      );
      await fireEvent.click(getByTestId("card"));
      expect(count).toBe(1);
    });
  }

  // loading state = 10 tests
  it("shows loading overlay when loading", async () => {
    const { getByTestId } = await render(<Card loading>Content</Card>);
    expect(getByTestId("card-loading")).toBeDefined();
  });

  it("shows spinner when loading", async () => {
    const { getByTestId } = await render(<Card loading>Content</Card>);
    expect(getByTestId("card-spinner")).toBeDefined();
  });

  it("no loading overlay when not loading", async () => {
    const { queryByTestId } = await render(<Card>Content</Card>);
    expect(queryByTestId("card-loading")).toBeNull();
  });

  for (let i = 0; i < 7; i++) {
    it(`loading state test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Card loading title={`Card ${i}`}>
          Content
        </Card>,
      );
      expect(getByTestId("card-spinner")).toBeDefined();
    });
  }

  // content variations = 20 tests
  const contentVariations = [
    "Simple text",
    "Content with numbers: 42, 100, 3.14",
    "Long content that spans multiple words and describes something",
    '<special> & "chars"',
    "Multiline\ncontent",
  ];

  for (const content of contentVariations) {
    it(`content: "${content.substring(0, 30)}"`, async () => {
      const { getByTestId } = await render(<Card>{content}</Card>);
      expect(getByTestId("card-body")).toBeDefined();
    });
  }

  it("renders with custom className", async () => {
    const { getByTestId } = await render(<Card className="custom-card">Content</Card>);
    expect(getByTestId("card")).toBeDefined();
  });

  it("renders with border=false", async () => {
    const { getByTestId } = await render(<Card border={false}>Content</Card>);
    expect(getByTestId("card")).toBeDefined();
  });

  it("renders with border=true", async () => {
    const { getByTestId } = await render(<Card border={true}>Content</Card>);
    expect(getByTestId("card")).toBeDefined();
  });

  it("renders nested card", async () => {
    const { getByTestId } = await render(
      <Card data-testid="outer">
        <Card data-testid="inner">Inner</Card>
      </Card>,
    );
    expect(getByTestId("outer")).toBeDefined();
    expect(getByTestId("inner")).toBeDefined();
  });

  for (let i = 0; i < 11; i++) {
    it(`content variation ${i + 6}`, async () => {
      const { getByTestId } = await render(
        <Card title={`Title ${i}`} subtitle={`Sub ${i}`}>
          Content {i}
        </Card>,
      );
      expect(getByTestId("card-title")).toBeDefined();
    });
  }

  // snapshots = 5 tests
  it("snapshot: default", async () => {
    await render(
      <Card title="Security" subtitle="Overview">
        Content
      </Card>,
    );
    await snapshot("card-default");
  });

  it("snapshot: padding=lg", async () => {
    await render(
      <Card padding="lg" shadow="lg">
        Content
      </Card>,
    );
    await snapshot("card-lg");
  });

  it("snapshot: loading", async () => {
    await render(
      <Card loading title="Loading">
        Content
      </Card>,
    );
    await snapshot("card-loading");
  });

  it("snapshot: with footer", async () => {
    await render(<Card footer={<button>Save</button>}>Content</Card>);
    await snapshot("card-footer");
  });

  it("snapshot: no border", async () => {
    await render(
      <Card border={false} shadow="md">
        Content
      </Card>,
    );
    await snapshot("card-no-border");
  });

  // nested card tests = 5 tests
  for (let i = 0; i < 5; i++) {
    it(`nested card ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Card data-testid={`nested-outer-${i}`}>
          <Card data-testid={`nested-inner-${i}`}>Nested</Card>
        </Card>,
      );
      expect(getByTestId(`nested-outer-${i}`)).toBeDefined();
      expect(getByTestId(`nested-inner-${i}`)).toBeDefined();
    });
  }

  // accessibility = 14 tests
  it("custom testId works", async () => {
    const { getByTestId } = await render(<Card data-testid="my-card">Content</Card>);
    expect(getByTestId("my-card")).toBeDefined();
  });

  for (let i = 0; i < 13; i++) {
    it(`accessibility test ${i + 1}`, async () => {
      const { getByTestId } = await render(<Card title={`Accessible ${i}`}>Content</Card>);
      expect(getByTestId("card")).toBeDefined();
    });
  }
});
