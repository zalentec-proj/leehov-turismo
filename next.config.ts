import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/media/**": [
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/images/loader.ts",
    deviceSizes: [360, 430, 640, 768, 1024, 1280, 1600],
    imageSizes: [48, 64, 96, 128, 256, 384],
    qualities: [78, 86],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "awfcyrpuzhovxixzpqzv.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
  async headers() {
    const commonHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];
    const productionHeaders = isProduction
      ? [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "img-src 'self' data: blob: https://awfcyrpuzhovxixzpqzv.supabase.co https://i.ytimg.com https://www.facebook.com https://embedsocial.com",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://connect.facebook.net https://embedsocial.com",
              "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://embedsocial.com",
              "media-src 'self' https:",
              "connect-src 'self' https://awfcyrpuzhovxixzpqzv.supabase.co wss://awfcyrpuzhovxixzpqzv.supabase.co https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com https://embedsocial.com",
              "upgrade-insecure-requests",
              "block-all-mixed-content",
            ].join("; "),
          },
        ]
      : [];
    return [{ source: "/:path*", headers: [...commonHeaders, ...productionHeaders] }];
  },
};

export default nextConfig;
