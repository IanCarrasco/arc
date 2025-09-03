import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional: Add rewrites for cleaner API calls
  async rewrites() {
    return [
      {
        source: '/api/arxiv-proxy/:path*',
        destination: 'https://arxiv.org/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push(
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    );
    return config;
  },
  // Optional: Add headers for better CORS handling
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
