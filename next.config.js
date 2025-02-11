/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Removed worker-loader rule to use Next.js built-in worker support
    return config;
  },
};

module.exports = nextConfig;