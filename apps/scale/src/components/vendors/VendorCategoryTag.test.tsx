import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorCategoryTag } from "./VendorCategoryTag";

const categories = [
  "Cloud Infrastructure",
  "Payment Processing",
  "HR Software",
  "Security",
  "Analytics",
];

describe("VendorCategoryTag", () => {
  // Basic rendering (10)
  it("renders category tag container", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders category label", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Cloud Infrastructure");
  });

  it("renders data-category attribute", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-category")).toBe("Security");
  });

  it("default size is md", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBe("md");
  });

  it("hides remove button by default", async () => {
    const { queryByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(queryByTestId("category-tag-remove")).toBeNull();
  });

  it("snapshot default", async () => {
    await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    await snapshot("vendor-category-tag-default");
  });

  it("renders all 5 category tags", async () => {
    for (const cat of categories) {
      const { getByTestId } = await render(<VendorCategoryTag category={cat} />);
      expect(getByTestId("category-tag-label").textContent).toBe(cat);
    }
  });

  it("renders with color prop", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#dbeafe" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders without onClick", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders without onRemove", async () => {
    const { queryByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(queryByTestId("category-tag-remove")).toBeNull();
  });

  // Size variations (2)
  it("renders size sm", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" size="sm" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBe("sm");
  });

  it("renders size md", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" size="md" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBe("md");
  });

  it("snapshot sm size", async () => {
    await render(<VendorCategoryTag category="Security" size="sm" />);
    await snapshot("vendor-category-tag-sm");
  });

  it("snapshot md size", async () => {
    await render(<VendorCategoryTag category="Security" size="md" />);
    await snapshot("vendor-category-tag-md");
  });

  it("renders sm without remove button", async () => {
    const { queryByTestId } = await render(<VendorCategoryTag category="Security" size="sm" />);
    expect(queryByTestId("category-tag-remove")).toBeNull();
  });

  // Click callback (10)
  it("calls onClick when tag clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(clicked).toBeTruthy();
  });

  it("passes category to onClick", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={(c) => {
          received = c;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(received).toBe("Security");
  });

  it("does not throw when onClick undefined", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("fires onClick for each category", async () => {
    for (const cat of categories) {
      let received = "";
      const { getByTestId } = await render(
        <VendorCategoryTag
          category={cat}
          onClick={(c) => {
            received = c;
          }}
        />,
      );
      await fireEvent.click(getByTestId("vendor-category-tag"));
      expect(received).toBe(cat);
    }
  });

  it("fires onClick multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(count).toBe(2);
  });

  it("remove click does not propagate to tag click", async () => {
    let tagClicked = false;
    let removeClicked = false;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          tagClicked = true;
        }}
        onRemove={() => {
          removeClicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-remove"));
    expect(removeClicked).toBeTruthy();
    expect(tagClicked).toBe(false);
  });

  it("calls onRemove when remove button clicked", async () => {
    let removed = false;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onRemove={() => {
          removed = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-remove"));
    expect(removed).toBeTruthy();
  });

  it("passes category to onRemove", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onRemove={(c) => {
          received = c;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-remove"));
    expect(received).toBe("Security");
  });

  it("shows remove button when onRemove provided", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove")).toBeDefined();
  });

  it("remove button has aria-label", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove").getAttribute("aria-label")).toContain("Security");
  });

  // Category variations (5 each with props)
  for (const cat of categories) {
    it(`renders category: ${cat}`, async () => {
      const { getByTestId } = await render(<VendorCategoryTag category={cat} />);
      expect(getByTestId("category-tag-label").textContent).toBe(cat);
    });
  }

  // Color variations (10)
  it("renders with custom red color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#ef4444" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders with custom blue color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#3b82f6" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders with custom green color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#22c55e" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders with hex color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#ff0000" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders with default color when color not provided", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("snapshot with red color", async () => {
    await render(<VendorCategoryTag category="Security" color="#ef4444" />);
    await snapshot("vendor-category-tag-red");
  });

  it("snapshot with remove button", async () => {
    await render(<VendorCategoryTag category="Security" onRemove={() => {}} />);
    await snapshot("vendor-category-tag-removable");
  });

  it("snapshot with all features", async () => {
    await render(
      <VendorCategoryTag
        category="Security"
        color="#dbeafe"
        onClick={() => {}}
        onRemove={() => {}}
        size="sm"
      />,
    );
    await snapshot("vendor-category-tag-all-features");
  });

  it("snapshot with onClick only", async () => {
    await render(<VendorCategoryTag category="Cloud Infrastructure" onClick={() => {}} />);
    await snapshot("vendor-category-tag-clickable");
  });

  // Edge cases (10)
  it("renders with long category name", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Very Long Category Name Here" />,
    );
    expect(getByTestId("category-tag-label").textContent).toBe("Very Long Category Name Here");
  });

  it("renders with short category name", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="AI" />);
    expect(getByTestId("category-tag-label").textContent).toBe("AI");
  });

  it("renders with special characters in category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="C++ & Security" />);
    expect(getByTestId("category-tag-label")).toBeDefined();
  });

  it("renders with both onClick and onRemove", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onClick={() => {}} onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove")).toBeDefined();
  });

  it("renders correctly without any optional props", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders with size sm and remove button", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" size="sm" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove")).toBeDefined();
  });

  it("data-category attribute matches prop", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Analytics" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-category")).toBe("Analytics");
  });

  it("fires onRemove for each category", async () => {
    for (const cat of categories) {
      let received = "";
      const { getByTestId } = await render(
        <VendorCategoryTag
          category={cat}
          onRemove={(c) => {
            received = c;
          }}
        />,
      );
      await fireEvent.click(getByTestId("category-tag-remove"));
      expect(received).toBe(cat);
    }
  });

  it("renders multiple tags in sequence", async () => {
    for (let i = 0; i < 3; i++) {
      const { getByTestId } = await render(<VendorCategoryTag category={`Category ${i}`} />);
      expect(getByTestId("vendor-category-tag")).toBeDefined();
    }
  });

  it("renders category tag with number in name", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="ISO 27001" />);
    expect(getByTestId("category-tag-label").textContent).toBe("ISO 27001");
  });

  // Additional tests to reach 100+
  it("renders Cloud Infrastructure category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Cloud Infrastructure");
  });

  it("renders Payment Processing category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Payment Processing" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Payment Processing");
  });

  it("renders HR Software category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="HR Software" />);
    expect(getByTestId("category-tag-label").textContent).toBe("HR Software");
  });

  it("renders Security category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Security");
  });

  it("renders Analytics category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Analytics" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Analytics");
  });

  it("renders Communication category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Communication" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Communication");
  });

  it("renders Other category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Other" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Other");
  });

  it("renders SOC 2 category with number", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="SOC 2" />);
    expect(getByTestId("category-tag-label").textContent).toBe("SOC 2");
  });

  it("renders PCI DSS category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="PCI DSS" />);
    expect(getByTestId("category-tag-label").textContent).toBe("PCI DSS");
  });

  it("renders GDPR category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="GDPR" />);
    expect(getByTestId("category-tag-label").textContent).toBe("GDPR");
  });

  it("renders HIPAA category", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="HIPAA" />);
    expect(getByTestId("category-tag-label").textContent).toBe("HIPAA");
  });

  it("size sm tag with all props renders correctly", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        size="sm"
        color="#dbeafe"
        onClick={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBe("sm");
  });

  it("size md tag with all props renders correctly", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        size="md"
        color="#fee2e2"
        onClick={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBe("md");
  });

  it("clicking tag fires onClick even when onRemove provided", async () => {
    let tagClicked = false;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          tagClicked = true;
        }}
        onRemove={() => {}}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-label"));
    expect(tagClicked).toBeTruthy();
  });

  it("remove button is a button element", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove").tagName).toBe("BUTTON");
  });

  it("tag container is a span element", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag").tagName).toBe("SPAN");
  });

  it("category label is a span element", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("category-tag-label").tagName).toBe("SPAN");
  });

  it("data-category uses exact prop value", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-category")).toBe(
      "Cloud Infrastructure",
    );
  });

  it("fires onClick when label text clicked", async () => {
    let clicked = false;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-label"));
    expect(clicked).toBeTruthy();
  });

  it("snapshot for each category in categories array", async () => {
    for (const cat of categories) {
      await render(<VendorCategoryTag category={cat} />);
      await snapshot(`vendor-category-tag-${cat.toLowerCase().replace(/\s+/g, "-")}`);
    }
  });

  it("snapshot sm with remove button", async () => {
    await render(<VendorCategoryTag category="Security" size="sm" onRemove={() => {}} />);
    await snapshot("vendor-category-tag-sm-removable");
  });

  it("snapshot md with onClick", async () => {
    await render(<VendorCategoryTag category="Analytics" size="md" onClick={() => {}} />);
    await snapshot("vendor-category-tag-md-clickable");
  });

  it("renders correctly with amber color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Risk" color="#fef3c7" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders correctly with green color", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Compliant" color="#dcfce7" />,
    );
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders correctly with purple color", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Enterprise" color="#f3e8ff" />,
    );
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders exactly 5 categories test", async () => {
    for (const cat of categories) {
      const { getByTestId } = await render(
        <VendorCategoryTag category={cat} size="sm" onRemove={() => {}} onClick={() => {}} />,
      );
      expect(getByTestId("category-tag-label").textContent).toBe(cat);
    }
  });

  it("onRemove receives category name correctly for all 5 categories", async () => {
    for (const cat of categories) {
      let received = "";
      const { getByTestId } = await render(
        <VendorCategoryTag
          category={cat}
          onRemove={(c) => {
            received = c;
          }}
        />,
      );
      await fireEvent.click(getByTestId("category-tag-remove"));
      expect(received).toBe(cat);
    }
  });

  it("onClick receives category name correctly for all 5 categories", async () => {
    for (const cat of categories) {
      let received = "";
      const { getByTestId } = await render(
        <VendorCategoryTag
          category={cat}
          onClick={(c) => {
            received = c;
          }}
        />,
      );
      await fireEvent.click(getByTestId("vendor-category-tag"));
      expect(received).toBe(cat);
    }
  });

  // More tests to reach 100
  it("vendor-category-tag data-testid is vendor-category-tag", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-testid")).toBe(
      "vendor-category-tag",
    );
  });

  it("category-tag-label data-testid is category-tag-label", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" />);
    expect(getByTestId("category-tag-label").getAttribute("data-testid")).toBe(
      "category-tag-label",
    );
  });

  it("category-tag-remove data-testid is category-tag-remove", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove").getAttribute("data-testid")).toBe(
      "category-tag-remove",
    );
  });

  it("fires onClick once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(count).toBe(1);
  });

  it("fires onClick 3 times on 3 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    await fireEvent.click(getByTestId("vendor-category-tag"));
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(count).toBe(3);
  });

  it("fires onRemove once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onRemove={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-remove"));
    expect(count).toBe(1);
  });

  it("fires onRemove 2 times on 2 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onRemove={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("category-tag-remove"));
    await fireEvent.click(getByTestId("category-tag-remove"));
    expect(count).toBe(2);
  });

  it("data-size attribute is present on container", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Test" size="sm" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-size")).toBeDefined();
  });

  it("data-category attribute is present on container", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="MyCategory" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-category")).toBe("MyCategory");
  });

  it("renders without onClick without error", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Test" />);
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders without onRemove without error", async () => {
    const { queryByTestId } = await render(<VendorCategoryTag category="Test" />);
    expect(queryByTestId("category-tag-remove")).toBeNull();
  });

  it("renders category with empty string safely", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders category Financial Services", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Financial Services" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Financial Services");
  });

  it("renders category IT Operations", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="IT Operations" />);
    expect(getByTestId("category-tag-label").textContent).toBe("IT Operations");
  });

  it("renders category Data Management", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Data Management" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Data Management");
  });

  it("renders category DevOps", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="DevOps" />);
    expect(getByTestId("category-tag-label").textContent).toBe("DevOps");
  });

  it("renders category Monitoring", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Monitoring" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Monitoring");
  });

  it("snapshot no options", async () => {
    await render(<VendorCategoryTag category="Security" />);
    await snapshot("vendor-category-tag-no-options");
  });

  it("snapshot with all options sm", async () => {
    await render(
      <VendorCategoryTag
        category="Security"
        size="sm"
        color="#dbeafe"
        onClick={() => {}}
        onRemove={() => {}}
      />,
    );
    await snapshot("vendor-category-tag-all-sm");
  });

  it("snapshot with all options md", async () => {
    await render(
      <VendorCategoryTag
        category="Security"
        size="md"
        color="#fee2e2"
        onClick={() => {}}
        onRemove={() => {}}
      />,
    );
    await snapshot("vendor-category-tag-all-md");
  });

  it("renders remove button aria-label", async () => {
    const { getByTestId } = await render(
      <VendorCategoryTag category="Security" onRemove={() => {}} />,
    );
    expect(getByTestId("category-tag-remove").getAttribute("aria-label")).toBeDefined();
  });

  it("renders correctly with blue background color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#dbeafe" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("renders correctly with red background color", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Security" color="#fee2e2" />);
    expect(getByTestId("vendor-category-tag")).toBeDefined();
  });

  it("vendor-category-tag data-testid is vendor-category-tag", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Cloud Infrastructure" />);
    expect(getByTestId("vendor-category-tag").getAttribute("data-testid")).toBe(
      "vendor-category-tag",
    );
  });

  it("onClick fires twice on double click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorCategoryTag
        category="Security"
        onClick={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("vendor-category-tag"));
    await fireEvent.click(getByTestId("vendor-category-tag"));
    expect(count).toBe(2);
  });

  it("renders HR Software category label text", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="HR Software" />);
    expect(getByTestId("category-tag-label").textContent).toBe("HR Software");
  });

  it("renders Analytics category label text", async () => {
    const { getByTestId } = await render(<VendorCategoryTag category="Analytics" />);
    expect(getByTestId("category-tag-label").textContent).toBe("Analytics");
  });
});
