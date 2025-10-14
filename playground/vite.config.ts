import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Plugin to strip .ts extensions from Deno-style imports
const stripTsExtensions = (): Plugin => ({
  name: "strip-ts-extensions",
  transform(code, id) {
    // Only process TypeScript files from the parent src directory
    if (!id.includes("/src/") || !id.endsWith(".ts")) {
      return null;
    }

    // Replace all imports with .ts extensions
    const transformed = code.replace(
      /from\s+['"]([^'"]+)\.ts['"]/g,
      'from "$1"',
    );

    return {
      code: transformed,
      map: null,
    };
  },
});

export default defineConfig({
  plugins: [react(), stripTsExtensions()],
  resolve: {
    alias: {
      "@axiom": path.resolve(__dirname, "../src"),
      "@lexer": path.resolve(__dirname, "../src/lexer/mod"),
      "@parser": path.resolve(__dirname, "../src/parser/mod"),
      "@runtime": path.resolve(__dirname, "../src/runtime/mod"),
      "@types": path.resolve(__dirname, "../src/types/mod"),
      "@std": path.resolve(__dirname, "../src/std/browser"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    mainFields: ["module", "main"],
  },
  server: {
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    exclude: ["@axiom"],
    esbuildOptions: {
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
    },
  },
});
