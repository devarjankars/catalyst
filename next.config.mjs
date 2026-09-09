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

  // ── Externalize heavy native packages so they are NOT bundled ──────────────
  // (moved out of experimental — this is the correct key in Next.js 14+)
  serverExternalPackages: ['@sparticuz/chromium-min', '@sparticuz/chromium', 'playwright-core'],

  // All pages use client-side APIs (sessionStorage, DnD, router) — skip
  // static prerendering entirely so `next build` succeeds.
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Target the exact API route so only that Lambda gets the chromium files
    // traced into its output bundle.  '/*' is not a valid route pattern and
    // caused the binary to be silently dropped on Vercel.
    outputFileTracingIncludes: {
      '/api/generate-pdf': ['./node_modules/@sparticuz/chromium-min/**/*'],
    },
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
      config.externals = [
        ...(config.externals || []),
        'sharp',
        '@sparticuz/chromium',
        '@sparticuz/chromium-min',
        'playwright-core',
      ]
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
  // Vercel expects .next; isolate only local production builds from next dev.
  distDir: process.env.VERCEL === '1' || phase === PHASE_DEVELOPMENT_SERVER ? '.next' : 'build',
})
