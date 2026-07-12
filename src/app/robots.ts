import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerocert.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/verify', '/events/'],
        disallow: ['/api/', '/dashboard', '/login'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
