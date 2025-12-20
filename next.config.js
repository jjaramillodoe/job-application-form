/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  env: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    DOWNLOAD_PASSWORD: process.env.DOWNLOAD_PASSWORD,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Add empty turbopack config to silence the warning
  // The webpack config will still be used when needed
  turbopack: {},
}

module.exports = nextConfig 