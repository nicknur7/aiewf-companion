import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" → relative asset paths, so it works on GitHub Pages under any
// subpath (user.github.io/aiewf-companion/) with zero basePath config.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", target: "es2020" },
});
