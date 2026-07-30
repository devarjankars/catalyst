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
 
  distDir: 'build',
  trailingSlash: true,
  webpack(config, { isServer }) {
    // sharp uses native binaries that don't exist in Vercel's build environment
    if (isServer) {
      config.externals = [...(config.externals || []), 'sharp']
    }

    config.watchOptions = {
      ignored: [
        '**/build/**',   // ignore Next.js output
        '**/*.log',      // ignore log files
        '**/tmp/**',     // ignore tmp files
      ],
    }
    return config
  },
}

export default nextConfig
