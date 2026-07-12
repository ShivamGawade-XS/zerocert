import Link from 'next/link';
import NavBar from '@/components/layout/NavBar';
import { AppIconLogo } from '@/components/brand/Logos';

const pillars = [
  {
    emoji: '🆓',
    title: 'Free Certificate Exchange',
    body: 'Daily free courses, limited-time coupons, government certifications, university MOOCs, webinars, and virtual internships — all in one place.',
    href: '/exchange',
    cta: 'Browse Exchange →',
  },
  {
    emoji: '⭐',
    title: 'Certificate Value Ratings',
    body: 'Know if it\'s actually worth your time. Community-verified ratings for resume value, LinkedIn worthiness, recruiter impact, and authenticity.',
    href: '/exchange',
    cta: 'See Ratings →',
  },
  {
    emoji: '🗺️',
    title: 'Learning Roadmaps',
    body: 'Step-by-step career blueprints for Cybersecurity, Data Analytics, Cloud, and more — with curated certificate recommendations at every milestone.',
    href: '/roadmaps',
    cta: 'Explore Roadmaps →',
  },
  {
    emoji: '🧑‍💻',
    title: 'Learner Passport',
    body: 'Your public credential profile at certxchange.in/passport/you — a live portfolio of verified skills, achievement badges, and event timelines.',
    href: '/passport/demo',
    cta: 'Claim Your Passport →',
  },
  {
    emoji: '💼',
    title: 'Portfolio Showcase',
    body: 'Share your new certificates, resumes, and portfolios with the community for constructive feedback, upvotes, and peer code review.',
    href: '/showcase',
    cta: 'View Showcase →',
  },
  {
    emoji: '🏆',
    title: 'Opportunity Hub',
    body: 'Beyond certificates — discover internships, fellowships, scholarships, hackathons, campus ambassador roles, and open-source programs.',
    href: '/exchange?category=internship',
    cta: 'Find Opportunities →',
  },
  {
    emoji: '🔔',
    title: 'Smart Alerts',
    body: 'Never miss a deal. Filters for 🔥 Expires Today, 🆓 Free Today, 🎁 Coupon Drops, 🎓 Government, 🏆 Premium, and 🌍 International tracks.',
    href: '/exchange',
    cta: 'Set Alerts →',
  },
  {
    emoji: '🔗',
    title: 'Blockchain-Verified Issuance',
    body: 'Organizers can issue blockchain-anchored certificates with QR verification, custom signatories, co-logos, and email templates.',
    href: '/register',
    cta: 'Issue Certificates →',
  },
];

