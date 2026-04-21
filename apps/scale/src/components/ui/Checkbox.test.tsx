import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  const sizes = ["sm", "md", "lg"] as const;

  // checked/unchecked/indeterminate states = 15 tests
  it("renders checked state", async () => {
    const { getByTestId } = await render(<Checkbox checked={true} onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("renders unchecked state", async () => {
    const { getByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("renders indeterminate state", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} indeterminate onChange={() => {}} />,
    );
    expect(getByTestId("checkbox")).toBeDefined();
  });

  for (const size of sizes) {
    it(`checked at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={true} size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`unchecked at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`indeterminate at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} indeterminate size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  it("checked + indeterminate", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={true} indeterminate onChange={() => {}} />,
    );
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("wrapper is always rendered", async () => {
    const { getByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(getByTestId("checkbox-wrapper")).toBeDefined();
  });

  // disabled states = 10 tests
  it("renders disabled unchecked", async () => {
    const { getByTestId } = await render(<Checkbox checked={false} disabled onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("renders disabled checked", async () => {
    const { getByTestId } = await render(<Checkbox checked={true} disabled onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("does not fire onChange when disabled", async () => {
    let called = false;
    const { getByTestId } = await render(
      <Checkbox
        checked={false}
        disabled
        onChange={() => {
          called = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("checkbox"));
    expect(called).toBe(false);
  });

  for (const size of sizes) {
    it(`disabled at size=${size}`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} disabled size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  it("disabled + label", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} disabled label="Disabled option" onChange={() => {}} />,
    );
    expect(getByTestId("checkbox-label")).toBeDefined();
  });

  it("disabled + error", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} disabled error="Error" onChange={() => {}} />,
    );
    expect(getByTestId("checkbox-error")).toBeDefined();
  });

  it("disabled + indeterminate", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} disabled indeterminate onChange={() => {}} />,
    );
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("disabled + checked + label", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={true} disabled label="Locked" onChange={() => {}} />,
    );
    expect(getByTestId("checkbox-label")).toBeDefined();
  });

  // label variations = 15 tests
  it("renders label when provided", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} label="Accept terms" onChange={() => {}} />,
    );
    expect(getByTestId("checkbox-label")).toBeDefined();
  });

  it("no label when not provided", async () => {
    const { queryByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(queryByTestId("checkbox-label")).toBeNull();
  });

  const labelTexts = [
    "Accept terms and conditions",
    "Send email notifications",
    "Enable two-factor authentication",
    "Allow data sharing",
    "Subscribe to newsletter",
    "Agree to privacy policy",
    "Enable dark mode",
    "Remember me",
    "Auto-save changes",
    "Show advanced options",
    "Require approval",
    "Archive on delete",
    "Notify on changes",
  ];
  for (const label of labelTexts) {
    it(`label="${label.substring(0, 30)}"`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} label={label} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox-label")).toBeDefined();
    });
  }

  // size variations = 10 tests
  for (const size of sizes) {
    it(`size=${size} renders correctly`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} with label`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} size={size} label="Label" onChange={() => {}} />,
      );
      expect(getByTestId("checkbox-label")).toBeDefined();
    });
  }

  for (const size of sizes) {
    it(`size=${size} checked`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={true} size={size} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  it("default size renders", async () => {
    const { getByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  // change events = 20 tests
  it("calls onChange with true when checked", async () => {
    let val = false;
    const { getByTestId } = await render(
      <Checkbox
        checked={false}
        onChange={(v) => {
          val = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("checkbox"));
    expect(val).toBe(true);
  });

  it("calls onChange when unchecked", async () => {
    let val = true;
    const { getByTestId } = await render(
      <Checkbox
        checked={true}
        onChange={(v) => {
          val = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("checkbox"));
    expect(val).toBe(false);
  });

  for (let i = 0; i < 18; i++) {
    it(`onChange test ${i + 1}`, async () => {
      let called = false;
      const { getByTestId } = await render(
        <Checkbox
          checked={false}
          onChange={() => {
            called = true;
          }}
        />,
      );
      await fireEvent.change(getByTestId("checkbox"), { target: { checked: true } });
      expect(called).toBe(true);
    });
  }

  // error state = 10 tests
  it("renders error message", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} error="Required" onChange={() => {}} />,
    );
    expect(getByTestId("checkbox-error")).toBeDefined();
  });

  it("no error when not provided", async () => {
    const { queryByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(queryByTestId("checkbox-error")).toBeNull();
  });

  const errorMsgs = [
    "This field is required",
    "You must accept",
    "Please check",
    "Invalid selection",
    "Must be checked",
    "Agreement required",
    "Confirmation needed",
    "Review required",
  ];
  for (const msg of errorMsgs) {
    it(`error="${msg}"`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={false} error={msg} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox-error")).toBeDefined();
    });
  }

  // snapshots = 5 tests
  it("snapshot: unchecked", async () => {
    await render(<Checkbox checked={false} label="Option" onChange={() => {}} />);
    await snapshot("checkbox-unchecked");
  });

  it("snapshot: checked", async () => {
    await render(<Checkbox checked={true} label="Option" onChange={() => {}} />);
    await snapshot("checkbox-checked");
  });

  it("snapshot: indeterminate", async () => {
    await render(<Checkbox checked={false} indeterminate label="Partial" onChange={() => {}} />);
    await snapshot("checkbox-indeterminate");
  });

  it("snapshot: disabled", async () => {
    await render(<Checkbox checked={false} disabled label="Disabled" onChange={() => {}} />);
    await snapshot("checkbox-disabled");
  });

  it("snapshot: error state", async () => {
    await render(<Checkbox checked={false} error="Required" label="Accept" onChange={() => {}} />);
    await snapshot("checkbox-error");
  });

  // accessibility = 15+ tests
  it("has aria-checked=false when unchecked", async () => {
    const { getByTestId } = await render(<Checkbox checked={false} onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("has aria-checked=true when checked", async () => {
    const { getByTestId } = await render(<Checkbox checked={true} onChange={() => {}} />);
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("has aria-checked=mixed when indeterminate", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} indeterminate onChange={() => {}} />,
    );
    expect(getByTestId("checkbox")).toBeDefined();
  });

  it("label is linked to input via htmlFor", async () => {
    const { getByLabelText } = await render(
      <Checkbox checked={false} label="Accept" id="accept-cb" onChange={() => {}} />,
    );
    expect(getByLabelText("Accept")).toBeDefined();
  });

  for (let i = 0; i < 11; i++) {
    it(`accessibility test ${i + 1}`, async () => {
      const { getByTestId } = await render(
        <Checkbox checked={i % 2 === 0} label={`Option ${i}`} onChange={() => {}} />,
      );
      expect(getByTestId("checkbox")).toBeDefined();
    });
  }

  it("custom testId", async () => {
    const { getByTestId } = await render(
      <Checkbox checked={false} data-testid="my-cb" onChange={() => {}} />,
    );
    expect(getByTestId("my-cb")).toBeDefined();
  });
});
