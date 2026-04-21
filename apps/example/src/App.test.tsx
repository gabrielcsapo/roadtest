/**
 * Integration smoke tests for App — covers the full component tree rendering,
 * billing total computation, and discount selector interaction.
 *
 * These are the only tests that exercise multiple components working together.
 */
import React from "react";
import { describe, it, expect, render, fireEvent, mock } from "roadtest";
import { http, HttpResponse } from "msw";
import { worker } from "../.roadtest/setup";

import { App } from "./App";
import type { User } from "./UserProfile";

mock("./greeting", () => ({
  getGreeting: (name: string) => `Good morning, ${name}!`,
}));

const ALICE: User = { id: 1, name: "Alice Chen", email: "alicechen@example.com", role: "admin" };
const BOB: User = { id: 2, name: "Bob Torres", email: "bob@example.com", role: "editor" };
const EVE: User = { id: 3, name: "Eve Sharma", email: "eve@example.com", role: "viewer" };

function setupTeamHandlers() {
  worker.use(
    http.get("/api/users/1", () => HttpResponse.json(ALICE)),
    http.get("/api/users/2", () => HttpResponse.json(BOB)),
    http.get("/api/users/3", () => HttpResponse.json(EVE)),
  );
}

// Cart totals for the hard-coded CART_ITEMS in App.tsx:
//   Pro Seat:       $49 × 1 = $49
//   Storage Add-on: $12 × 3 = $36
//   SSO Module:     $99 × 1 = $99
//
//   No discount:   $184
//   Bulk (10% off qty ≥ 3): $49 + $32.4 + $99 = $180.4
//   Member (15% off all):   $41.65 + $30.6 + $84.15 = $156.4

describe("App — smoke", () => {
  it("renders the nav header", async () => {
    setupTeamHandlers();
    const { getByText } = await render(<App />);
    expect(getByText("Team Dashboard").textContent).toBe("Team Dashboard");
  });

  it("renders the greeting in the header", async () => {
    setupTeamHandlers();
    const { container } = await render(<App />);
    const header = container.querySelector("header");
    expect(header).toBeDefined();
    expect(header!.textContent).toContain("Team");
  });

  it("shows all three team members after loading", async () => {
    setupTeamHandlers();
    const { findByText } = await render(<App />);
    await findByText("Alice Chen");
    await findByText("Bob Torres");
    await findByText("Eve Sharma");
  });

  it("shows correct member roles", async () => {
    setupTeamHandlers();
    const { findByText } = await render(<App />);
    await findByText("admin");
    await findByText("editor");
    await findByText("viewer");
  });

  it("renders the task board", async () => {
    setupTeamHandlers();
    const { getByTestId } = await render(<App />);
    expect(getByTestId("task-board")).toBeDefined();
  });

  it("renders initial pending task count", async () => {
    setupTeamHandlers();
    const { getByTestId } = await render(<App />);
    // App.tsx initializes 5 tasks, 4 pending (t5 is done)
    expect(getByTestId("pending-count").textContent).toBe("4");
  });
});

describe("App — billing calculator", () => {
  it("shows the correct no-discount total on first render", async () => {
    setupTeamHandlers();
    const { getByText } = await render(<App />);
    expect(getByText("$184").textContent).toBe("$184");
  });

  it("shows line items for each cart entry", async () => {
    setupTeamHandlers();
    const { getByText } = await render(<App />);
    expect(getByText("Pro Seat × 1")).toBeDefined();
    expect(getByText("Storage Add-on × 3")).toBeDefined();
    expect(getByText("SSO Module × 1")).toBeDefined();
  });

  it("applies bulk discount when selected", async () => {
    setupTeamHandlers();
    const { getByDisplayValue, getByText, findByText, container } = await render(<App />);
    await findByText("Alice Chen");
    await fireEvent.click(getByDisplayValue("bulk"));
    expect(getByText("$180.4").textContent).toBe("$180.4");
    await expect(container).toMatchSnapshot("bulk-discount");
  });

  it("applies member discount when selected", async () => {
    setupTeamHandlers();
    const { getByDisplayValue, getByText, findByText, container } = await render(<App />);
    await findByText("Alice Chen");
    await fireEvent.click(getByDisplayValue("member"));
    expect(getByText("$156.4").textContent).toBe("$156.4");
    await expect(container).toMatchSnapshot("member-discount");
  });

  it("restores full price when switching back to no discount", async () => {
    setupTeamHandlers();
    const { getByDisplayValue, getByText, findByText, container } = await render(<App />);
    await findByText("Alice Chen");
    await fireEvent.click(getByDisplayValue("member"));
    await fireEvent.click(getByDisplayValue("none"));
    expect(getByText("$184").textContent).toBe("$184");
    await expect(container).toMatchSnapshot("back-to-no-discount");
  });
});
