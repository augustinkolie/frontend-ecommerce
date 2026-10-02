import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const apiPublic = new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:4000");
const s3Public = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL) : null;

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiPublic.origin}${s3Public ? ` ${s3Public.origin}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Image Docker de production minimale (node server.js), sans effet en développement.
  output: "standalone",
  // Dossier de build séparé possible (mesures de performance pendant que le serveur de dev tourne).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    remotePatterns: [
      { protocol: apiPublic.protocol.replace(":", "") as "http" | "https", hostname: apiPublic.hostname, port: apiPublic.port, pathname: "/uploads/**" },
      ...(s3Public ? [{ protocol: "https" as const, hostname: s3Public.hostname, pathname: "/**" }] : []),
    ],
    // Dev : le backend tourne sur localhost. En production, images servies par S3/CDN.
    dangerouslyAllowLocalIP: isDev,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
