import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath, URL } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: true,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "**/*{.,-}config.{js,cjs,mjs,ts}",
        "dist/",
        "src/main.jsx", // Entry point
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/utils": resolve(__dirname, "./src/utils"),
      "@/hooks": resolve(__dirname, "./src/hooks"),
      "@/config": resolve(__dirname, "./src/config"),
    },
  },
});
