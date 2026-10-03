import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://d7leos.org';
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/lms`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/council`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/analytics`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}