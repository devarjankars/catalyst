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
  // output: 'export',
  // trailingSlash: "true",
  distDir: 'build',
  webpack(config) {
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
