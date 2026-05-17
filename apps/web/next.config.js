/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kol/database", "@kol/agents", "@kol/providers", "@kol/queue", "@kol/publisher"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
    ],
  },
};

module.exports = nextConfig;
