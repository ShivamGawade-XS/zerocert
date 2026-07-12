'use client';

import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { Shield, Mail, Database, Zap, Cpu, Award } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

export default function LandingPage() {
  const { setOrg } = useAuthStore();

  // Try to load user session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then((data) => {
        if (data.authenticated && data.org) {
          setOrg(data.org);
        } else {
          setOrg(null);
        }
      })
      .catch(() => {
        setOrg(null);
      });
  }, [setOrg]);

  const features = [
    {
      icon: <Award className="w-6 h-6 text-accent" />,
      title: '9 Visual Templates',
      desc: 'Classic Gold, Dark Prestige, Neon Cyber, Pure Minimal, Brutalist, RetroWave, and more. Live preview.',
    },
    {
      icon: <Database className="w-6 h-6 text-accent" />,
      title: 'Multi-Org Collaboration',
      desc: 'Collaborate with partner organizations. All logos render side-by-side on certificates.',
    },
    {
      icon: <Cpu className="w-6 h-6 text-accent" />,
      title: 'Cryptographic Integrity',
      desc: 'SHA-256 fingerprinting and digital signatures ensure certificates cannot be forged or tampered.',
    },
    {
      icon: <Zap className="w-6 h-6 text-accent" />,
      title: 'Bulk Email Engine',
      desc: 'Upload CSV, map dynamic variables, and send beautifully formatted credentials instantly.',
    },
    {
      icon: <Shield className="w-6 h-6 text-accent" />,
      title: 'OpenTimestamps Anchoring',
      desc: 'Provable anchoring to the Bitcoin blockchain calendar for immutable timestamps.',
    },
    {
      icon: <Mail className="w-6 h-6 text-accent" />,
      title: 'Live Tracking & Analytics',
      desc: 'Real-time dashboard tracking delivery rates, open rates, clicks, and bounce diagnostics.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-accent/20 bg-accent/5 text-accent text-[10px] tracking-widest uppercase rounded mb-8 animate-pulse">
          ✦ Production Ready Enterprise Edition
        </div>
        
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-text leading-none mb-6">
          FREE. SECURE.<br />
          <span className="text-accent text-glow">BLOCKCHAIN VERIFIED.</span>
        </h1>
        
        <p className="font-mono text-xs md:text-sm text-mutedHigh max-w-2xl mx-auto mb-10 leading-relaxed">
          Issue tamper-proof, cryptographic certificates for bootcamps, hackathons, and workshops. Zero cost. Zero gas fees. Enterprise-grade database security.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center mb-24">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-widest uppercase rounded transition duration-150 accent-glow"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/verify"
            className="w-full sm:w-auto px-8 py-3 border border-border hover:border-borderHigh bg-surface/50 text-text font-mono text-xs font-bold tracking-widest uppercase rounded transition duration-150"
          >
            Verify a Certificate
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-border/50 border border-border p-1 w-full text-left mb-16">
          {features.map((f, i) => (
            <div key={i} className="bg-surface p-6 flex flex-col justify-between hover:border-borderHigh transition duration-150">
              <div>
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-text mb-2">{f.title}</h3>
                <p className="font-mono text-[11px] text-mutedHigh leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-muted font-mono text-[10px] z-10">
        &copy; {new Date().getFullYear()} ZeroCert. Licensed under MIT. Secured with Supabase.
      </footer>
    </div>
  );
}
