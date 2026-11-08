import type { NextConfig } from "next";

// Browser only ever talks to ONE origin (this Next.js server) — API calls
// are proxied server-side to the backend. Same reasoning as nodedr-pos:
// this keeps the session cookie first-party, avoiding the cross-origin
// cookie fragility that broke that app's very first version. NOTE: Next
// bakes the rewrite destination at build time, so in Docker this must come
// from a build ARG, not a runtime env var (see nodedr-pos memory).
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4001";

// Baseline response headers for every page. A Content-Security-Policy is
// intentionally NOT set here: a strict script-src without a per-request nonce
// silently stops Next.js hydrating in production, so CSP needs a nonce
// middleware of its own. camera=(self) is kept for the order-ticket QR scanner.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Standalone output is strictly for Docker container self-hosting.
  // On Vercel, omitting standalone allows Vercel's Edge CDN to natively host,
  // optimize, and serve public/ static assets (like logo.png, icons, screenshots).
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "motion",
      "@tanstack/react-table",
      "@base-ui/react",
    ],
  },
  images: {
    localPatterns: [
      { pathname: "/**" },
    ],
    // WebP only: AVIF is smaller but slow to encode on a small restaurant PC.
    formats: ["image/webp"],
    // Uploaded files have random names and are never overwritten.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  // socket.io's endpoint is literally "/socket.io/" — the backend 404s on the
  // slash-less form, so Next must not redirect it.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      // Realtime push (socket.io) goes through the same origin too: in
      // production only this web server is reachable, never the backend's
      // own port. socket.io starts with long-polling, which proxies fine.
      // Literal first: an empty :path* would drop the trailing slash.
      { source: "/socket.io/", destination: `${BACKEND_URL}/socket.io/` },
      { source: "/socket.io/:path+", destination: `${BACKEND_URL}/socket.io/:path+` },
    ];
  },
};

export default nextConfig;
