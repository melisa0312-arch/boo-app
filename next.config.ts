import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // Next.js logs Server Function arguments in development unless explicitly disabled.
  logging: { serverFunctions: false, incomingRequests: { ignore: [/^\/join(?:\?|$)/] } },
  // Allow local browser checks; add an exact forwarded preview hostname when one is provided.
  allowedDevOrigins: ["127.0.0.1", ...(process.env.BU_PREVIEW_ALLOWED_ORIGINS ?? "").split(",").map((host) => host.trim()).filter(Boolean)],
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      // Web Preview embeds the development server. Keep clickjacking protection in production.
      ...(process.env.NODE_ENV === "production" ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
