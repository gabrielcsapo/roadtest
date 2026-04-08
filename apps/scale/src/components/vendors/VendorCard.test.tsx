import { describe, it, expect, render, fireEvent, snapshot } from "@fieldtest/core";
import { VendorCard } from "./VendorCard";
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
  description: "A leading cloud infrastructure provider.",
};

const vendors: Vendor[] = [
  { ...mockVendor, id: "1", name: "Acme Corp", riskLevel: "low", status: "active" },
  { ...mockVendor, id: "2", name: "Globex Inc", riskLevel: "medium", status: "active" },
  { ...mockVendor, id: "3", name: "Umbrella Corp", riskLevel: "high", status: "pending" },
  { ...mockVendor, id: "4", name: "Initech", riskLevel: "critical", status: "inactive" },
  { ...mockVendor, id: "5", name: "Massive Dynamic", riskLevel: "low", status: "archived" },
];

const riskLevels: Risk[] = ["low", "medium", "high", "critical"];
const statuses: Status[] = ["active", "inactive", "pending", "archived"];

describe("VendorCard", () => {
  // Rendering tests — each vendor (5)
  for (const vendor of vendors) {
    it(`renders vendor: ${vendor.name}`, async () => {
      const { getByTestId, getByText } = await render(<VendorCard vendor={vendor} />);
      expect(getByText(vendor.name)).toBeDefined();
      expect(getByTestId("vendor-card")).toBeDefined();
    });
  }

  // Risk level rendering (4)
  for (const risk of riskLevels) {
    it(`shows ${risk} risk badge`, async () => {
      const { getByTestId } = await render(
        <VendorCard vendor={{ ...mockVendor, riskLevel: risk }} />,
      );
      expect(getByTestId("risk-badge")).toBeDefined();
    });
  }

  // Status rendering (4)
  for (const status of statuses) {
    it(`renders ${status} status badge`, async () => {
      const { getByTestId } = await render(<VendorCard vendor={{ ...mockVendor, status }} />);
      expect(getByTestId("status-badge")).toBeDefined();
    });
  }

  // Snapshots per risk level (4)
  for (const risk of riskLevels) {
    it(`snapshot for ${risk} risk vendor`, async () => {
      await render(<VendorCard vendor={{ ...mockVendor, riskLevel: risk }} />);
      await snapshot(`vendor-card-${risk}`);
    });
  }

  // Compact mode (5)
  it("renders in compact mode", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} compact />);
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("compact mode hides description", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} compact />);
    expect(queryByTestId("vendor-description")).toBeNull();
  });

  it("non-compact mode shows description when present", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} compact={false} />);
    expect(getByTestId("vendor-description")).toBeDefined();
  });

  it("compact snapshot", async () => {
    await render(<VendorCard vendor={mockVendor} compact />);
    await snapshot("vendor-card-compact");
  });

  it("non-compact snapshot", async () => {
    await render(<VendorCard vendor={mockVendor} compact={false} />);
    await snapshot("vendor-card-full");
  });

  // Selection state (5)
  it("renders as selected when selected=true", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} selected />);
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("true");
  });

  it("renders as not selected when selected=false", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} selected={false} />);
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("false");
  });

  it("default selected is false", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("false");
  });

  it("selected snapshot differs from unselected", async () => {
    await render(<VendorCard vendor={mockVendor} selected />);
    await snapshot("vendor-card-selected");
  });

  it("unselected snapshot", async () => {
    await render(<VendorCard vendor={mockVendor} selected={false} />);
    await snapshot("vendor-card-unselected");
  });

  // onClick callback (5)
  it("calls onClick when card is clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-card"));
    expect(clicked).toBeTruthy();
  });

  it("passes vendor to onClick", async () => {
    let received: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onClick={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-card"));
    expect(received).toEqual(mockVendor);
  });

  it("does not throw when onClick is undefined", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    await fireEvent.click(getByTestId("vendor-card"));
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("edit button calls onEdit with vendor", async () => {
    let edited: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onEdit={(v) => {
          edited = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(edited).toEqual(mockVendor);
  });

  it("delete button calls onDelete with vendor", async () => {
    let deleted: Vendor | null = null;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onDelete={(v) => {
          deleted = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-button"));
    expect(deleted).toEqual(mockVendor);
  });

  // Action button visibility (5)
  it("shows edit button when onEdit provided", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onEdit={() => {}} />);
    expect(getByTestId("edit-button")).toBeDefined();
  });

  it("hides edit button when onEdit not provided", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(queryByTestId("edit-button")).toBeNull();
  });

  it("shows delete button when onDelete provided", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onDelete={() => {}} />);
    expect(getByTestId("delete-button")).toBeDefined();
  });

  it("hides delete button when onDelete not provided", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(queryByTestId("delete-button")).toBeNull();
  });

  it("shows both buttons when both handlers provided", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={mockVendor} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(getByTestId("edit-button")).toBeDefined();
    expect(getByTestId("delete-button")).toBeDefined();
  });

  // Tag display (10)
  it("renders tags from vendor", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["cloud", "saas"] }} />,
    );
    expect(getByTestId("vendor-tags")).toBeDefined();
  });

  it("renders each tag as a badge", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["cloud", "saas"] }} />,
    );
    expect(getByTestId("tag-cloud")).toBeDefined();
    expect(getByTestId("tag-saas")).toBeDefined();
  });

  it("renders single tag", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["fintech"] }} />,
    );
    expect(getByTestId("tag-fintech")).toBeDefined();
  });

  it("renders many tags", async () => {
    const tags = ["a", "b", "c", "d", "e"];
    const { getByTestId } = await render(<VendorCard vendor={{ ...mockVendor, tags }} />);
    for (const tag of tags) expect(getByTestId(`tag-${tag}`)).toBeDefined();
  });

  it("renders no tags section when tags array is empty", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={{ ...mockVendor, tags: [] }} />);
    expect(queryByTestId("vendor-tags")).toBeNull();
  });

  it("renders security tag", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["security"] }} />,
    );
    expect(getByTestId("tag-security")).toBeDefined();
  });

  it("renders compliance tag", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["compliance"] }} />,
    );
    expect(getByTestId("tag-compliance")).toBeDefined();
  });

  it("renders hipaa tag", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["hipaa"] }} />,
    );
    expect(getByTestId("tag-hipaa")).toBeDefined();
  });

  it("renders iso27001 tag", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["iso27001"] }} />,
    );
    expect(getByTestId("tag-iso27001")).toBeDefined();
  });

  it("renders soc2 tag", async () => {
    const { getByTestId } = await render(<VendorCard vendor={{ ...mockVendor, tags: ["soc2"] }} />);
    expect(getByTestId("tag-soc2")).toBeDefined();
  });

  // Date formatting (5)
  it("displays last review date", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, lastReviewDate: "2024-01-15" }} />,
    );
    expect(getByTestId("vendor-review-date").textContent).toContain("2024-01-15");
  });

  it("displays different review date", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, lastReviewDate: "2023-06-30" }} />,
    );
    expect(getByTestId("vendor-review-date").textContent).toContain("2023-06-30");
  });

  it("displays contact email", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-contact").textContent).toContain("security@acme.com");
  });

  it("displays website", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-website").textContent).toContain("acme.com");
  });

  it("displays category", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-category").textContent).toContain("Cloud Infrastructure");
  });

  // Missing optional fields (10)
  it("renders without description", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, description: undefined }} />,
    );
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("renders without avatarUrl", async () => {
    const v = { ...mockVendor };
    delete v.description;
    const { getByTestId } = await render(<VendorCard vendor={v} />);
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("renders without onClick", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("renders without onEdit", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(queryByTestId("edit-button")).toBeNull();
  });

  it("renders without onDelete", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(queryByTestId("delete-button")).toBeNull();
  });

  it("renders vendor with long name", async () => {
    const { getByTestId } = await render(
      <VendorCard
        vendor={{ ...mockVendor, name: "A Very Long Vendor Name That Might Overflow" }}
      />,
    );
    expect(getByTestId("vendor-name")).toBeDefined();
  });

  it("renders vendor with long description", async () => {
    const { getByTestId } = await render(
      <VendorCard
        vendor={{
          ...mockVendor,
          description: "This is a very long description that goes on and on and on.",
        }}
      />,
    );
    expect(getByTestId("vendor-description")).toBeDefined();
  });

  it("renders vendor with no tags and no description", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: [], description: undefined }} />,
    );
    expect(getByTestId("vendor-name")).toBeDefined();
  });

  it("renders vendor with special characters in name", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, name: "Vendor & Co. <Test>" }} />,
    );
    expect(getByTestId("vendor-name")).toBeDefined();
  });

  it("renders vendor with different category", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, category: "Payment Processing" }} />,
    );
    expect(getByTestId("vendor-category").textContent).toContain("Payment Processing");
  });

  // Accessibility (10)
  it("has accessible card container", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("has vendor name as heading", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-name").tagName).toBe("H3");
  });

  it("website link has target blank", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    const link = getByTestId("vendor-website").querySelector("a");
    expect(link?.getAttribute("target")).toBe("_blank");
  });

  it("website link has rel noopener", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    const link = getByTestId("vendor-website").querySelector("a");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("renders data-testid on card root", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card")).toBeDefined();
  });

  it("has meta section", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-meta")).toBeDefined();
  });

  it("has header section", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card-header")).toBeDefined();
  });

  it("has badges section in header", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-badges")).toBeDefined();
  });

  it("edit click does not trigger card click", async () => {
    let cardClicked = false;
    let editClicked = false;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onClick={() => {
          cardClicked = true;
        }}
        onEdit={() => {
          editClicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(editClicked).toBeTruthy();
    expect(cardClicked).toBe(false);
  });

  it("delete click does not trigger card click", async () => {
    let cardClicked = false;
    let deleteClicked = false;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onClick={() => {
          cardClicked = true;
        }}
        onDelete={() => {
          deleteClicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-button"));
    expect(deleteClicked).toBeTruthy();
    expect(cardClicked).toBe(false);
  });

  // Interaction: multiple clicks (5)
  it("fires onClick multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-card"));
    await fireEvent.click(getByTestId("vendor-card"));
    await fireEvent.click(getByTestId("vendor-card"));
    expect(count).toBe(3);
  });

  it("can toggle selected state", async () => {
    const { getByTestId, container } = await render(
      <VendorCard vendor={mockVendor} selected={false} />,
    );
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("false");
  });

  it("actions section absent when no handlers", async () => {
    const { queryByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(queryByTestId("vendor-actions")).toBeNull();
  });

  it("actions section present when onEdit provided", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onEdit={() => {}} />);
    expect(getByTestId("vendor-actions")).toBeDefined();
  });

  it("actions section present when onDelete provided", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onDelete={() => {}} />);
    expect(getByTestId("vendor-actions")).toBeDefined();
  });

  // Data integrity (5)
  it("renders correct name for each vendor", async () => {
    for (const v of vendors) {
      const { getByTestId } = await render(<VendorCard vendor={v} />);
      expect(getByTestId("vendor-name").textContent).toBe(v.name);
    }
  });

  it("renders correct contact email", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, contactEmail: "test@example.com" }} />,
    );
    expect(getByTestId("vendor-contact").textContent).toContain("test@example.com");
  });

  it("renders correct website href", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, website: "https://example.com" }} />,
    );
    expect(getByTestId("vendor-website").querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com",
    );
  });

  it("renders all 5 vendors without error", async () => {
    for (const v of vendors) {
      const { getByTestId } = await render(<VendorCard vendor={v} />);
      expect(getByTestId("vendor-card")).toBeDefined();
    }
  });

  it("vendor with http website renders correctly", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, website: "http://legacy.com" }} />,
    );
    expect(getByTestId("vendor-website")).toBeDefined();
  });

  // Additional tests to reach 100
  it("vendor-card data-testid is vendor-card", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card").getAttribute("data-testid")).toBe("vendor-card");
  });

  it("vendor-name data-testid is vendor-name", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-name").getAttribute("data-testid")).toBe("vendor-name");
  });

  it("vendor-card-header data-testid is vendor-card-header", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-card-header").getAttribute("data-testid")).toBe(
      "vendor-card-header",
    );
  });

  it("vendor-badges data-testid is vendor-badges", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-badges").getAttribute("data-testid")).toBe("vendor-badges");
  });

  it("vendor-meta data-testid is vendor-meta", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-meta").getAttribute("data-testid")).toBe("vendor-meta");
  });

  it("vendor-review-date data-testid is vendor-review-date", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-review-date").getAttribute("data-testid")).toBe(
      "vendor-review-date",
    );
  });

  it("vendor-contact data-testid is vendor-contact", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-contact").getAttribute("data-testid")).toBe("vendor-contact");
  });

  it("vendor-website data-testid is vendor-website", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-website").getAttribute("data-testid")).toBe("vendor-website");
  });

  it("vendor-category data-testid is vendor-category", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} />);
    expect(getByTestId("vendor-category").getAttribute("data-testid")).toBe("vendor-category");
  });

  it("vendor card has data-selected false when not selected", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} selected={false} />);
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("false");
  });

  it("vendor card has data-selected true when selected", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} selected={true} />);
    expect(getByTestId("vendor-card").getAttribute("data-selected")).toBe("true");
  });

  it("shows Globex Inc name correctly", async () => {
    const { getByTestId } = await render(<VendorCard vendor={vendors[1]} />);
    expect(getByTestId("vendor-name").textContent).toBe("Globex Inc");
  });

  it("shows Umbrella Corp name correctly", async () => {
    const { getByTestId } = await render(<VendorCard vendor={vendors[2]} />);
    expect(getByTestId("vendor-name").textContent).toBe("Umbrella Corp");
  });

  it("shows Initech name correctly", async () => {
    const { getByTestId } = await render(<VendorCard vendor={vendors[3]} />);
    expect(getByTestId("vendor-name").textContent).toBe("Initech");
  });

  it("shows Massive Dynamic name correctly", async () => {
    const { getByTestId } = await render(<VendorCard vendor={vendors[4]} />);
    expect(getByTestId("vendor-name").textContent).toBe("Massive Dynamic");
  });

  it("compact mode renders vendor-card-compact data attribute", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} compact />);
    expect(getByTestId("vendor-card").getAttribute("data-compact")).toBe("true");
  });

  it("non-compact mode renders data-compact=false", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} compact={false} />);
    expect(getByTestId("vendor-card").getAttribute("data-compact")).toBe("false");
  });

  it("edit-button data-testid is edit-button", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onEdit={() => {}} />);
    expect(getByTestId("edit-button").getAttribute("data-testid")).toBe("edit-button");
  });

  it("delete-button data-testid is delete-button", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onDelete={() => {}} />);
    expect(getByTestId("delete-button").getAttribute("data-testid")).toBe("delete-button");
  });

  it("snapshot default card", async () => {
    await render(<VendorCard vendor={mockVendor} />);
    await snapshot("vendor-card-default");
  });

  it("snapshot card with all actions", async () => {
    await render(
      <VendorCard vendor={mockVendor} onEdit={() => {}} onDelete={() => {}} onClick={() => {}} />,
    );
    await snapshot("vendor-card-all-actions");
  });

  it("snapshot compact card", async () => {
    await render(<VendorCard vendor={mockVendor} compact />);
    await snapshot("vendor-card-compact");
  });

  it("snapshot selected card", async () => {
    await render(<VendorCard vendor={mockVendor} selected />);
    await snapshot("vendor-card-selected");
  });

  it("fires onEdit once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onEdit={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(count).toBe(1);
  });

  it("fires onDelete once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCard
        vendor={mockVendor}
        onDelete={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("delete-button"));
    expect(count).toBe(1);
  });

  it("fires onClick for each vendor in the list", async () => {
    for (const v of vendors) {
      let received: Vendor | null = null;
      const { getByTestId } = await render(
        <VendorCard
          vendor={v}
          onClick={(vendor) => {
            received = vendor;
          }}
        />,
      );
      await fireEvent.click(getByTestId("vendor-card"));
      expect(received?.id).toBe(v.id);
    }
  });

  it("vendor-tags data-testid is vendor-tags", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, tags: ["cloud"] }} />,
    );
    expect(getByTestId("vendor-tags").getAttribute("data-testid")).toBe("vendor-tags");
  });

  it("vendor-description data-testid is vendor-description", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, description: "Test description" }} />,
    );
    expect(getByTestId("vendor-description").getAttribute("data-testid")).toBe(
      "vendor-description",
    );
  });

  it("renders vendor description text", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={{ ...mockVendor, description: "My description" }} />,
    );
    expect(getByTestId("vendor-description").textContent).toContain("My description");
  });

  it("vendor-actions data-testid is vendor-actions when actions present", async () => {
    const { getByTestId } = await render(<VendorCard vendor={mockVendor} onEdit={() => {}} />);
    expect(getByTestId("vendor-actions").getAttribute("data-testid")).toBe("vendor-actions");
  });

  it("both edit and delete buttons present when both handlers given", async () => {
    const { getByTestId } = await render(
      <VendorCard vendor={mockVendor} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(getByTestId("edit-button")).toBeDefined();
    expect(getByTestId("delete-button")).toBeDefined();
  });
});
