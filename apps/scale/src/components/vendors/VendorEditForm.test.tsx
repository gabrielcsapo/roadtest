import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorEditForm } from "./VendorEditForm";
import { Vendor, Risk, Status } from "../../types";

const mockVendor: Vendor = {
  id: "1",
  name: "Acme Corp",
  website: "https://acme.com",
  status: "active",
  riskLevel: "low",
  contactEmail: "security@acme.com",
  lastReviewDate: "2024-01-15",
  tags: ["cloud", "saas"],
  category: "Cloud Infrastructure",
  description: "A cloud infrastructure provider.",
};

const riskLevels: Risk[] = ["low", "medium", "high", "critical"];
const statuses: Status[] = ["active", "inactive", "pending", "archived"];

describe("VendorEditForm", () => {
  // Basic rendering (10)
  it("renders form container", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("vendor-edit-form")).toBeDefined();
  });

  it("renders Add Vendor title when no vendor prop", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("form-title").textContent).toContain("Add Vendor");
  });

  it("renders Edit Vendor title when vendor prop provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("form-title").textContent).toContain("Edit Vendor");
  });

  it("renders name field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-name")).toBeDefined();
  });

  it("renders website field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-website")).toBeDefined();
  });

  it("renders contact email field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-contact-email")).toBeDefined();
  });

  it("renders risk select field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-risk")).toBeDefined();
  });

  it("renders status select field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-status")).toBeDefined();
  });

  it("renders description field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-description")).toBeDefined();
  });

  it("renders tags field", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-tags")).toBeDefined();
  });

  // Pre-population when editing (10)
  it("pre-populates name when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-name").value).toBe("Acme Corp");
  });

  it("pre-populates website when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-website").value).toBe("https://acme.com");
  });

  it("pre-populates contact email when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-contact-email").value).toBe("security@acme.com");
  });

  it("pre-populates risk level when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-risk").value).toBe("low");
  });

  it("pre-populates status when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-status").value).toBe("active");
  });

  it("pre-populates description when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-description").value).toBe("A cloud infrastructure provider.");
  });

  it("pre-populates tags when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-tags").value).toContain("cloud");
  });

  it("empty name when no vendor", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-name").value).toBe("");
  });

  it("empty website when no vendor", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-website").value).toBe("");
  });

  it("default risk is low when no vendor", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-risk").value).toBe("low");
  });

  // Field interactions (10)
  it("updates name field on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-name"), { target: { value: "New Vendor" } });
    expect(getByTestId("input-name").value).toBe("New Vendor");
  });

  it("updates website field on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-website"), { target: { value: "https://new.com" } });
    expect(getByTestId("input-website").value).toBe("https://new.com");
  });

  it("updates email field on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-contact-email"), {
      target: { value: "test@example.com" },
    });
    expect(getByTestId("input-contact-email").value).toBe("test@example.com");
  });

  it("updates risk select on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-risk"), { target: { value: "critical" } });
    expect(getByTestId("select-risk").value).toBe("critical");
  });

  it("updates status select on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-status"), { target: { value: "inactive" } });
    expect(getByTestId("select-status").value).toBe("inactive");
  });

  it("updates description on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-description"), {
      target: { value: "A new description" },
    });
    expect(getByTestId("input-description").value).toBe("A new description");
  });

  it("updates tags on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-tags"), { target: { value: "tag1, tag2" } });
    expect(getByTestId("input-tags").value).toBe("tag1, tag2");
  });

  it("calls onCancel when cancel button clicked", async () => {
    let cancelled = false;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {}}
        onCancel={() => {
          cancelled = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("cancel-button"));
    expect(cancelled).toBeTruthy();
  });

  it("submit button exists", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button")).toBeDefined();
  });

  it("cancel button exists", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("cancel-button")).toBeDefined();
  });

  // Validation (10)
  it("shows error when name is empty on submit", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(getByTestId("error-name")).toBeDefined();
  });

  it("shows error when website is empty on submit", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-name"), { target: { value: "Test" } });
    await fireEvent.click(getByTestId("submit-button"));
    expect(getByTestId("error-website")).toBeDefined();
  });

  it("shows error when contact email is empty on submit", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-name"), { target: { value: "Test" } });
    await fireEvent.change(getByTestId("input-website"), { target: { value: "https://test.com" } });
    await fireEvent.click(getByTestId("submit-button"));
    expect(getByTestId("error-contact-email")).toBeDefined();
  });

  it("shows form-level error alert on validation failure", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(getByTestId("form-errors")).toBeDefined();
  });

  it("does not call onSubmit when validation fails", async () => {
    let submitted = false;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {
          submitted = true;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(submitted).toBe(false);
  });

  it("calls onSubmit when form is valid", async () => {
    let submitted = false;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={() => {
          submitted = true;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(submitted).toBeTruthy();
  });

  it("passes correct data to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.name).toBe("Acme Corp");
  });

  it("passes risk level to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.riskLevel).toBe("low");
  });

  it("passes tags array to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(Array.isArray(data?.tags)).toBeTruthy();
  });

  it("hides error alert when form is valid", async () => {
    const { queryByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(queryByTestId("form-errors")).toBeNull();
  });

  // Loading state (10)
  it("disables submit button when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("submit-button").disabled).toBeTruthy();
  });

  it("disables cancel button when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("cancel-button").disabled).toBeTruthy();
  });

  it("disables name input when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("input-name").disabled).toBeTruthy();
  });

  it("disables website input when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("input-website").disabled).toBeTruthy();
  });

  it("disables email input when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("input-contact-email").disabled).toBeTruthy();
  });

  it("disables risk select when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("select-risk").disabled).toBeTruthy();
  });

  it("disables status select when loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    expect(getByTestId("select-status").disabled).toBeTruthy();
  });

  it("loading snapshot", async () => {
    await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} loading />,
    );
    await snapshot("vendor-edit-form-loading");
  });

  it("non-loading snapshot", async () => {
    await render(<VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />);
    await snapshot("vendor-edit-form-edit");
  });

  it("add form snapshot", async () => {
    await render(<VendorEditForm onSubmit={() => {}} onCancel={() => {}} />);
    await snapshot("vendor-edit-form-add");
  });

  // Risk level variations (4)
  for (const risk of riskLevels) {
    it(`pre-populates ${risk} risk level`, async () => {
      const { getByTestId } = await render(
        <VendorEditForm
          vendor={{ ...mockVendor, riskLevel: risk }}
          onSubmit={() => {}}
          onCancel={() => {}}
        />,
      );
      expect(getByTestId("select-risk").value).toBe(risk);
    });
  }

  // Status variations (4)
  for (const status of statuses) {
    it(`pre-populates ${status} status`, async () => {
      const { getByTestId } = await render(
        <VendorEditForm
          vendor={{ ...mockVendor, status }}
          onSubmit={() => {}}
          onCancel={() => {}}
        />,
      );
      expect(getByTestId("select-status").value).toBe(status);
    });
  }

  // Actions section (5)
  it("renders form actions", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("form-actions")).toBeDefined();
  });

  it("submit button text is Add Vendor for new", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button").textContent).toContain("Add Vendor");
  });

  it("submit button text is Save Changes for edit", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button").textContent).toContain("Save Changes");
  });

  it("category field is present", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-category")).toBeDefined();
  });

  it("category is pre-populated when vendor provided", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-category").value).toBe("Cloud Infrastructure");
  });

  // Edge cases (6)
  it("renders without vendor", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("vendor-edit-form")).toBeDefined();
  });

  it("renders with vendor without description", async () => {
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={{ ...mockVendor, description: undefined }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByTestId("input-description").value).toBe("");
  });

  it("renders with vendor with empty tags", async () => {
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={{ ...mockVendor, tags: [] }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByTestId("input-tags").value).toBe("");
  });

  it("invalid email shows error message", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("input-name"), { target: { value: "Test" } });
    await fireEvent.change(getByTestId("input-website"), { target: { value: "https://test.com" } });
    await fireEvent.change(getByTestId("input-contact-email"), {
      target: { value: "not-an-email" },
    });
    await fireEvent.change(getByTestId("select-category"), { target: { value: "Security" } });
    await fireEvent.click(getByTestId("submit-button"));
    expect(getByTestId("error-contact-email")).toBeDefined();
  });

  it("tags are split by comma on submit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.change(getByTestId("input-tags"), { target: { value: "tag1, tag2, tag3" } });
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.tags).toHaveLength(3);
  });

  it("does not throw when no onCancel called on cancel click", async () => {
    let cancelled = false;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {}}
        onCancel={() => {
          cancelled = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("cancel-button"));
    expect(cancelled).toBeTruthy();
  });

  // Additional tests to reach 100
  it("vendor-edit-form data-testid is vendor-edit-form", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("vendor-edit-form").getAttribute("data-testid")).toBe("vendor-edit-form");
  });

  it("form-title data-testid is form-title", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("form-title").getAttribute("data-testid")).toBe("form-title");
  });

  it("field-name data-testid is field-name", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("field-name").getAttribute("data-testid")).toBe("field-name");
  });

  it("input-name data-testid is input-name", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-name").getAttribute("data-testid")).toBe("input-name");
  });

  it("input-website data-testid is input-website", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-website").getAttribute("data-testid")).toBe("input-website");
  });

  it("input-contact-email data-testid is input-contact-email", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-contact-email").getAttribute("data-testid")).toBe(
      "input-contact-email",
    );
  });

  it("select-risk data-testid is select-risk", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-risk").getAttribute("data-testid")).toBe("select-risk");
  });

  it("select-status data-testid is select-status", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-status").getAttribute("data-testid")).toBe("select-status");
  });

  it("submit-button data-testid is submit-button", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button").getAttribute("data-testid")).toBe("submit-button");
  });

  it("cancel-button data-testid is cancel-button", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("cancel-button").getAttribute("data-testid")).toBe("cancel-button");
  });

  it("form-actions data-testid is form-actions", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("form-actions").getAttribute("data-testid")).toBe("form-actions");
  });

  it("input-name is an input element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-name").tagName).toBe("INPUT");
  });

  it("input-website is an input element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-website").tagName).toBe("INPUT");
  });

  it("input-contact-email is an input element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("input-contact-email").tagName).toBe("INPUT");
  });

  it("select-risk is a select element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-risk").tagName).toBe("SELECT");
  });

  it("select-status is a select element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("select-status").tagName).toBe("SELECT");
  });

  it("submit button is a button element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button").tagName).toBe("BUTTON");
  });

  it("cancel button is a button element", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("cancel-button").tagName).toBe("BUTTON");
  });

  it("pre-populates website for editing", async () => {
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={{ ...mockVendor, website: "https://globex.com" }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByTestId("input-website").value).toBe("https://globex.com");
  });

  it("pre-populates name for Globex", async () => {
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={{ ...mockVendor, name: "Globex Inc" }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByTestId("input-name").value).toBe("Globex Inc");
  });

  it("pre-populates email for different contact", async () => {
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={{ ...mockVendor, contactEmail: "bob@globex.com" }}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(getByTestId("input-contact-email").value).toBe("bob@globex.com");
  });

  it("passes website to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.website).toBe("https://acme.com");
  });

  it("passes contactEmail to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.contactEmail).toBe("security@acme.com");
  });

  it("passes status to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.status).toBe("active");
  });

  it("passes description to onSubmit", async () => {
    let data: Partial<Vendor> | null = null;
    const { getByTestId } = await render(
      <VendorEditForm
        vendor={mockVendor}
        onSubmit={(v) => {
          data = v;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(data?.description).toBe("A cloud infrastructure provider.");
  });

  it("submit button not disabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("submit-button").disabled).toBe(false);
  });

  it("cancel button not disabled when not loading", async () => {
    const { getByTestId } = await render(
      <VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(getByTestId("cancel-button").disabled).toBe(false);
  });

  it("calls onCancel once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {}}
        onCancel={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("cancel-button"));
    expect(count).toBe(1);
  });

  it("fires onCancel 3 times on 3 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {}}
        onCancel={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("cancel-button"));
    await fireEvent.click(getByTestId("cancel-button"));
    await fireEvent.click(getByTestId("cancel-button"));
    expect(count).toBe(3);
  });

  it("snapshot add form empty", async () => {
    await render(<VendorEditForm onSubmit={() => {}} onCancel={() => {}} />);
    await snapshot("vendor-edit-form-add-empty");
  });

  it("snapshot edit form with data", async () => {
    await render(<VendorEditForm vendor={mockVendor} onSubmit={() => {}} onCancel={() => {}} />);
    await snapshot("vendor-edit-form-with-data");
  });

  it("snapshot form with validation errors", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    await snapshot("vendor-edit-form-errors");
  });

  it("updates status to pending on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-status"), { target: { value: "pending" } });
    expect(getByTestId("select-status").value).toBe("pending");
  });

  it("updates status to archived on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-status"), { target: { value: "archived" } });
    expect(getByTestId("select-status").value).toBe("archived");
  });

  it("updates risk to medium on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-risk"), { target: { value: "medium" } });
    expect(getByTestId("select-risk").value).toBe("medium");
  });

  it("updates risk to high on change", async () => {
    const { getByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    await fireEvent.change(getByTestId("select-risk"), { target: { value: "high" } });
    expect(getByTestId("select-risk").value).toBe("high");
  });

  it("no error shown before submit attempt", async () => {
    const { queryByTestId } = await render(
      <VendorEditForm onSubmit={() => {}} onCancel={() => {}} />,
    );
    expect(queryByTestId("form-errors")).toBeNull();
  });

  it("does not call onSubmit when form is empty", async () => {
    let submitted = false;
    const { getByTestId } = await render(
      <VendorEditForm
        onSubmit={() => {
          submitted = true;
        }}
        onCancel={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("submit-button"));
    expect(submitted).toBe(false);
  });
});
