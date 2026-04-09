import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import mdx from "@mdx-js/rollup";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";

// Workspace root — two levels up from packages/website
const workspaceRoot = resolve(__dirname, "../..");

export default defineConfig({
  plugins: [
    // MDX must come before the React plugin so MDX → JSX before React handles JSX
    mdx({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeShiki,
          {
            theme: "one-dark-pro",
            langs: ["typescript", "tsx", "jsx", "javascript", "bash", "yaml", "json", "text"],
          },
        ],
      ],
    }),
    react(),
    tailwindcss(),
  ],
  base: process.env.GITHUB_ACTIONS ? "/fieldtest/" : "/",
  root: __dirname,
  server: {
    port: 4000,
    fs: { allow: [workspaceRoot] },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});
