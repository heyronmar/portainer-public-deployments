import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Native module: load it from node_modules at runtime instead of bundling.
  serverExternalPackages: ["better-sqlite3"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
