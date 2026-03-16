import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set this to your GitHub repo name, e.g. "/MergeConflict/"
// For local dev this is ignored; it only matters for the GitHub Pages build.
const REPO_NAME = "/MergeConflict/";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? REPO_NAME : "/",
});
