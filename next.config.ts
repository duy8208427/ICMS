import type { NextConfig } from "next";

const lanDevHosts = ["127.0.0.1", "localhost", "172.31.98.244", "100.90.194.83"];

const nextConfig: NextConfig = {
  allowedDevOrigins: lanDevHosts,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: lanDevHosts.flatMap((host) => [host, `${host}:3000`]),
    },
  },
};

export default nextConfig;