const stats = [
  { value: '8 Pillars', label: 'of skill growth' },
  { value: 'SHA-256', label: 'cryptographic proof' },
  { value: 'QR Verified', label: 'every credential' },
  { value: 'Public Passport', label: 'profile per learner' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Hero Section */}
      <section className="flex-1 px-6 md:px-14 pt-20 pb-28 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Brand logo icon */}
          <div className="mb-8">
            <AppIconLogo width="72" height="70" />
          </div>

          {/* Eyebrow tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1565FE]/30 bg-[#1565FE]/5 rounded-full text-[10px] font-mono text-[#1565FE] uppercase tracking-widest mb-8">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1565FE] animate-pulse" />
            India's Trusted Credential Network
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-7xl text-text uppercase tracking-wider leading-tight mb-6">
            The LinkedIn for<br />
            <span className="text-[#1565FE]">Verified Achievements</span>
          </h1>

          <p className="text-sm text-mutedHigh leading-relaxed max-w-2xl font-mono mb-10">
            CertXchange is where learners discover, verify, organize, and showcase skill credentials —
            certificates, hackathons, internships, and community contributions — all in one trusted network.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/exchange"
              className="px-7 py-3.5 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition duration-200 shadow-lg shadow-[#1565FE]/25"
            >
              Explore Exchange →
            </Link>
            <Link
              href="/passport/demo"
              className="px-7 py-3.5 border border-border hover:border-[#1565FE] bg-surface text-text font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition duration-200"
            >
              Claim Your Passport
            </Link>
            <Link
              href="/register"
              className="px-7 py-3.5 border border-border hover:border-accent bg-surface text-muted hover:text-text font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition duration-200"
            >
              Issue Certificates ↗
            </Link>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-border/30 pt-10 w-full">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl text-[#1565FE] uppercase tracking-wide mb-1">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted font-mono uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillar Cards Grid */}
      <section className="px-6 md:px-14 pb-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <div className="text-[#1565FE] text-[10px] tracking-widest uppercase mb-3 font-mono">✦ The CertXchange Network</div>
          <h2 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider">
            8 Pillars of<br />Skill Growth
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((p, idx) => (
            <Link
              key={p.title}
              href={p.href}
              className="group border border-border hover:border-[#1565FE] bg-surface hover:bg-surfaceHigh p-6 rounded-xl flex flex-col justify-between transition duration-200 h-full"
            >
              <div>
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="font-display text-lg text-text uppercase tracking-wide mb-3 group-hover:text-[#1565FE] transition">
                  {p.title}
                </h3>
                <p className="text-xs text-mutedHigh leading-relaxed font-mono">
                  {p.body}
                </p>
              </div>
              <div className="mt-6 text-[10px] text-[#1565FE] font-mono font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition duration-200">
                {p.cta}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Long-term Vision Strip */}
      <section className="px-6 md:px-14 py-20 border-t border-border/20 bg-surface/30 mx-0">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-[#1565FE] text-[10px] tracking-widest uppercase mb-4 font-mono">✦ Long-term Vision</div>
          <h2 className="font-display text-4xl md:text-5xl text-text uppercase tracking-wider mb-8">
            GitHub for Credentials & Learning
          </h2>
          <p className="text-sm text-mutedHigh leading-relaxed font-mono max-w-2xl mx-auto mb-12">
            Eventually: import certificates automatically, verify authenticity, generate a full portfolio website,
            create a resume from credentials, sync with LinkedIn, track learning streaks, and discover what to learn next.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { icon: '📜', text: 'Import Certificates' },
              { icon: '🔍', text: 'Verify Authenticity' },
              { icon: '🌐', text: 'Portfolio Website' },
              { icon: '📄', text: 'Certificate Resume' },
              { icon: '💼', text: 'LinkedIn Sync' },
              { icon: '🎯', text: 'Skill Recommendations' },
              { icon: '🔥', text: 'Learning Streaks' },
              { icon: '🗺️', text: 'Next Steps Guided' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 px-4 py-3 border border-border/50 bg-surface rounded-lg font-mono text-xs text-mutedHigh"
              >
                <span className="text-xl">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Final Banner */}
      <section className="px-6 md:px-14 py-24 max-w-5xl mx-auto w-full text-center">
        <h2 className="font-display text-4xl md:text-6xl text-text uppercase tracking-wider mb-6">
          Build Your Credible<br />
          <span className="text-[#1565FE]">Skill Portfolio</span> Today
        </h2>
        <p className="text-xs text-mutedHigh font-mono mb-10 max-w-lg mx-auto">
          Not just another certificate-sharing group.
          The trusted platform that answers: <em>"Is this certificate actually worth my time?"</em>
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/exchange"
            className="px-8 py-4 bg-[#1565FE] hover:bg-[#0D47C9] text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition duration-200 shadow-lg shadow-[#1565FE]/25"
          >
            Start Exploring Exchange →
          </Link>
          <Link
            href="/roadmaps"
            className="px-8 py-4 border border-border hover:border-[#1565FE] bg-surface text-text font-mono text-xs font-bold tracking-widest uppercase rounded-lg transition duration-200"
          >
            View Career Roadmaps
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 px-6 py-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono text-muted">
          <div className="flex items-center gap-2">
            <AppIconLogo width="22" height="21" />
            <span className="text-text font-bold uppercase tracking-wider">CertXchange</span>
            <span className="text-muted">— India's Trusted Credential Network</span>
          </div>
          <div className="flex flex-wrap gap-5 justify-center text-muted">
            <Link href="/exchange" className="hover:text-text transition">Exchange</Link>
            <Link href="/roadmaps" className="hover:text-text transition">Roadmaps</Link>
            <Link href="/showcase" className="hover:text-text transition">Showcase</Link>
            <Link href="/verify" className="hover:text-text transition">Verify</Link>
            <Link href="/register" className="hover:text-text transition">Issue Certificates</Link>
            <Link href="/login" className="hover:text-text transition">Admin Login</Link>
          </div>
          <div className="text-muted text-[9px]">
            © {new Date().getFullYear()} CertXchange. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
