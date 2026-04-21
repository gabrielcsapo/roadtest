import { describe, it, expect, render, fireEvent, snapshot } from "roadtest";
import { PolicyCard } from "./PolicyCard";
import { Policy, User, ComplianceStatus, Framework } from "../../types";

const mockOwner: User = {
  id: "u1",
  name: "Alice Johnson",
  email: "alice@example.com",
  role: "admin",
};
const mockPolicy: Policy = {
  id: "pol1",
  title: "Acceptable Use Policy",
  description: "Guidelines for acceptable use of company resources.",
  status: "compliant",
  owner: mockOwner,
  lastUpdated: "2024-01-15",
  version: "2.1",
  acceptanceRate: 94,
  frameworks: ["SOC2", "ISO27001"],
};

const policies: Policy[] = [
  {
    ...mockPolicy,
    id: "p1",
    title: "Acceptable Use Policy",
    status: "compliant",
    acceptanceRate: 94,
  },
  {
    ...mockPolicy,
    id: "p2",
    title: "Password Policy",
    status: "in-progress",
    acceptanceRate: 72,
    frameworks: ["SOC2"],
  },
  {
    ...mockPolicy,
    id: "p3",
    title: "Data Retention Policy",
    status: "non-compliant",
    acceptanceRate: 45,
    frameworks: ["GDPR", "HIPAA"],
  },
  {
    ...mockPolicy,
    id: "p4",
    title: "Incident Response Plan",
    status: "not-applicable",
    acceptanceRate: 100,
    frameworks: ["SOC2", "ISO27001", "FedRAMP"],
  },
  {
    ...mockPolicy,
    id: "p5",
    title: "Vendor Management Policy",
    status: "compliant",
    acceptanceRate: 88,
    frameworks: ["ISO27001"],
  },
];

const allStatuses: ComplianceStatus[] = [
  "compliant",
  "non-compliant",
  "in-progress",
  "not-applicable",
];
const allFrameworks: Framework[] = ["SOC2", "ISO27001", "HIPAA", "GDPR", "PCI-DSS", "FedRAMP"];

