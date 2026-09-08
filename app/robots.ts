import type { MetadataRoute } from "next";

/**
 * แอพนี้ไม่มีระบบล็อกอิน ใครมี URL ก็เข้าได้
 * อย่างน้อยก็ห้าม search engine เก็บ index ไว้ จะได้ไม่มีใครค้นเจอโดยบังเอิญ
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
