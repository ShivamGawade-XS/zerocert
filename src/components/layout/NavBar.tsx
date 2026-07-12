'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { HorizontalLogo } from '@/components/brand/Logos';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { org, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  const navItems = [
    { label: 'Verify', href: '/verify' },
    { label: 'Exchange', href: '/exchange' },
    { label: 'Roadmaps', href: '/roadmaps' },
    { label: 'Showcase', href: '/showcase' },
    ...(org
      ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Bulk Issue', href: '/bulk-issue' },
          { label: 'Analytics', href: '/analytics' },
          { label: 'Settings', href: '/dashboard/settings' },
        ]
      : []),
  ];

  return (
    <nav className="px-6 md:px-8 border-b border-border bg-bg/90 backdrop-blur-md sticky top-0 z-50 h-[64px] flex justify-between items-center select-none">
      {/* Brand logo */}
      <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
        <HorizontalLogo width="130" height="52" className="text-accent" />
      </Link>

      {/* Desktop navigation */}
      <div className="hidden xl:flex gap-2 items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[11px] tracking-wider uppercase px-2.5 py-2 border-b-2 transition duration-150 ${
                isActive
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text hover:border-borderHigh'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {org ? (
          <button
            onClick={handleLogout}
            className="ml-3 px-3 py-1.5 border border-err/30 hover:border-err text-err hover:bg-err/5 font-mono text-[10px] font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="ml-3 px-3 py-1.5 bg-accent hover:bg-accentH text-black font-mono text-[10px] font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Admin →
          </Link>
        )}
      </div>

      {/* Mobile Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden p-2 text-muted hover:text-text focus:outline-none"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
          {isOpen ? (
            <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
          ) : (
            <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
          )}
        </svg>
      </button>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="absolute top-[64px] left-0 right-0 bg-bg border-b border-border p-5 flex flex-col gap-3 xl:hidden animate-in fade-in slide-in-from-top-4 duration-150 z-50">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`font-mono text-xs tracking-wider uppercase py-2 border-l-2 pl-3 transition ${
                  isActive ? 'border-accent text-accent font-bold' : 'border-transparent text-muted'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {org ? (
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 border-l-2 border-transparent pl-3 text-err font-mono text-xs font-bold tracking-wider uppercase transition"
            >
              Logout
            </button>
          ) : (
            <Link
              onClick={() => setIsOpen(false)}
              href="/login"
              className="w-full text-center py-2 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-wider uppercase rounded transition"
            >
              Admin →
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
