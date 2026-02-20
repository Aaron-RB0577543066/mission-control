/** @type {import('next').NextConfig} */
const nextConfig = {
  // ws is used server-side in API routes
  experimental: {
    serverComponentsExternalPackages: ["ws"],
  },
};

export default nextConfig;
