export interface Org {
  id: string;
  name: string;
  slug: string;
  email: string;
  logo_url: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  org_id: string;
  name: string;
  date: string;
  description: string | null;
  template: CertTemplate;
  serial_prefix: string | null;
  expiry_date: string | null;
  form_fields: string[];
  co_logos: string[];
  signatories: Signatory[];
  cert_count: number;
  created_at: string;
}

export interface Cert {
  id: string;
  cert_id: string;
  event_id: string;
  org_id: string;
  fields: Record<string, string>;
  sha256_hash: string;
  status: 'active' | 'revoked' | 'expired';
  btc_proof: string | null;
  issued_at: string;
  revoked_at: string | null;
}

export interface Signatory {
  name: string;
  designation: string;
  organization: string | null;
  signatureType: 'typed' | 'draw' | 'upload';
  signatureData: string | null;
  signatureFont: string | null;
}

export type CertTemplate = 'classic' | 'dark' | 'neon' | 'minimal' | 'brutal' | 'retro' | 'corp' | 'midnight' | 'vintage';

export interface EmailLog {
  id: string;
  cert_id: string;
  org_id: string;
  to_email: string;
  subject: string | null;
  status: 'pending' | 'sent' | 'bounced' | 'failed';
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

export interface AnalyticsSummary {
  totalCerts: number;
  totalEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  certsByEvent: { eventName: string; count: number }[];
  emailsOverTime: { date: string; sent: number; opened: number }[];
}
