import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Lets a second dev/test server run alongside `npm run dev` without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',
  },
  serverExternalPackages: ['mongoose'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
        ],
      },
      // Keep the dashboard and API out of search results.
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
      { source: '/seed/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000' }] },
    ];
  },
};

export default nextConfig;
