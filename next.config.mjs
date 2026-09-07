import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js'

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
  // All pages use client-side APIs (sessionStorage, DnD, router) — skip
  // static prerendering entirely so `next build` succeeds.
  experimental: {
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack(config, { isServer, dev }) {
    // Stabilise module IDs so chunk references are consistent across
    // parallel build workers — fixes intermittent
    // "Cannot find module for page" errors.
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
    }

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

export default (phase) => ({
  ...nextConfig,
  // Keep production builds from overwriting a running development server's chunks.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next' : 'build',
})
