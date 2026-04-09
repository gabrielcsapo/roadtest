import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the label", async () => {
    const { getByRole } = await render(<Button label="Click me" />);
    expect(getByRole("button").textContent).toBe("Click me");
  });

  it("primary variant (default)", async () => {
    await render(<Button label="Primary" />);
  });

  it("secondary variant", async () => {
    await render(<Button label="Secondary" variant="secondary" />);
  });

  it("danger variant", async () => {
    await render(<Button label="Delete" variant="danger" />);
  });

  it("disabled state", async () => {
    const { getByRole } = await render(<Button label="Can't touch this" disabled />);
    const btn = getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("fires onClick when clicked", async () => {
    let clicked = false;
    const { getByRole } = await render(
      <Button
        label="Click me"
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByRole("button"));
    expect(clicked).toBe(true);
  });

  it.skip("wrong label", async () => {
    const { getByRole } = await render(<Button label="Submit" />);
    expect(getByRole("button").textContent).toBe("Save");
  });

  it("all variants", async () => {
    await render(<Button label="Primary" />);
    await render(<Button label="Secondary" variant="secondary" />);
    await render(<Button label="Danger" variant="danger" />);
    await render(<Button label="Disabled" disabled />);
  });
});
