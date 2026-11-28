import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.AUTH_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
    return [
      { source: "/api/auth/:path*", destination: `${backend}/api/auth/:path*` },
      { source: "/api/admin/:path*", destination: `${backend}/api/admin/:path*` }
    ];
  }
};

export default nextConfig;
