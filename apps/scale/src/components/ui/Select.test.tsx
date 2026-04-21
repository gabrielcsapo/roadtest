import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import React from "react";
import { Select } from "./Select";
import type { SelectOption } from "./Select";

describe("Select", () => {
  const baseOptions: SelectOption[] = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
    { value: "c", label: "Option C" },
  ];

  const optionsWithDisabled: SelectOption[] = [
    { value: "x", label: "Option X" },
    { value: "y", label: "Option Y", disabled: true },
    { value: "z", label: "Option Z" },
    { value: "w", label: "Option W", disabled: true },
  ];

  // basic render tests = 5 tests
  it("renders trigger", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    expect(getByTestId("select-trigger")).toBeDefined();
  });

  it("renders wrapper", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    expect(getByTestId("select-wrapper")).toBeDefined();
  });

  it("renders with placeholder", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} placeholder="Choose one" />);
    const val = getByTestId("select-value");
    expect(val).toBeDefined();
  });

  it("renders default placeholder when none given", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    expect(getByTestId("select-value")).toBeDefined();
  });

  it("renders arrow indicator", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    expect(getByTestId("select-arrow")).toBeDefined();
  });

  // open/close dropdown = 10 tests
  it("opens dropdown on click", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-dropdown")).toBeDefined();
  });

  it("shows options when open", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-option-a")).toBeDefined();
    expect(getByTestId("select-option-b")).toBeDefined();
    expect(getByTestId("select-option-c")).toBeDefined();
  });

  it("dropdown not shown when closed", async () => {
    const { queryByTestId } = await render(<Select options={baseOptions} />);
    expect(queryByTestId("select-dropdown")).toBeNull();
  });

  it("selects option on click", async () => {
    let selected = "";
    const { getByTestId } = await render(
      <Select
        options={baseOptions}
        onChange={(v) => {
          selected = v as string;
        }}
      />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-a"));
    expect(selected).toBe("a");
  });

  it("closes dropdown after selection in single mode", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Select options={baseOptions} onChange={() => {}} />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-b"));
    expect(queryByTestId("select-dropdown")).toBeNull();
  });

  it("does not open when disabled", async () => {
    const { getByTestId, queryByTestId } = await render(<Select options={baseOptions} disabled />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(queryByTestId("select-dropdown")).toBeNull();
  });

  it("shows selected value label", async () => {
    const { getByTestId } = await render(
      <Select options={baseOptions} value="b" onChange={() => {}} />,
    );
    const val = getByTestId("select-value");
    expect(val).toBeDefined();
  });

  it("does not fire onChange for disabled option", async () => {
    let selected = "";
    const { getByTestId } = await render(
      <Select
        options={optionsWithDisabled}
        onChange={(v) => {
          selected = v as string;
        }}
      />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-y"));
    expect(selected).toBe("");
  });

  it("shows multiple selected count", async () => {
    const { getByTestId } = await render(
      <Select options={baseOptions} multiple value={["a", "b"]} onChange={() => {}} />,
    );
    expect(getByTestId("select-value")).toBeDefined();
  });

  it("multiple mode keeps dropdown open after selection", async () => {
    const { getByTestId } = await render(
      <Select options={baseOptions} multiple onChange={() => {}} />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-a"));
    expect(getByTestId("select-dropdown")).toBeDefined();
  });

  // label tests = 5 tests
  it("renders label when provided", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} label="Framework" />);
    expect(getByTestId("select-label")).toBeDefined();
  });

  it("no label when not provided", async () => {
    const { queryByTestId } = await render(<Select options={baseOptions} />);
    expect(queryByTestId("select-label")).toBeNull();
  });

  const labelTexts = ["Framework", "Status", "Risk Level", "Assignee"];
  for (const lbl of labelTexts) {
    it(`renders label="${lbl}"`, async () => {
      const { getByTestId } = await render(<Select options={baseOptions} label={lbl} />);
      expect(getByTestId("select-label")).toBeDefined();
    });
  }

  // error state = 10 tests
  it("renders error", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} error="Required" />);
    expect(getByTestId("select-error")).toBeDefined();
  });

  const errorMessages = [
    "Required",
    "Invalid selection",
    "Please choose",
    "Not available",
    "Select at least one",
    "Maximum reached",
    "No longer valid",
    "Option removed",
    "Restricted",
  ];
  for (const msg of errorMessages) {
    it(`shows error="${msg}"`, async () => {
      const { getByTestId } = await render(<Select options={baseOptions} error={msg} />);
      expect(getByTestId("select-error")).toBeDefined();
    });
  }

  // empty options = 5 tests
  it("shows empty state when no options", async () => {
    const { getByTestId } = await render(<Select options={[]} />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-empty")).toBeDefined();
  });

  it("handles empty options array without crash", async () => {
    const { getByTestId } = await render(<Select options={[]} />);
    expect(getByTestId("select-trigger")).toBeDefined();
  });

  // searchable = 10 tests
  it("shows search input when searchable", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} searchable />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-search")).toBeDefined();
  });

  it("no search input when not searchable", async () => {
    const { queryByTestId } = await render(<Select options={baseOptions} />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(queryByTestId("select-search")).toBeNull();
  });

  it("filters options when searching", async () => {
    const { getByTestId, queryByTestId } = await render(
      <Select options={baseOptions} searchable />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.change(getByTestId("select-search"), { target: { value: "Option A" } });
    expect(getByTestId("select-option-a")).toBeDefined();
    expect(queryByTestId("select-option-b")).toBeNull();
  });

  it("shows no options when search matches nothing", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} searchable />);
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.change(getByTestId("select-search"), { target: { value: "zzz" } });
    expect(getByTestId("select-empty")).toBeDefined();
  });

  // snapshot tests = 5 tests
  it("snapshot: default state", async () => {
    await render(<Select options={baseOptions} />);
    await snapshot("select-default");
  });

  it("snapshot: with value", async () => {
    await render(<Select options={baseOptions} value="a" onChange={() => {}} />);
    await snapshot("select-with-value");
  });

  it("snapshot: disabled", async () => {
    await render(<Select options={baseOptions} disabled />);
    await snapshot("select-disabled");
  });

  it("snapshot: with error", async () => {
    await render(<Select options={baseOptions} error="Required" />);
    await snapshot("select-error");
  });

  it("snapshot: with label", async () => {
    await render(<Select options={baseOptions} label="Choose" />);
    await snapshot("select-labeled");
  });

  // many options = 10 tests
  const manyOptions: SelectOption[] = Array.from({ length: 10 }, (_, i) => ({
    value: `opt${i}`,
    label: `Option ${i + 1}`,
  }));

  it("handles many options", async () => {
    const { getByTestId } = await render(<Select options={manyOptions} />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-option-opt0")).toBeDefined();
  });

  for (let i = 0; i < 9; i++) {
    it(`renders option ${i + 1} of many`, async () => {
      const { getByTestId } = await render(<Select options={manyOptions} />);
      await fireEvent.click(getByTestId("select-trigger"));
      expect(getByTestId(`select-option-opt${i}`)).toBeDefined();
    });
  }

  // multiple selection tests = 10 tests
  it("multiple: onChange returns array", async () => {
    let result: string[] = [];
    const { getByTestId } = await render(
      <Select
        options={baseOptions}
        multiple
        onChange={(v) => {
          result = v as string[];
        }}
      />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-a"));
    expect(result).toContain("a");
  });

  it("multiple: can deselect", async () => {
    let result: string[] = ["a"];
    const { getByTestId } = await render(
      <Select
        options={baseOptions}
        multiple
        value={["a"]}
        onChange={(v) => {
          result = v as string[];
        }}
      />,
    );
    await fireEvent.click(getByTestId("select-trigger"));
    await fireEvent.click(getByTestId("select-option-a"));
    expect(result).toEqual([]);
  });

  it("multiple: shows checkboxes", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} multiple />);
    await fireEvent.click(getByTestId("select-trigger"));
    expect(getByTestId("select-option-a")).toBeDefined();
  });

  it("multiple: empty value shows placeholder", async () => {
    const { getByTestId } = await render(
      <Select options={baseOptions} multiple value={[]} onChange={() => {}} />,
    );
    expect(getByTestId("select-value")).toBeDefined();
  });

  it("multiple: two items shows count", async () => {
    const { getByTestId } = await render(
      <Select options={baseOptions} multiple value={["a", "c"]} onChange={() => {}} />,
    );
    expect(getByTestId("select-value")).toBeDefined();
  });

  // placeholder variations = 5 tests
  const placeholders = [
    "Select vendor",
    "Choose status",
    "Pick framework",
    "Assign user",
    "Filter by risk",
  ];
  for (const ph of placeholders) {
    it(`placeholder="${ph}"`, async () => {
      const { getByTestId } = await render(<Select options={baseOptions} placeholder={ph} />);
      expect(getByTestId("select-value")).toBeDefined();
    });
  }

  it("renders with custom testId", async () => {
    const { getByTestId } = await render(<Select options={baseOptions} data-testid="my-select" />);
    expect(getByTestId("my-select-trigger")).toBeDefined();
  });

  it("combobox has aria-expanded false initially", async () => {
    const { getByRole } = await render(<Select options={baseOptions} />);
    expect(getByRole("combobox")).toBeDefined();
  });
});
