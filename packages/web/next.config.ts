import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["shared", "contracts"],
  output: "standalone",
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
