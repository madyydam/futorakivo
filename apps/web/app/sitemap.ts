import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://kivo.futora.com";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/demo", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/demo/pos", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/demo/kds", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/demo/orders", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/demo/tables", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/demo/menu", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/demo/reports", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/docs", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/api", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/compliance-india", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/docs/accessibility", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/onboarding", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/signup", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
