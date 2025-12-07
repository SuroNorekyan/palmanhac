import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ppu278ldjw73w4bn.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "palmanhac-shop.pt",
      },
      {
        protocol: "https",
        hostname: "www.palmanhac-shop.pt",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
