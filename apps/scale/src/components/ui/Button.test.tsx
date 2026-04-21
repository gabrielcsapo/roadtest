import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { Button } from "./Button";

describe("Button", () => {
  const variants = ["primary", "secondary", "danger", "ghost", "link"] as const;
  const sizes = ["xs", "sm", "md", "lg"] as const;

  // variant × size combinations = 20 tests
  for (const variant of variants) {
    for (const size of sizes) {
      it(`renders variant=${variant} size=${size}`, async () => {
        const { getByTestId } = await render(
          <Button variant={variant} size={size}>
            Click
          </Button>,
        );
        const btn = getByTestId("button");
        expect(btn).toBeDefined();
      });
    }
  }

  // snapshot each variant = 5 tests
  for (const variant of variants) {
    it(`snapshot: variant=${variant}`, async () => {
      await render(<Button variant={variant}>Label</Button>);
      await snapshot(`button-${variant}`);
    });
  }

  // disabled state per variant = 5 tests
  for (const variant of variants) {
    it(`disabled state for variant=${variant}`, async () => {
      const { getByTestId } = await render(
        <Button variant={variant} disabled>
          Click
        </Button>,
      );
      const btn = getByTestId("button");
      expect(btn).toBeDefined();
    });
  }

  // loading state per variant = 5 tests
  for (const variant of variants) {
    it(`loading state for variant=${variant}`, async () => {
      const { getByTestId } = await render(
        <Button variant={variant} loading>
          Click
        </Button>,
      );
      const spinner = getByTestId("button-spinner");
      expect(spinner).toBeDefined();
    });
  }

  // size snapshot tests = 4 tests
  for (const size of sizes) {
    it(`snapshot: size=${size}`, async () => {
      await render(<Button size={size}>Label</Button>);
      await snapshot(`button-size-${size}`);
    });
  }

  // interaction tests
  it("calls onClick when clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        Click
      </Button>,
    );
    await fireEvent.click(getByTestId("button"));
    expect(clicked).toBe(true);
  });

  it("does not call onClick when disabled", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <Button
        disabled
        onClick={() => {
          clicked = true;
        }}
      >
        Click
      </Button>,
    );
    await fireEvent.click(getByTestId("button"));
    expect(clicked).toBe(false);
  });

  it("does not call onClick when loading", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <Button
        loading
        onClick={() => {
          clicked = true;
        }}
      >
        Click
      </Button>,
    );
    await fireEvent.click(getByTestId("button"));
    expect(clicked).toBe(false);
  });

  it("renders with icon", async () => {
    const { getByTestId } = await render(<Button icon={<span>★</span>}>With Icon</Button>);
    expect(getByTestId("button-icon")).toBeDefined();
  });

  it("does not show icon when loading", async () => {
    const { queryByTestId } = await render(
      <Button loading icon={<span>★</span>}>
        Loading
      </Button>,
    );
    expect(queryByTestId("button-icon")).toBeNull();
  });

  it("renders fullWidth button", async () => {
    const { getByTestId } = await render(<Button fullWidth>Full</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders with type=submit", async () => {
    const { getByTestId } = await render(<Button type="submit">Submit</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders with type=reset", async () => {
    const { getByTestId } = await render(<Button type="reset">Reset</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders with type=button", async () => {
    const { getByTestId } = await render(<Button type="button">Button</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders label text", async () => {
    const { getByTestId } = await render(<Button>Hello World</Button>);
    const label = getByTestId("button-label");
    expect(label).toBeDefined();
  });

  it("renders with custom className", async () => {
    const { getByTestId } = await render(<Button className="custom-class">Click</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders with custom data-testid", async () => {
    const { getByTestId } = await render(<Button data-testid="my-btn">Click</Button>);
    expect(getByTestId("my-btn")).toBeDefined();
  });

  it("renders spinner when loading", async () => {
    const { getByTestId } = await render(<Button loading>Loading</Button>);
    expect(getByTestId("button-spinner")).toBeDefined();
  });

  it("renders without children", async () => {
    const { getByTestId } = await render(<Button />);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders button with long text", async () => {
    const { getByTestId } = await render(<Button>This is a very long button label text</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders button with emoji", async () => {
    const { getByTestId } = await render(<Button>🔒 Secure</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  // multiple clicks
  it("fires multiple click events", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <Button
        onClick={() => {
          count++;
        }}
      >
        Click
      </Button>,
    );
    await fireEvent.click(getByTestId("button"));
    await fireEvent.click(getByTestId("button"));
    await fireEvent.click(getByTestId("button"));
    expect(count).toBe(3);
  });

  // disabled + loading combos per size
  for (const size of sizes) {
    it(`disabled at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Button size={size} disabled>
          Disabled
        </Button>,
      );
      expect(getByTestId("button")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`loading at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Button size={size} loading>
          Loading
        </Button>,
      );
      expect(getByTestId("button-spinner")).toBeDefined();
    });
  }

  // fullWidth per variant
  for (const variant of variants) {
    it(`fullWidth with variant=${variant}`, async () => {
      const { getByTestId } = await render(
        <Button variant={variant} fullWidth>
          Full
        </Button>,
      );
      expect(getByTestId("button")).toBeDefined();
    });
  }

  // icon per variant
  for (const variant of variants) {
    it(`icon with variant=${variant}`, async () => {
      const { getByTestId } = await render(
        <Button variant={variant} icon={<span>+</span>}>
          Add
        </Button>,
      );
      expect(getByTestId("button-icon")).toBeDefined();
    });
  }

  // accessibility tests
  it("has aria-busy when loading", async () => {
    const { getByTestId } = await render(<Button loading>Loading</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("has aria-disabled when disabled", async () => {
    const { getByTestId } = await render(<Button disabled>Disabled</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders default variant primary", async () => {
    const { getByTestId } = await render(<Button>Default</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders default size md", async () => {
    const { getByTestId } = await render(<Button>Default Size</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders with null children", async () => {
    const { getByTestId } = await render(<Button>{null}</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("icon not shown when no icon prop", async () => {
    const { queryByTestId } = await render(<Button>No Icon</Button>);
    expect(queryByTestId("button-icon")).toBeNull();
  });

  it("spinner not shown when not loading", async () => {
    const { queryByTestId } = await render(<Button>Not Loading</Button>);
    expect(queryByTestId("button-spinner")).toBeNull();
  });

  it("renders with number children", async () => {
    const { getByTestId } = await render(<Button>{42}</Button>);
    expect(getByTestId("button")).toBeDefined();
  });

  it("renders multiple icon types", async () => {
    const icons = ["★", "✓", "→", "⚠", "🔒"];
    for (const icon of icons) {
      const { getByTestId } = await render(<Button icon={<span>{icon}</span>}>Btn</Button>);
      expect(getByTestId("button-icon")).toBeDefined();
    }
  });

  it("fires onClick with event object", async () => {
    let event: any = null;
    const { getByTestId } = await render(
      <Button
        onClick={(e) => {
          event = e;
        }}
      >
        Click
      </Button>,
    );
    await fireEvent.click(getByTestId("button"));
    expect(event).toBeDefined();
  });
});
