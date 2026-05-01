import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Counter } from "./Counter";

// Component tests use @testing-library/react for render/screen/fireEvent —
// the typical pattern in a Vitest project. Test DSL and vi come from 'vitest',
// which roadtest's --vitest-compat flag redirects to its built-in shim.

describe("Counter component", () => {
  it("starts at 0 by default", () => {
    render(<Counter />);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("starts at a custom initial value", () => {
    render(<Counter initial={10} />);
    expect(screen.getByTestId("count").textContent).toBe("10");
  });

  it("increments when + is clicked", () => {
    render(<Counter />);
    fireEvent.click(screen.getByLabelText("increment"));
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("decrements when − is clicked", () => {
    render(<Counter initial={5} />);
    fireEvent.click(screen.getByLabelText("decrement"));
    expect(screen.getByTestId("count").textContent).toBe("4");
  });

  it("respects a custom step", () => {
    render(<Counter initial={0} step={5} />);
    fireEvent.click(screen.getByLabelText("increment"));
    expect(screen.getByTestId("count").textContent).toBe("5");
    fireEvent.click(screen.getByLabelText("increment"));
    expect(screen.getByTestId("count").textContent).toBe("10");
  });

  it("calls onCountChange spy with the new count", () => {
    const onChange = vi.fn();
    render(<Counter onCountChange={onChange} />);

    fireEvent.click(screen.getByLabelText("increment"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText("increment"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("onCountChange receives correct value after decrement", () => {
    const onChange = vi.fn();
    render(<Counter initial={3} onCountChange={onChange} />);
    fireEvent.click(screen.getByLabelText("decrement"));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
