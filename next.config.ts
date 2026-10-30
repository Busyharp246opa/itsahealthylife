import type { NextConfig } from "next";

const exerciseMediaBaseUrl = process.env.EXERCISE_MEDIA_BASE_URL?.trim();
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];

if (exerciseMediaBaseUrl?.startsWith("http://") || exerciseMediaBaseUrl?.startsWith("https://")) {
  const mediaUrl = new URL(exerciseMediaBaseUrl);
  remotePatterns.push({
    protocol: mediaUrl.protocol === "https:" ? "https" : "http",
    hostname: mediaUrl.hostname,
    port: mediaUrl.port,
    pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**`,
  });
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async rewrites() {
    return { beforeFiles: [
      { source: "/", destination: "/landing/index.html" },
      { source: "/about", destination: "/landing/about.html" },
    ] };
  },
};

export default nextConfig;
