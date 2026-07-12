import { Metadata } from 'next';
import { IBM_Plex_Mono, Bebas_Neue, Dancing_Script, Pacifico, Caveat } from 'next/font/google';
import Providers from '@/components/layout/Providers';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-ibm-plex-mono',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas-neue',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-dancing-script',
});

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-caveat',
});

export const metadata: Metadata = {
  title: 'ZeroCert 🔏 | Blockchain-Anchored Credentials',
  description: 'Free, open, blockchain-anchored certificate platform for communities. Issue verifiable SHA-256 credentials for bootcamps, workshops, and events.',
  keywords: ['certificates', 'blockchain', 'credentials', 'verifiable', 'communities', 'free'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${ibmPlexMono.variable} ${bebasNeue.variable} ${dancingScript.variable} ${pacifico.variable} ${caveat.variable} min-h-screen bg-bg text-text selection:bg-accent selection:text-black font-mono relative`}
      >
        {/* Subtle grid background */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(26,26,50,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(26,26,50,0.6)_1px,transparent_1px)] bg-[size:52px_52px] pointer-events-none z-0 opacity-60" />
        
        {/* Top accent glow */}
        <div className="fixed top-[-300px] left-1/2 -translate-x-1/2 w-[900px] height-[600px] bg-[radial-gradient(ellipse,rgba(232,255,0,0.06)_0%,transparent_65%)] pointer-events-none z-0" />
        
        <ErrorBoundary>
          <Providers>
            <div className="relative z-10 min-h-screen flex flex-col">
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
