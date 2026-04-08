import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      // Keep host-provided packages out of the bundle
      external: [
        "react",
        "react/jsx-runtime",
        "react-dom",
        "react-dom/client",
        "@testing-library/react",
        "@testing-library/user-event",
      ],
    },
  },
});
