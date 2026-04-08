import { act, describe, it, render } from "@fieldtest/core";
import { http, HttpResponse } from "msw";
import { worker } from "../.fieldtest/setup";
import { UserProfile } from "./UserProfile";
import type { User } from "./UserProfile";

const ALICE: User = { id: 1, name: "Alice Chen", email: "alice@example.com", role: "admin" };
const BOB: User = { id: 2, name: "Bob Torres", email: "bob@example.com", role: "editor" };
const EVE: User = { id: 3, name: "Eve Sharma", email: "eve@example.com", role: "viewer" };

describe("UserProfile", () => {
  it("renders an admin user", async () => {
    worker.use(http.get("/api/users/1", () => HttpResponse.json(ALICE)));
    const { findByText } = await render(<UserProfile userId={1} />);
    await findByText("Alice Chen");
  });

  it("renders an editor user", async () => {
    worker.use(http.get("/api/users/2", () => HttpResponse.json(BOB)));
    const { findByText } = await render(<UserProfile userId={2} />);
    await findByText("Bob Torres");
  });

  it("renders a viewer user", async () => {
    worker.use(http.get("/api/users/3", () => HttpResponse.json(EVE)));
    const { findByText, container } = await render(<UserProfile userId={3} />);

    await findByText("Eve Sharma");
  });

  it("shows error state on 404", async () => {
    worker.use(
      http.get("/api/users/99", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    );
    const { findByText } = await render(<UserProfile userId={99} />);
    await findByText(/failed to load user/i);
  });

  it("shows error state on 500", async () => {
    worker.use(
      http.get(
        "/api/users/0",
        () => new HttpResponse(null, { status: 500, statusText: "Internal Server Error" }),
      ),
    );
    const { findByText } = await render(<UserProfile userId={0} />);
    await findByText(/failed to load user/i);
  });
});
