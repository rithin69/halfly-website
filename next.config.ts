import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is static: build plain files into out/ (served by Cloudflare as static assets, see wrangler.jsonc).
  output: "export",
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
