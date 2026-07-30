/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack(config, { isServer }) {
    // sharp uses native binaries that don't exist in Vercel's build environment
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp']
    }

    config.watchOptions = {
      ignored: [
        '**/build/**',
        '**/*.log',
        '**/tmp/**',
      ],
    }
    return config
  },
}

export default nextConfig
