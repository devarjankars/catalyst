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
    // ── Externalize heavy native packages so they are NOT bundled ──────────
    // Next.js 14 uses experimental.serverComponentsExternalPackages (not the
    // top-level serverExternalPackages key which belongs to Next.js 15+).
    serverComponentsExternalPackages: [
      '@sparticuz/chromium-min',
      '@sparticuz/chromium',
      'playwright-core',
      'playwright',
    ],

    missingSuspenseWithCSRBailout: false,

    // Target the exact API route so only that Lambda gets the chromium files
    // traced into its output bundle.
    outputFileTracingIncludes: {
      '/api/generate-pdf': ['./node_modules/@sparticuz/chromium-min/**/*'],
    },
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  webpack(config, { isServer, dev }) {
    // Stabilise module IDs so chunk references are consistent across
    // parallel build workers — fixes intermittent chunk-not-found errors.
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
      }
    }

    // These packages use native Node.js binaries — must NOT be bundled into
    // any webpack chunk. Required at runtime by the API route only.
    const nativeExternals = [
      'sharp',
      '@sparticuz/chromium',
      '@sparticuz/chromium-min',
      'playwright-core',
      'playwright',
    ];

    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        ...nativeExternals,
      ];
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

export default (phase) => {
  const distDir =
    process.env.VERCEL === '1' || phase === PHASE_DEVELOPMENT_SERVER
      ? '.next'
      : 'build'

  return { ...nextConfig, distDir }
}
