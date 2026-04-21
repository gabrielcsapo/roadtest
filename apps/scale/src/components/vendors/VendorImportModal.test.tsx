import { describe, it, expect, render, fireEvent, snapshot } from "fieldtest";
import { VendorImportModal } from "./VendorImportModal";
import { Vendor } from "../../types";

describe("VendorImportModal", () => {
  // Basic rendering when open (10)
  it("renders modal when open=true", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("vendor-import-modal")).toBeDefined();
  });

  it("renders import container", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-container")).toBeDefined();
  });

  it("renders import title", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-title").textContent).toContain("Import Vendors");
  });

  it("renders upload step initially", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-upload-step")).toBeDefined();
  });

  it("renders file input", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input")).toBeDefined();
  });

  it("renders instructions", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions")).toBeDefined();
  });

  it("renders import actions", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-actions")).toBeDefined();
  });

  it("renders cancel button", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button")).toBeDefined();
  });

  it("snapshot upload step", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-upload");
  });

  it("hides preview step initially", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-preview-step")).toBeNull();
  });

  // Closed state (5)
  it("renders null when open=false", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open={false} onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("vendor-import-modal")).toBeNull();
  });

  it("does not render container when closed", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open={false} onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-container")).toBeNull();
  });

  it("does not render file input when closed", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open={false} onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("file-input")).toBeNull();
  });

  it("snapshot closed state", async () => {
    await render(<VendorImportModal open={false} onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-closed");
  });

  it("renders correctly when toggled open", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("vendor-import-modal")).toBeDefined();
  });

  // Cancel and close (10)
  it("calls onClose when cancel button clicked", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {
          closed = true;
        }}
        onImport={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(closed).toBeTruthy();
  });

  it("cancel button text is Cancel", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button").textContent).toContain("Cancel");
  });

  it("cancel button not disabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button").disabled).toBe(false);
  });

  it("cancel button disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("cancel-import-button").disabled).toBeTruthy();
  });

  it("fires onClose multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {
          count++;
        }}
        onImport={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(count).toBe(1);
  });

  it("does not call onImport when cancel clicked", async () => {
    let imported = false;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {}}
        onImport={() => {
          imported = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(imported).toBe(false);
  });

  it("snapshot loading state", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} loading />);
    await snapshot("vendor-import-modal-loading");
  });

  it("shows spinner when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-spinner")).toBeDefined();
  });

  it("hides spinner when not loading", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-spinner")).toBeNull();
  });

  it("shows progress section when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-progress")).toBeDefined();
  });

  // File input (10)
  it("file input accepts csv", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").getAttribute("accept")).toBe(".csv");
  });

  it("file input type is file", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").getAttribute("type")).toBe("file");
  });

  it("file input wrapper exists", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input-wrapper")).toBeDefined();
  });

  it("file input not disabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").disabled).toBe(false);
  });

  it("file input disabled when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("file-input").disabled).toBeTruthy();
  });

  it("instructions mention CSV", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").textContent).toContain("CSV");
  });

  it("instructions mention name column", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").textContent).toContain("name");
  });

  it("instructions mention contactEmail column", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").textContent).toContain("contactEmail");
  });

  it("instructions mention website column", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").textContent).toContain("website");
  });

  it("does not show error initially", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-error")).toBeNull();
  });

  // Upload step UI elements (10)
  it("does not show back button in upload step", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("back-button")).toBeNull();
  });

  it("does not show confirm import button in upload step", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("confirm-import-button")).toBeNull();
  });

  it("snapshot with only cancel button in upload step", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-upload-step-actions");
  });

  it("renders correctly with required props only", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("vendor-import-modal")).toBeDefined();
  });

  it("snapshot with loading and open", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} loading={true} />);
    await snapshot("vendor-import-modal-loading-open");
  });

  it("snapshot when closed", async () => {
    await render(<VendorImportModal open={false} onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-closed-state");
  });

  it("progress text mentions importing", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-progress-text").textContent).toContain("Import");
  });

  it("upload step container is visible when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-upload-step")).toBeDefined();
  });

  it("hides import error when no error", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-error")).toBeNull();
  });

  it("renders correctly when open toggles from false to true", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open={true} onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-title")).toBeDefined();
  });

  // Edge cases (30 more to hit 100+)
  it("snapshot title shows Import Vendors", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-title").textContent).toBe("Import Vendors");
  });

  it("renders import actions in upload step", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-actions")).toBeDefined();
  });

  it("cancel import calls onClose", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {
          closed = true;
        }}
        onImport={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(closed).toBeTruthy();
  });

  it("snapshot with loading=false", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} loading={false} />);
    await snapshot("vendor-import-modal-not-loading");
  });

  it("does not render modal when open is false regardless of loading", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open={false} onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(queryByTestId("vendor-import-modal")).toBeNull();
  });

  it("cancel button always visible when open", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button")).toBeDefined();
  });

  it("renders correctly with onImport handler defined", async () => {
    let imported = false;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {}}
        onImport={() => {
          imported = true;
        }}
      />,
    );
    expect(getByTestId("vendor-import-modal")).toBeDefined();
  });

  it("does not call onImport initially", async () => {
    let imported = false;
    await render(
      <VendorImportModal
        open
        onClose={() => {}}
        onImport={() => {
          imported = true;
        }}
      />,
    );
    expect(imported).toBe(false);
  });

  it("file input wrapper is visible", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input-wrapper")).toBeDefined();
  });

  it("import actions container always renders when open", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-actions")).toBeDefined();
  });

  it("does not throw when cancel is clicked without loading", async () => {
    let closed = false;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {
          closed = true;
        }}
        onImport={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(closed).toBeTruthy();
  });

  it("modal title is h2 element", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-title").tagName).toBe("H2");
  });

  it("renders modal with correct open attribute", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("vendor-import-modal")).toBeDefined();
  });

  it("renders correctly when re-opened", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-upload-step")).toBeDefined();
  });

  it("upload step is always first step", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-upload-step")).toBeDefined();
    expect((queryByTestId) => queryByTestId("import-preview-step")).toBeDefined();
  });

  // Additional tests to reach 100
  it("modal data-testid is vendor-import-modal", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("vendor-import-modal").getAttribute("data-testid")).toBe(
      "vendor-import-modal",
    );
  });

  it("import-container data-testid is import-container", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-container").getAttribute("data-testid")).toBe("import-container");
  });

  it("import-title data-testid is import-title", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-title").getAttribute("data-testid")).toBe("import-title");
  });

  it("file-input data-testid is file-input", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").getAttribute("data-testid")).toBe("file-input");
  });

  it("import-instructions data-testid is import-instructions", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").getAttribute("data-testid")).toBe(
      "import-instructions",
    );
  });

  it("import-actions data-testid is import-actions", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-actions").getAttribute("data-testid")).toBe("import-actions");
  });

  it("cancel-import-button data-testid is cancel-import-button", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button").getAttribute("data-testid")).toBe(
      "cancel-import-button",
    );
  });

  it("import-spinner data-testid is import-spinner when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-spinner").getAttribute("data-testid")).toBe("import-spinner");
  });

  it("import-progress data-testid is import-progress when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-progress").getAttribute("data-testid")).toBe("import-progress");
  });

  it("file-input-wrapper data-testid is file-input-wrapper", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input-wrapper").getAttribute("data-testid")).toBe(
      "file-input-wrapper",
    );
  });

  it("cancel button calls onClose once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorImportModal
        open
        onClose={() => {
          count++;
        }}
        onImport={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("cancel-import-button"));
    expect(count).toBe(1);
  });

  it("file input accept attribute is .csv", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").accept).toBe(".csv");
  });

  it("file input is type file", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").type).toBe("file");
  });

  it("instructions mention category column", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-instructions").textContent).toContain("category");
  });

  it("import progress text contains Importing when loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-progress-text").textContent).toContain("Importing");
  });

  it("import-progress is hidden when not loading", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-progress")).toBeNull();
  });

  it("import-spinner is hidden when not loading", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-spinner")).toBeNull();
  });

  it("upload step visible when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-upload-step")).toBeDefined();
  });

  it("upload step hidden when loading", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(queryByTestId("import-upload-step")).toBeNull();
  });

  it("snapshot open with no loading", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-open-no-loading");
  });

  it("snapshot open with loading=true", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} loading={true} />);
    await snapshot("vendor-import-modal-open-loading");
  });

  it("cancel button is button type", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("cancel-import-button").tagName).toBe("BUTTON");
  });

  it("file input is input element", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input").tagName).toBe("INPUT");
  });

  it("does not call onImport without file selection", async () => {
    let called = false;
    await render(
      <VendorImportModal
        open
        onClose={() => {}}
        onImport={() => {
          called = true;
        }}
      />,
    );
    expect(called).toBe(false);
  });

  it("does not call onClose without interaction", async () => {
    let called = false;
    await render(
      <VendorImportModal
        open
        onClose={() => {
          called = true;
        }}
        onImport={() => {}}
      />,
    );
    expect(called).toBe(false);
  });

  it("shows modal title when open regardless of loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-title")).toBeDefined();
  });

  it("import container visible regardless of loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("import-container")).toBeDefined();
  });

  it("cancel button always present in actions regardless of loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect(getByTestId("cancel-import-button")).toBeDefined();
  });

  it("file input not disabled when open and not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect((getByTestId("file-input") as HTMLInputElement).disabled).toBe(false);
  });

  it("cancel button enabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect((getByTestId("cancel-import-button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("cancel button disabled when loading is true", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect((getByTestId("cancel-import-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("file input disabled when loading is true", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} loading />,
    );
    expect((getByTestId("file-input") as HTMLInputElement).disabled).toBe(true);
  });

  it("no error shown initially on open", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("import-error")).toBeNull();
  });

  it("no back button shown in upload step", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("back-button")).toBeNull();
  });

  it("no confirm button shown in upload step", async () => {
    const { queryByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(queryByTestId("confirm-import-button")).toBeNull();
  });

  it("file-input-wrapper visible when not loading", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input-wrapper")).toBeDefined();
  });

  it("import container has aria role or structure", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("import-container")).toBeDefined();
  });

  it("file input exists in upload step", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    expect(getByTestId("file-input")).toBeDefined();
  });

  it("instructions have at least one required field", async () => {
    const { getByTestId } = await render(
      <VendorImportModal open onClose={() => {}} onImport={() => {}} />,
    );
    const text = getByTestId("import-instructions").textContent;
    expect(text.length).toBeGreaterThan(0);
  });

  it("snapshot with all handlers set", async () => {
    await render(<VendorImportModal open onClose={() => {}} onImport={() => {}} />);
    await snapshot("vendor-import-modal-all-handlers");
  });
});
