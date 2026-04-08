import React, { useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  avatarUrl?: string;
}

interface Props {
  userId: number;
}

export function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<User>;
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <div style={{ padding: 20, color: "#6b7280", fontSize: 14 }}>Loading…</div>;
  }

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          color: "#fca5a5",
          fontSize: 14,
        }}
      >
        Failed to load user: {error}
      </div>
    );
  }

  if (!user) return null;

  const roleColor: Record<User["role"], string> = {
    admin: "#818cf8",
    editor: "#34d399",
    viewer: "#9ca3af",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: "#1a1a24",
        border: "1px solid #2a2a36",
        borderRadius: 10,
        minWidth: 260,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {user.name[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e2e8" }}>{user.name}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{user.email}</div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: roleColor[user.role],
          background: `${roleColor[user.role]}20`,
          border: `1px solid ${roleColor[user.role]}40`,
          borderRadius: 6,
          padding: "2px 8px",
        }}
      >
        {user.role}
      </span>
    </div>
  );
}
