import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@alerts-shelters/shared"],
};

export default config;
