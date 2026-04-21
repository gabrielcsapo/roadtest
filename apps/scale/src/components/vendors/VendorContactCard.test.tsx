import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { VendorContactCard } from "./VendorContactCard";

const contacts = [
  { name: "Alice Smith", email: "alice@acme.com", role: "CISO", phone: "+1-555-0100" },
  { name: "Bob Jones", email: "bob@globex.com", role: "Security Manager", phone: "+1-555-0200" },
  {
    name: "Carol White",
    email: "carol@umbrella.com",
    role: "Compliance Officer",
    phone: undefined,
  },
  { name: "Dave Brown", email: "dave@initech.com", role: undefined, phone: "+1-555-0400" },
  { name: "Eve Davis", email: "eve@massive.com", role: undefined, phone: undefined },
];

describe("VendorContactCard", () => {
  // Basic rendering (10)
  it("renders contact card", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("vendor-contact-card")).toBeDefined();
  });

  it("renders contact header", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-header")).toBeDefined();
  });

  it("renders contact name", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-name").textContent).toBe("Alice Smith");
  });

  it("renders contact details section", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-details")).toBeDefined();
  });

  it("renders email row", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-email-row")).toBeDefined();
  });

  it("renders email value", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-email-value").textContent).toBe("alice@acme.com");
  });

  it("renders email label", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(getByTestId("contact-email-label").textContent).toContain("Email");
  });

  it("snapshot default", async () => {
    await render(<VendorContactCard name="Alice Smith" email="alice@acme.com" />);
    await snapshot("vendor-contact-card-default");
  });

  it("snapshot with all props", async () => {
    await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        role="CISO"
        phone="+1-555-0100"
        onEmail={() => {}}
        onCopy={() => {}}
      />,
    );
    await snapshot("vendor-contact-card-full");
  });

  it("renders with only required props", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test User" email="test@example.com" />,
    );
    expect(getByTestId("vendor-contact-card")).toBeDefined();
  });

  // Role display (5)
  it("renders role badge when role provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" role="CISO" />,
    );
    expect(getByTestId("contact-role")).toBeDefined();
  });

  it("renders role text correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" role="CISO" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("CISO");
  });

  it("hides role badge when role not provided", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(queryByTestId("contact-role")).toBeNull();
  });

  it("renders Security Manager role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Bob Jones" email="bob@globex.com" role="Security Manager" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("Security Manager");
  });

  it("renders Compliance Officer role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Carol White" email="carol@umbrella.com" role="Compliance Officer" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("Compliance Officer");
  });

  // Phone display (5)
  it("renders phone row when phone provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" phone="+1-555-0100" />,
    );
    expect(getByTestId("contact-phone-row")).toBeDefined();
  });

  it("renders phone value", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" phone="+1-555-0100" />,
    );
    expect(getByTestId("contact-phone-value").textContent).toBe("+1-555-0100");
  });

  it("hides phone row when phone not provided", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(queryByTestId("contact-phone-row")).toBeNull();
  });

  it("renders phone label", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" phone="+1-555-0100" />,
    );
    expect(getByTestId("contact-phone-label").textContent).toContain("Phone");
  });

  it("renders different phone number", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Dave Brown" email="dave@initech.com" phone="+1-555-0400" />,
    );
    expect(getByTestId("contact-phone-value").textContent).toBe("+1-555-0400");
  });

  // Email callback (10)
  it("shows send email button when onEmail provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onEmail={() => {}} />,
    );
    expect(getByTestId("send-email-button")).toBeDefined();
  });

  it("hides send email button when onEmail not provided", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(queryByTestId("send-email-button")).toBeNull();
  });

  it("calls onEmail with email when send email clicked", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        onEmail={(e) => {
          received = e;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(received).toBe("alice@acme.com");
  });

  it("fires onEmail for different email addresses", async () => {
    for (const c of contacts.slice(0, 3)) {
      let received = "";
      const { getByTestId } = await render(
        <VendorContactCard
          name={c.name}
          email={c.email}
          onEmail={(e) => {
            received = e;
          }}
        />,
      );
      await fireEvent.click(getByTestId("send-email-button"));
      expect(received).toBe(c.email);
    }
  });

  it("does not throw when onEmail undefined and no button", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(queryByTestId("send-email-button")).toBeNull();
  });

  it("fires onEmail multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        onEmail={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    await fireEvent.click(getByTestId("send-email-button"));
    expect(count).toBe(2);
  });

  // Copy callback (10)
  it("shows copy email button when onCopy provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onCopy={() => {}} />,
    );
    expect(getByTestId("copy-email-button")).toBeDefined();
  });

  it("hides copy email button when onCopy not provided", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" />,
    );
    expect(queryByTestId("copy-email-button")).toBeNull();
  });

  it("calls onCopy with email when copy email clicked", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-email-button"));
    expect(received).toBe("alice@acme.com");
  });

  it("shows copy phone button when phone and onCopy provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        phone="+1-555-0100"
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("copy-phone-button")).toBeDefined();
  });

  it("hides copy phone button when no phone", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onCopy={() => {}} />,
    );
    expect(queryByTestId("copy-phone-button")).toBeNull();
  });

  it("calls onCopy with phone when copy phone clicked", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        phone="+1-555-0100"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-phone-button"));
    expect(received).toBe("+1-555-0100");
  });

  it("hides copy phone when onCopy not provided", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" phone="+1-555-0100" />,
    );
    expect(queryByTestId("copy-phone-button")).toBeNull();
  });

  it("fires onCopy multiple times", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        onCopy={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-email-button"));
    await fireEvent.click(getByTestId("copy-email-button"));
    expect(count).toBe(2);
  });

  it("snapshot with copy buttons", async () => {
    await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        phone="+1-555-0100"
        onCopy={() => {}}
      />,
    );
    await snapshot("vendor-contact-card-copy-buttons");
  });

  it("snapshot without buttons", async () => {
    await render(<VendorContactCard name="Alice Smith" email="alice@acme.com" />);
    await snapshot("vendor-contact-card-no-buttons");
  });

  // Each contact (5)
  for (const contact of contacts) {
    it(`renders contact: ${contact.name}`, async () => {
      const { getByTestId } = await render(
        <VendorContactCard
          name={contact.name}
          email={contact.email}
          role={contact.role}
          phone={contact.phone}
        />,
      );
      expect(getByTestId("contact-name").textContent).toBe(contact.name);
    });
  }

  // Edge cases (20)
  it("renders with long name", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Very Long Contact Name Here" email="long@example.com" />,
    );
    expect(getByTestId("contact-name")).toBeDefined();
  });

  it("renders with long email", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="verylongemailaddress@verylongdomainname.com" />,
    );
    expect(getByTestId("contact-email-value")).toBeDefined();
  });

  it("renders without phone but with all button handlers", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        onEmail={() => {}}
        onCopy={() => {}}
      />,
    );
    expect(queryByTestId("contact-phone-row")).toBeNull();
  });

  it("renders with all props provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        role="CISO"
        phone="+1-555-0100"
        onEmail={() => {}}
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("vendor-contact-card")).toBeDefined();
  });

  it("renders with minimal props", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("vendor-contact-card")).toBeDefined();
  });

  it("renders correct email for different contacts", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Bob Jones" email="bob@globex.com" />,
    );
    expect(getByTestId("contact-email-value").textContent).toBe("bob@globex.com");
  });

  it("role shows DPO role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test" email="t@t.com" role="DPO" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("DPO");
  });

  it("renders correctly with empty phone string handling", async () => {
    const { queryByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" phone={undefined} />,
    );
    expect(queryByTestId("contact-phone-row")).toBeNull();
  });

  it("snapshot with role only", async () => {
    await render(<VendorContactCard name="Alice Smith" email="alice@acme.com" role="CISO" />);
    await snapshot("vendor-contact-card-role-only");
  });

  it("snapshot with phone only", async () => {
    await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" phone="+1-555-0100" />,
    );
    await snapshot("vendor-contact-card-phone-only");
  });

  it("renders send email button text", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onEmail={() => {}} />,
    );
    expect(getByTestId("send-email-button").textContent).toContain("Send Email");
  });

  it("renders copy button text", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onCopy={() => {}} />,
    );
    expect(getByTestId("copy-email-button").textContent).toContain("Copy");
  });

  it("renders copy phone button text", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice Smith"
        email="alice@acme.com"
        phone="+1-555-0100"
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("copy-phone-button").textContent).toContain("Copy");
  });

  it("contact email value matches email prop", async () => {
    const email = "uniquetest@example.org";
    const { getByTestId } = await render(<VendorContactCard name="Test" email={email} />);
    expect(getByTestId("contact-email-value").textContent).toBe(email);
  });

  it("contact name value matches name prop", async () => {
    const name = "Unique Test Person";
    const { getByTestId } = await render(<VendorContactCard name={name} email="t@t.com" />);
    expect(getByTestId("contact-name").textContent).toBe(name);
  });

  it("copy email passes correct value when multiple emails", async () => {
    const emails = ["a@a.com", "b@b.com", "c@c.com"];
    for (const email of emails) {
      let received = "";
      const { getByTestId } = await render(
        <VendorContactCard
          name="Test"
          email={email}
          onCopy={(v) => {
            received = v;
          }}
        />,
      );
      await fireEvent.click(getByTestId("copy-email-button"));
      expect(received).toBe(email);
    }
  });

  it("renders correctly when only name and email provided", async () => {
    const { getByTestId, queryByTestId } = await render(
      <VendorContactCard name="Test" email="test@test.com" />,
    );
    expect(getByTestId("vendor-contact-card")).toBeDefined();
    expect(queryByTestId("contact-role")).toBeNull();
    expect(queryByTestId("contact-phone-row")).toBeNull();
    expect(queryByTestId("send-email-button")).toBeNull();
    expect(queryByTestId("copy-email-button")).toBeNull();
  });

  // Additional rendering tests (46 more)
  it("renders contact card root element", async () => {
    const { container } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(container.querySelector('[data-testid="vendor-contact-card"]')).toBeDefined();
  });

  it("contact card has correct data-testid attribute", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("vendor-contact-card").getAttribute("data-testid")).toBe(
      "vendor-contact-card",
    );
  });

  it("contact header has correct data-testid", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("contact-header").getAttribute("data-testid")).toBe("contact-header");
  });

  it("contact name renders within header", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice Smith" email="alice@test.com" />,
    );
    expect(getByTestId("contact-header")).toBeDefined();
    expect(getByTestId("contact-name")).toBeDefined();
  });

  it("email row has correct data-testid", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("contact-email-row").getAttribute("data-testid")).toBe("contact-email-row");
  });

  it("email value has correct data-testid", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("contact-email-value").getAttribute("data-testid")).toBe(
      "contact-email-value",
    );
  });

  it("phone row data-testid is present when phone given", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" phone="+1-800-0000" />,
    );
    expect(getByTestId("contact-phone-row").getAttribute("data-testid")).toBe("contact-phone-row");
  });

  it("phone value data-testid is present when phone given", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" phone="+1-800-0000" />,
    );
    expect(getByTestId("contact-phone-value").getAttribute("data-testid")).toBe(
      "contact-phone-value",
    );
  });

  it("renders with IT Manager role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test" email="t@t.com" role="IT Manager" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("IT Manager");
  });

  it("renders with VP of Security role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test" email="t@t.com" role="VP of Security" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("VP of Security");
  });

  it("renders with CTO role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test" email="t@t.com" role="CTO" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("CTO");
  });

  it("renders with CEO role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Test" email="t@t.com" role="CEO" />,
    );
    expect(getByTestId("contact-role").textContent).toBe("CEO");
  });

  it("sends correct email for contact Bob", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Bob"
        email="bob@globex.com"
        onEmail={(e) => {
          received = e;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(received).toBe("bob@globex.com");
  });

  it("sends correct email for contact Carol", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Carol"
        email="carol@umbrella.com"
        onEmail={(e) => {
          received = e;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(received).toBe("carol@umbrella.com");
  });

  it("sends correct email for contact Dave", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Dave"
        email="dave@initech.com"
        onEmail={(e) => {
          received = e;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(received).toBe("dave@initech.com");
  });

  it("sends correct email for contact Eve", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Eve"
        email="eve@massive.com"
        onEmail={(e) => {
          received = e;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(received).toBe("eve@massive.com");
  });

  it("copies correct email for contact Bob", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Bob"
        email="bob@globex.com"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-email-button"));
    expect(received).toBe("bob@globex.com");
  });

  it("copies correct email for contact Carol", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Carol"
        email="carol@umbrella.com"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-email-button"));
    expect(received).toBe("carol@umbrella.com");
  });

  it("copies correct phone for different number", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Bob"
        email="bob@globex.com"
        phone="+1-555-0200"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-phone-button"));
    expect(received).toBe("+1-555-0200");
  });

  it("copies correct phone for Dave", async () => {
    let received = "";
    const { getByTestId } = await render(
      <VendorContactCard
        name="Dave"
        email="dave@initech.com"
        phone="+1-555-0400"
        onCopy={(v) => {
          received = v;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-phone-button"));
    expect(received).toBe("+1-555-0400");
  });

  it("send email fires once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        onEmail={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    expect(count).toBe(1);
  });

  it("copy email fires once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        onCopy={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-email-button"));
    expect(count).toBe(1);
  });

  it("copy phone fires once on single click", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        phone="+1-555-0100"
        onCopy={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-phone-button"));
    expect(count).toBe(1);
  });

  it("copy phone fires multiple times on multiple clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        phone="+1-555-0100"
        onCopy={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("copy-phone-button"));
    await fireEvent.click(getByTestId("copy-phone-button"));
    await fireEvent.click(getByTestId("copy-phone-button"));
    expect(count).toBe(3);
  });

  it("send email fires 3 times on 3 clicks", async () => {
    let count = 0;
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        onEmail={() => {
          count++;
        }}
      />,
    );
    await fireEvent.click(getByTestId("send-email-button"));
    await fireEvent.click(getByTestId("send-email-button"));
    await fireEvent.click(getByTestId("send-email-button"));
    expect(count).toBe(3);
  });

  it("snapshot contact without role or phone", async () => {
    await render(<VendorContactCard name="Eve Davis" email="eve@massive.com" />);
    await snapshot("vendor-contact-card-minimal");
  });

  it("snapshot contact with email button only", async () => {
    await render(
      <VendorContactCard name="Alice Smith" email="alice@acme.com" onEmail={() => {}} />,
    );
    await snapshot("vendor-contact-card-email-button");
  });

  it("snapshot contact with copy button only", async () => {
    await render(<VendorContactCard name="Alice Smith" email="alice@acme.com" onCopy={() => {}} />);
    await snapshot("vendor-contact-card-copy-button");
  });

  it("snapshot contact Dave with phone", async () => {
    await render(
      <VendorContactCard
        name="Dave Brown"
        email="dave@initech.com"
        phone="+1-555-0400"
        role={undefined}
      />,
    );
    await snapshot("vendor-contact-card-dave");
  });

  it("snapshot contact with role and no phone", async () => {
    await render(
      <VendorContactCard name="Bob Jones" email="bob@globex.com" role="Security Manager" />,
    );
    await snapshot("vendor-contact-card-bob");
  });

  it("contact details section has data-testid", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("contact-details").getAttribute("data-testid")).toBe("contact-details");
  });

  it("email label data-testid is contact-email-label", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Alice" email="alice@test.com" />);
    expect(getByTestId("contact-email-label").getAttribute("data-testid")).toBe(
      "contact-email-label",
    );
  });

  it("phone label data-testid is contact-phone-label when phone given", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" phone="+1-555-0100" />,
    );
    expect(getByTestId("contact-phone-label").getAttribute("data-testid")).toBe(
      "contact-phone-label",
    );
  });

  it("send email button data-testid is send-email-button", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" onEmail={() => {}} />,
    );
    expect(getByTestId("send-email-button").getAttribute("data-testid")).toBe("send-email-button");
  });

  it("copy email button data-testid is copy-email-button", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" onCopy={() => {}} />,
    );
    expect(getByTestId("copy-email-button").getAttribute("data-testid")).toBe("copy-email-button");
  });

  it("copy phone button data-testid is copy-phone-button", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        phone="+1-555-0100"
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("copy-phone-button").getAttribute("data-testid")).toBe("copy-phone-button");
  });

  it("renders role badge data-testid is contact-role", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" role="CISO" />,
    );
    expect(getByTestId("contact-role").getAttribute("data-testid")).toBe("contact-role");
  });

  it("both send email and copy buttons present when both handlers provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        onEmail={() => {}}
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("send-email-button")).toBeDefined();
    expect(getByTestId("copy-email-button")).toBeDefined();
  });

  it("both send email and copy phone buttons present with phone", async () => {
    const { getByTestId } = await render(
      <VendorContactCard
        name="Alice"
        email="alice@test.com"
        phone="+1-555-0100"
        onEmail={() => {}}
        onCopy={() => {}}
      />,
    );
    expect(getByTestId("send-email-button")).toBeDefined();
    expect(getByTestId("copy-phone-button")).toBeDefined();
  });

  it("role, phone row, and email row all visible when all props provided", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Alice" email="alice@test.com" role="CISO" phone="+1-555-0100" />,
    );
    expect(getByTestId("contact-role")).toBeDefined();
    expect(getByTestId("contact-phone-row")).toBeDefined();
    expect(getByTestId("contact-email-row")).toBeDefined();
  });

  it("renders name Bob Jones correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Bob Jones" email="bob@globex.com" />,
    );
    expect(getByTestId("contact-name").textContent).toBe("Bob Jones");
  });

  it("renders name Carol White correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Carol White" email="carol@umbrella.com" />,
    );
    expect(getByTestId("contact-name").textContent).toBe("Carol White");
  });

  it("renders name Dave Brown correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Dave Brown" email="dave@initech.com" />,
    );
    expect(getByTestId("contact-name").textContent).toBe("Dave Brown");
  });

  it("renders name Eve Davis correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Eve Davis" email="eve@massive.com" />,
    );
    expect(getByTestId("contact-name").textContent).toBe("Eve Davis");
  });

  it("renders email bob@globex.com correctly", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Bob" email="bob@globex.com" />);
    expect(getByTestId("contact-email-value").textContent).toBe("bob@globex.com");
  });

  it("renders email carol@umbrella.com correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Carol" email="carol@umbrella.com" />,
    );
    expect(getByTestId("contact-email-value").textContent).toBe("carol@umbrella.com");
  });

  it("renders email dave@initech.com correctly", async () => {
    const { getByTestId } = await render(
      <VendorContactCard name="Dave" email="dave@initech.com" />,
    );
    expect(getByTestId("contact-email-value").textContent).toBe("dave@initech.com");
  });

  it("renders email eve@massive.com correctly", async () => {
    const { getByTestId } = await render(<VendorContactCard name="Eve" email="eve@massive.com" />);
    expect(getByTestId("contact-email-value").textContent).toBe("eve@massive.com");
  });
});
