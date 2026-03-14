import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["web-shared"],
  output: "standalone",
};

export default nextConfig;
