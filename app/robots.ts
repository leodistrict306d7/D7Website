import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/*']
    },
    sitemap: 'https://d7leos.org/sitemap.xml',
    host: 'https://d7leos.org',
  };
}