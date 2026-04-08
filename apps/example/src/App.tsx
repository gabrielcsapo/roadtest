import React, { useState } from "react";
import { UserProfile } from "./UserProfile";
import { TaskBoard, Task } from "./TaskBoard";
import { Counter } from "./Counter";
import { Button } from "./Button";
import { getGreeting } from "./greeting";
import { calculateTotal } from "./cart";
import { noDiscount, bulkDiscount, memberDiscount, CartItem } from "./discounts";

const TEAM_IDS = [1, 2, 3];

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Set up CI pipeline",
    description: "Configure GitHub Actions for lint, test, and build.",
    done: false,
  },
  {
    id: "t2",
    title: "Design database schema",
    description: "Draft ERD for the new user permissions model.",
    done: false,
  },
  {
    id: "t3",
    title: "Write API documentation",
    description: "Document all REST endpoints in OpenAPI format.",
    done: false,
  },
  {
    id: "t4",
    title: "Code review backlog",
    description: "Clear the 8 open PRs waiting for review.",
    done: false,
  },
  {
    id: "t5",
    title: "Update dependencies",
    description: "Bump packages flagged by Dependabot.",
    done: true,
  },
];

const CART_ITEMS: CartItem[] = [
  { name: "Pro Seat", price: 49, qty: 1 },
  { name: "Storage Add-on", price: 12, qty: 3 },
  { name: "SSO Module", price: 99, qty: 1 },
];

type DiscountKey = "none" | "bulk" | "member";
const DISCOUNT_FNS = {
  none: noDiscount,
  bulk: bulkDiscount,
  member: memberDiscount,
};
const DISCOUNT_LABELS: Record<DiscountKey, string> = {
  none: "No discount",
  bulk: "Bulk (10% off qty ≥ 3)",
  member: "Member (15% off all)",
};

export function App() {
  const [discount, setDiscount] = useState<DiscountKey>("none");
  const total = calculateTotal(CART_ITEMS, DISCOUNT_FNS[discount]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f13",
        color: "#e2e2e8",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Nav */}
      <header
        style={{
          borderBottom: "1px solid #1e1e2a",
          padding: "0 32px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: "#e2e2e8" }}>
          Team Dashboard
        </span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>{getGreeting("Team")}</span>
      </header>

      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
        }}
      >
        {/* Team */}
        <section>
          <SectionHeading>Team</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
            {TEAM_IDS.map((id) => (
              <UserProfile key={id} userId={id} />
            ))}
          </div>
        </section>

        {/* Tasks + Sidebar */}
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Task board */}
          <section style={{ flex: "1 1 360px" }}>
            <SectionHeading>Sprint Tasks</SectionHeading>
            <div
              style={{
                marginTop: 16,
                background: "#13131a",
                border: "1px solid #1e1e2a",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <TaskBoard initialTasks={INITIAL_TASKS} />
            </div>
          </section>

          {/* Sidebar */}
          <aside style={{ flex: "0 0 280px", display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Sprint counter */}
            <section>
              <SectionHeading>Sprint #</SectionHeading>
              <div
                style={{
                  marginTop: 16,
                  background: "#13131a",
                  border: "1px solid #1e1e2a",
                  borderRadius: 12,
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Counter initial={12} step={1} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Current sprint</span>
              </div>
            </section>

            {/* Billing calculator */}
            <section>
              <SectionHeading>Billing Estimate</SectionHeading>
              <div
                style={{
                  marginTop: 16,
                  background: "#13131a",
                  border: "1px solid #1e1e2a",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Line items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CART_ITEMS.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "#9ca3af",
                      }}
                    >
                      <span>
                        {item.name} × {item.qty}
                      </span>
                      <span>${item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                {/* Discount selector */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    borderTop: "1px solid #1e1e2a",
                    paddingTop: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Discount
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(Object.keys(DISCOUNT_LABELS) as DiscountKey[]).map((key) => (
                      <label
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          color: discount === key ? "#818cf8" : "#9ca3af",
                        }}
                      >
                        <input
                          type="radio"
                          name="discount"
                          value={key}
                          checked={discount === key}
                          onChange={() => setDiscount(key)}
                          style={{ accentColor: "#6366f1" }}
                        />
                        {DISCOUNT_LABELS[key]}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #1e1e2a",
                    paddingTop: 14,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e2e8" }}>
                    Total / mo
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#818cf8" }}>${total}</span>
                </div>

                <Button label="Upgrade Plan" variant="primary" />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}
