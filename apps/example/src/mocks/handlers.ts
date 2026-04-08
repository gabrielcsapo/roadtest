import { http, HttpResponse } from "msw";
import type { User } from "../UserProfile";

const users: User[] = [
  { id: 1, name: "Alice Chen", email: "alice@example.com", role: "admin" },
  { id: 2, name: "Bob Torres", email: "bob@example.com", role: "editor" },
  { id: 3, name: "Eve Nakamura", email: "eve@example.com", role: "viewer" },
];

export const handlers = [
  http.get("/api/users/:id", ({ params }) => {
    const user = users.find((u) => u.id === Number(params.id));
    if (!user) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(user);
  }),
];
