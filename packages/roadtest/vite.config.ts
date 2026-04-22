import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        plugin: resolve(__dirname, "src/plugin.ts"),
        "serialize-dom": resolve(__dirname, "src/shared/serializeDom.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // Externalize every non-relative import so published bundles don't
      // inline React, three, testing-library, etc. — consumers bring their own.
      external: (id) => !id.startsWith(".") && !id.startsWith("/"),
    },
  },
});
