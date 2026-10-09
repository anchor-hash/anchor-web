import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://getanchorhealth.app', lastModified: new Date() }]
}
