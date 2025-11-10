/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  output: 'standalone', // Add this for Docker
  generateBuildId: async () => {
    // Force new build ID to bust cache
    return `build-${Date.now()}`;
  },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
