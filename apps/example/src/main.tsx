import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./globals.css";

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  const root = document.getElementById("root")!;
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
