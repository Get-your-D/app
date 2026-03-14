import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["shared", "contracts"],
  output: "standalone",
};

export default nextConfig;
