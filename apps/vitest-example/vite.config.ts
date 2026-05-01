import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { roadtest } from "roadtest/plugin";

export default defineConfig({
  plugins: [react(), roadtest({ vitestCompat: true })],
  server: { port: 3334 },
});
