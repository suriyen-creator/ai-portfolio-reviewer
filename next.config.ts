import type { NextConfig } from 'next';

// In development the FastAPI app runs on :8000 (npm run dev:api).
// On Vercel, vercel.json routes /api/* to the Python function instead.
const nextConfig: NextConfig = {
  // AI steps can exceed the dev proxy's default 30 s timeout.
  experimental: { proxyTimeout: 120_000 },
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' }]
      : [];
  },
};

export default nextConfig;
