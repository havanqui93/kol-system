import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/api/", "/projects/", "/settings/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://localhost:3000"}/sitemap.xml`,
  };
}
