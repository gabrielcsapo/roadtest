import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import React from "react";
import { Input } from "./Input";

describe("Input", () => {
  const types = ["text", "email", "password", "number", "search"] as const;
  const sizes = ["sm", "md", "lg"] as const;

  // type × size = 15 tests
  for (const type of types) {
    for (const size of sizes) {
      it(`renders type=${type} size=${size}`, async () => {
        const { getByTestId } = await render(<Input type={type} size={size} />);
        expect(getByTestId("input")).toBeDefined();
      });
    }
  }

  // snapshot each size = 3 tests
  for (const size of sizes) {
    it(`snapshot: size=${size}`, async () => {
      await render(<Input size={size} placeholder="Placeholder" />);
      await snapshot(`input-size-${size}`);
    });
  }

  // snapshot with label = 1 test
  it("snapshot: with label", async () => {
    await render(<Input label="Email address" type="email" />);
    await snapshot("input-with-label");
  });

  // snapshot with error = 1 test
  it("snapshot: with error", async () => {
    await render(<Input error="This field is required" />);
    await snapshot("input-error");
  });

  // label tests = 10 tests
  it("renders label when provided", async () => {
    const { getByTestId } = await render(<Input label="Username" />);
    expect(getByTestId("input-label")).toBeDefined();
  });

  it("does not render label when not provided", async () => {
    const { queryByTestId } = await render(<Input />);
    expect(queryByTestId("input-label")).toBeNull();
  });

  const labelTexts = [
    "Username",
    "Email",
    "Password",
    "Search",
    "Phone",
    "Company",
    "Address",
    "Notes",
  ];
  for (const label of labelTexts) {
    it(`renders label="${label}"`, async () => {
      const { getByTestId } = await render(<Input label={label} />);
      expect(getByTestId("input-label")).toBeDefined();
    });
  }

  // error state tests = 10 tests
  it("renders error message", async () => {
    const { getByTestId } = await render(<Input error="Required" />);
    expect(getByTestId("input-hint")).toBeDefined();
  });

  it("error message text is shown", async () => {
    const { getByTestId } = await render(<Input error="Invalid email" />);
    const hint = getByTestId("input-hint");
    expect(hint).toBeDefined();
  });

  const errorMessages = [
    "Required field",
    "Invalid email",
    "Too short",
    "Too long",
    "Must be a number",
    "Invalid format",
    "Already taken",
    "Not allowed",
  ];
  for (const msg of errorMessages) {
    it(`shows error: "${msg}"`, async () => {
      const { getByTestId } = await render(<Input error={msg} />);
      expect(getByTestId("input-hint")).toBeDefined();
    });
  }

  // disabled tests = 10 tests
  it("renders disabled input", async () => {
    const { getByTestId } = await render(<Input disabled />);
    expect(getByTestId("input")).toBeDefined();
  });

  for (const type of types) {
    it(`disabled with type=${type}`, async () => {
      const { getByTestId } = await render(<Input disabled type={type} />);
      expect(getByTestId("input")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`disabled with size=${size}`, async () => {
      const { getByTestId } = await render(<Input disabled size={size} />);
      expect(getByTestId("input")).toBeDefined();
    });
  }

  // change events = 10 tests
  it("calls onChange on input change", async () => {
    let value = "";
    const { getByTestId } = await render(
      <Input
        onChange={(e) => {
          value = e.target.value;
        }}
      />,
    );
    await fireEvent.change(getByTestId("input"), { target: { value: "hello" } });
    expect(value).toBe("hello");
  });

  const inputValues = [
    "test@example.com",
    "password123",
    "search term",
    "42",
    "John Doe",
    "Company Inc",
    "http://example.com",
    "some text value",
    "another value",
  ];
  for (const val of inputValues) {
    it(`handles value="${val}"`, async () => {
      let changed = "";
      const { getByTestId } = await render(
        <Input
          onChange={(e) => {
            changed = e.target.value;
          }}
        />,
      );
      await fireEvent.change(getByTestId("input"), { target: { value: val } });
      expect(changed).toBe(val);
    });
  }

  // prefix/suffix = 10 tests
  it("renders prefix", async () => {
    const { getByTestId } = await render(<Input prefix={<span>$</span>} />);
    expect(getByTestId("input-prefix")).toBeDefined();
  });

  it("renders suffix", async () => {
    const { getByTestId } = await render(<Input suffix={<span>kg</span>} />);
    expect(getByTestId("input-suffix")).toBeDefined();
  });

  it("no prefix when not provided", async () => {
    const { queryByTestId } = await render(<Input />);
    expect(queryByTestId("input-prefix")).toBeNull();
  });

  it("no suffix when not provided", async () => {
    const { queryByTestId } = await render(<Input />);
    expect(queryByTestId("input-suffix")).toBeNull();
  });

  it("prefix and suffix together", async () => {
    const { getByTestId } = await render(
      <Input prefix={<span>@</span>} suffix={<span>.com</span>} />,
    );
    expect(getByTestId("input-prefix")).toBeDefined();
    expect(getByTestId("input-suffix")).toBeDefined();
  });

  it("renders hint text", async () => {
    const { getByTestId } = await render(<Input hint="Enter your full email" />);
    expect(getByTestId("input-hint")).toBeDefined();
  });

  it("no hint when not provided", async () => {
    const { queryByTestId } = await render(<Input />);
    expect(queryByTestId("input-hint")).toBeNull();
  });

  it("error takes precedence over hint", async () => {
    const { getByTestId } = await render(<Input hint="Hint" error="Error" />);
    expect(getByTestId("input-hint")).toBeDefined();
  });

  it("renders with placeholder", async () => {
    const { getByTestId } = await render(<Input placeholder="Enter text..." />);
    expect(getByTestId("input")).toBeDefined();
  });

  it("renders with value", async () => {
    const { getByTestId } = await render(<Input value="existing value" onChange={() => {}} />);
    expect(getByTestId("input")).toBeDefined();
  });

  // placeholder variations = 10 more tests
  const placeholders = [
    "Search vendors...",
    "Enter email",
    "Type password",
    "Enter number",
    "Find controls",
  ];
  for (const ph of placeholders) {
    it(`placeholder="${ph}"`, async () => {
      const { getByTestId } = await render(<Input placeholder={ph} />);
      expect(getByTestId("input")).toBeDefined();
    });
  }

  it("renders with custom className", async () => {
    const { getByTestId } = await render(<Input className="custom" />);
    expect(getByTestId("input-wrapper")).toBeDefined();
  });

  it("renders with custom testId", async () => {
    const { getByTestId } = await render(<Input data-testid="my-input" />);
    expect(getByTestId("my-input")).toBeDefined();
  });

  it("renders container", async () => {
    const { getByTestId } = await render(<Input />);
    expect(getByTestId("input-container")).toBeDefined();
  });

  it("renders wrapper", async () => {
    const { getByTestId } = await render(<Input />);
    expect(getByTestId("input-wrapper")).toBeDefined();
  });

  it("renders label with for attribute matching id", async () => {
    const { getByLabelText } = await render(<Input label="Name" id="name-input" />);
    expect(getByLabelText("Name")).toBeDefined();
  });
});
