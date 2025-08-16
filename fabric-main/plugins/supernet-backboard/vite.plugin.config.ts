import { defineConfig } from "vite";
import path from "path";
export default defineConfig({
  root: __dirname,
  css: { postcss: path.resolve(__dirname, "postcss.config.cjs") },
  build: {
    lib: { entry: path.resolve(__dirname, "src", "entry.ts"), formats: ["es"], fileName: () => "entry" },
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true
  }
});
