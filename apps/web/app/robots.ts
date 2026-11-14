import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.kivo.futoragroup.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/solutions/*",
          "/compare/*",
          "/demo",
          "/demo/*",
          "/docs",
          "/docs/*",
          "/llms.txt",
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
          "Google-Extended",
          "Applebot-Extended",
          "Amazonbot",
          "Bytespider",
        ],
        allow: [
          "/",
          "/solutions/*",
          "/compare/*",
          "/demo",
          "/demo/*",
          "/docs",
          "/docs/*",
          "/llms.txt",
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
