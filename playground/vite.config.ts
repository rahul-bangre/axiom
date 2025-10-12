import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@axiom": path.resolve(__dirname, "../src"),
      "@lexer": path.resolve(__dirname, "../src/lexer/mod.ts"),
      "@parser": path.resolve(__dirname, "../src/parser/mod.ts"),
      "@runtime": path.resolve(__dirname, "../src/runtime/mod.ts"),
      "@types": path.resolve(__dirname, "../src/types/mod.ts"),
      "@std": path.resolve(__dirname, "../src/std/mod.ts"),
      "@repl": path.resolve(__dirname, "../src/repl/mod.ts"),
    },
  },
  optimizeDeps: {
    exclude: ["@axiom"],
  },
});
