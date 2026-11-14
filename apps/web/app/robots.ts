import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://kivo.futora.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/demo",
          "/demo/*",
          "/docs",
          "/docs/*",
          "/login",
          "/signup",
          "/onboarding",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/pos",
          "/kds",
          "/inventory",
          "/inventory/*",
          "/orders",
          "/orders/*",
          "/tables",
          "/reservations",
          "/customers",
          "/customers/*",
          "/delivery",
          "/attendance",
          "/accounting",
          "/reports",
          "/marketing",
          "/operations",
          "/team",
          "/my-deliveries",
          "/settings",
          "/settings/*",
          "/super-admin",
          "/customer-display",
          "/kiosk/*",
          "/order/*",
          "/api/*",
        ],
      },
      // AI Search & Answer Engine Crawlers (AEO / GEO Optimization)
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
        ],
        allow: [
          "/",
          "/demo",
          "/demo/*",
          "/docs",
          "/docs/*",
        ],
        disallow: [
          "/dashboard/*",
          "/kiosk/*",
          "/order/*",
          "/api/*",
          "/super-admin",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