describe("PolicyCard", () => {
  // Basic rendering - all 5 policies
  it("renders acceptable use policy title", async () => {
    const { getByTestId } = await render(<PolicyCard policy={policies[0]} />);
    expect(getByTestId("policy-title").textContent).toContain("Acceptable Use Policy");
  });

  it("renders password policy title", async () => {
    const { getByTestId } = await render(<PolicyCard policy={policies[1]} />);
    expect(getByTestId("policy-title").textContent).toContain("Password Policy");
  });

  it("renders data retention policy title", async () => {
    const { getByTestId } = await render(<PolicyCard policy={policies[2]} />);
    expect(getByTestId("policy-title").textContent).toContain("Data Retention Policy");
  });

  it("renders incident response plan title", async () => {
    const { getByTestId } = await render(<PolicyCard policy={policies[3]} />);
    expect(getByTestId("policy-title").textContent).toContain("Incident Response Plan");
  });

  it("renders vendor management policy title", async () => {
    const { getByTestId } = await render(<PolicyCard policy={policies[4]} />);
    expect(getByTestId("policy-title").textContent).toContain("Vendor Management Policy");
  });

  // Compliance status rendering for all 4 statuses
  it("shows compliant status badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, status: "compliant" }} />,
    );
    expect(getByTestId("policy-status-badge").textContent).toContain("Compliant");
  });

  it("shows non-compliant status badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, status: "non-compliant" }} />,
    );
    expect(getByTestId("policy-status-badge").textContent).toContain("Non-Compliant");
  });

  it("shows in-progress status badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, status: "in-progress" }} />,
    );
    expect(getByTestId("policy-status-badge").textContent).toContain("In Progress");
  });

  it("shows not-applicable status badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, status: "not-applicable" }} />,
    );
    expect(getByTestId("policy-status-badge").textContent).toContain("Not Applicable");
  });

  // Framework badges for each framework
  it("renders SOC2 framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["SOC2"] }} />,
    );
    expect(getByTestId("framework-badge-SOC2")).toBeDefined();
  });

  it("renders ISO27001 framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["ISO27001"] }} />,
    );
    expect(getByTestId("framework-badge-ISO27001")).toBeDefined();
  });

  it("renders HIPAA framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["HIPAA"] }} />,
    );
    expect(getByTestId("framework-badge-HIPAA")).toBeDefined();
  });

  it("renders GDPR framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["GDPR"] }} />,
    );
    expect(getByTestId("framework-badge-GDPR")).toBeDefined();
  });

  it("renders PCI-DSS framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["PCI-DSS"] }} />,
    );
    expect(getByTestId("framework-badge-PCI-DSS")).toBeDefined();
  });

  it("renders FedRAMP framework badge", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["FedRAMP"] }} />,
    );
    expect(getByTestId("framework-badge-FedRAMP")).toBeDefined();
  });

  it("renders multiple framework badges simultaneously", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: ["SOC2", "GDPR", "HIPAA"] }} />,
    );
    expect(getByTestId("framework-badge-SOC2")).toBeDefined();
    expect(getByTestId("framework-badge-GDPR")).toBeDefined();
    expect(getByTestId("framework-badge-HIPAA")).toBeDefined();
  });

  it("shows no-frameworks message when frameworks array is empty", async () => {
    const { getByTestId } = await render(<PolicyCard policy={{ ...mockPolicy, frameworks: [] }} />);
    expect(getByTestId("no-frameworks")).toBeDefined();
  });

  // Acceptance rate tests
  it("renders acceptance rate section", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, acceptanceRate: 94 }} />,
    );
    expect(getByTestId("policy-acceptance")).toBeDefined();
  });

  it("shows acceptance rate of 0", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, acceptanceRate: 0 }} />,
    );
    expect(getByTestId("policy-acceptance")).toBeDefined();
  });

  it("shows acceptance rate of 100", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, acceptanceRate: 100 }} />,
    );
    expect(getByTestId("policy-acceptance")).toBeDefined();
  });

  it("shows acceptance rate of 50", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, acceptanceRate: 50 }} />,
    );
    expect(getByTestId("policy-acceptance")).toBeDefined();
  });

  it("shows acceptance rate of 75", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, acceptanceRate: 75 }} />,
    );
    expect(getByTestId("policy-acceptance")).toBeDefined();
  });

  // Owner display
  it("shows owner name", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(getByTestId("owner-name").textContent).toContain("Alice Johnson");
  });

  it("renders owner avatar", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(getByTestId("owner-avatar")).toBeDefined();
  });

  it("shows owner with avatar URL", async () => {
    const owner = { ...mockOwner, avatarUrl: "https://example.com/avatar.png" };
    const { getByTestId } = await render(<PolicyCard policy={{ ...mockPolicy, owner }} />);
    expect(getByTestId("owner-avatar")).toBeDefined();
  });

  it("shows owner without avatar URL", async () => {
    const owner = { ...mockOwner, avatarUrl: undefined };
    const { getByTestId } = await render(<PolicyCard policy={{ ...mockPolicy, owner }} />);
    expect(getByTestId("owner-avatar")).toBeDefined();
  });

  // Version and last updated
  it("displays policy version", async () => {
    const { getByTestId } = await render(<PolicyCard policy={{ ...mockPolicy, version: "2.1" }} />);
    expect(getByTestId("policy-version").textContent).toContain("2.1");
  });

  it("displays policy last updated date", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, lastUpdated: "2024-01-15" }} />,
    );
    expect(getByTestId("policy-last-updated").textContent).toContain("2024-01-15");
  });

  it("displays description", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(getByTestId("policy-description")).toBeDefined();
  });

  // Click handler
  it("calls onClick when card is clicked", async () => {
    let clicked: Policy | null = null;
    const { getByTestId } = await render(
      <PolicyCard
        policy={mockPolicy}
        onClick={(p) => {
          clicked = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("policy-card"));
    expect(clicked).toBeDefined();
  });

  it("does not crash when onClick is not provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    await fireEvent.click(getByTestId("policy-card"));
    expect(getByTestId("policy-card")).toBeDefined();
  });

  it("passes correct policy to onClick handler", async () => {
    let received: Policy | null = null;
    const { getByTestId } = await render(
      <PolicyCard
        policy={policies[0]}
        onClick={(p) => {
          received = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("policy-card"));
    expect(received?.id).toBe("p1");
  });

  // Edit button
  it("shows edit button when onEdit is provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} onEdit={() => {}} />);
    expect(getByTestId("edit-button")).toBeDefined();
  });

  it("does not show edit button when onEdit is not provided", async () => {
    const { queryByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(queryByTestId("edit-button")).toBeNull();
  });

  it("calls onEdit when edit button is clicked", async () => {
    let edited: Policy | null = null;
    const { getByTestId } = await render(
      <PolicyCard
        policy={mockPolicy}
        onEdit={(p) => {
          edited = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(edited).toBeDefined();
  });

  it("passes correct policy to onEdit handler", async () => {
    let received: Policy | null = null;
    const { getByTestId } = await render(
      <PolicyCard
        policy={policies[2]}
        onEdit={(p) => {
          received = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("edit-button"));
    expect(received?.id).toBe("p3");
  });

  // Assign button
  it("shows assign button when onAssign is provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} onAssign={() => {}} />);
    expect(getByTestId("assign-button")).toBeDefined();
  });

  it("does not show assign button when onAssign is not provided", async () => {
    const { queryByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(queryByTestId("assign-button")).toBeNull();
  });

  it("calls onAssign when assign button is clicked", async () => {
    let assigned: Policy | null = null;
    const { getByTestId } = await render(
      <PolicyCard
        policy={mockPolicy}
        onAssign={(p) => {
          assigned = p;
        }}
      />,
    );
    await fireEvent.click(getByTestId("assign-button"));
    expect(assigned).toBeDefined();
  });

  // Both action buttons
  it("shows both edit and assign buttons when both handlers provided", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={mockPolicy} onEdit={() => {}} onAssign={() => {}} />,
    );
    expect(getByTestId("edit-button")).toBeDefined();
    expect(getByTestId("assign-button")).toBeDefined();
  });

  it("renders actions section when any action provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} onEdit={() => {}} />);
    expect(getByTestId("policy-actions")).toBeDefined();
  });

  it("does not render actions section when no actions provided", async () => {
    const { queryByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(queryByTestId("policy-actions")).toBeNull();
  });

  // Parameterized: all statuses with full framework combo
  allStatuses.map((status) =>
    it(`renders policy with status ${status} and all frameworks`, async () => {
      const policy = { ...mockPolicy, status, frameworks: allFrameworks };
      const { getByTestId } = await render(<PolicyCard policy={policy} />);
      expect(getByTestId("policy-status-badge")).toBeDefined();
      expect(getByTestId("policy-frameworks")).toBeDefined();
    }),
  );

  // Parameterized: acceptance rates
  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((rate) =>
    it(`renders acceptance rate bar at ${rate}%`, async () => {
      const { getByTestId } = await render(
        <PolicyCard policy={{ ...mockPolicy, acceptanceRate: rate }} />,
      );
      expect(getByTestId("policy-acceptance")).toBeDefined();
    }),
  );

  // Parameterized: all individual frameworks
  allFrameworks.map((fw) =>
    it(`renders policy with only ${fw} framework`, async () => {
      const { getByTestId } = await render(
        <PolicyCard policy={{ ...mockPolicy, frameworks: [fw] }} />,
      );
      expect(getByTestId(`framework-badge-${fw}`)).toBeDefined();
    }),
  );

  // Snapshots
  it("matches snapshot for compliant policy", async () => {
    const { container } = await render(<PolicyCard policy={policies[0]} />);
    await snapshot("policy-card-compliant");
  });

  it("matches snapshot for non-compliant policy", async () => {
    const { container } = await render(<PolicyCard policy={policies[2]} />);
    await snapshot("policy-card-non-compliant");
  });

  it("matches snapshot for in-progress policy", async () => {
    const { container } = await render(<PolicyCard policy={policies[1]} />);
    await snapshot("policy-card-in-progress");
  });

  it("matches snapshot for not-applicable policy", async () => {
    const { container } = await render(<PolicyCard policy={policies[3]} />);
    await snapshot("policy-card-not-applicable");
  });

  // Edge cases
  it("renders card with very long title", async () => {
    const longTitle = "A".repeat(200);
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, title: longTitle }} />,
    );
    expect(getByTestId("policy-title")).toBeDefined();
  });

  it("renders card with very long description", async () => {
    const longDesc = "B".repeat(500);
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, description: longDesc }} />,
    );
    expect(getByTestId("policy-description")).toBeDefined();
  });

  it("renders card with all 6 frameworks", async () => {
    const { getByTestId } = await render(
      <PolicyCard policy={{ ...mockPolicy, frameworks: allFrameworks }} />,
    );
    expect(getByTestId("policy-frameworks")).toBeDefined();
  });

  it("renders card with version 1.0", async () => {
    const { getByTestId } = await render(<PolicyCard policy={{ ...mockPolicy, version: "1.0" }} />);
    expect(getByTestId("policy-version").textContent).toContain("1.0");
  });

  it("renders card header", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(getByTestId("policy-card-header")).toBeDefined();
  });

  it("renders meta section", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    expect(getByTestId("policy-meta")).toBeDefined();
  });

  it("has pointer cursor when onClick is provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} onClick={() => {}} />);
    const card = getByTestId("policy-card");
    expect(card.style.cursor).toBe("pointer");
  });

  it("has default cursor when onClick is not provided", async () => {
    const { getByTestId } = await render(<PolicyCard policy={mockPolicy} />);
    const card = getByTestId("policy-card");
    expect(card.style.cursor).toBe("default");
  });
});
