/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: "worker-loader" },
    });
    return config;
  },
};

module.exports = nextConfig;
