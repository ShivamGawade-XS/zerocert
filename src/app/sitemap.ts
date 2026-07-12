import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zerocert.app';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${appUrl}/verify`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${appUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Dynamic certificate verification pages
  let certPages: MetadataRoute.Sitemap = [];
  try {
    const { data: certs } = await supabaseAdmin
      .from('certs')
      .select('cert_id, issued_at')
      .eq('status', 'active')
      .order('issued_at', { ascending: false })
      .limit(5000); // Cap at 5000 for sitemap size limits

    if (certs) {
      certPages = certs.map((cert) => ({
        url: `${appUrl}/verify?id=${encodeURIComponent(cert.cert_id)}`,
        lastModified: new Date(cert.issued_at),
        changeFrequency: 'yearly' as const,
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.error('Sitemap generation error (certs):', err);
  }

  // Dynamic event claim pages
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, date')
      .order('date', { ascending: false })
      .limit(2000);

    if (events) {
      eventPages = events.map((event) => ({
        url: `${appUrl}/events/${event.id}`,
        lastModified: new Date(event.date),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('Sitemap generation error (events):', err);
  }

  return [...staticPages, ...certPages, ...eventPages];
}
