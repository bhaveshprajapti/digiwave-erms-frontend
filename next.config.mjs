/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress dev console logs
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.devtool = 'hidden-source-map';
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ]
  },
}

export default nextConfig
