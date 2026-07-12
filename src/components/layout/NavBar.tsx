'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

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
    <nav className="px-6 md:px-8 border-b border-border bg-bg/90 backdrop-blur-md sticky top-0 z-50 h-[56px] flex justify-between items-center select-none">
      {/* Brand logo */}
      <Link href="/" onClick={() => setIsOpen(false)} className="font-display text-xl md:text-2xl text-accent tracking-widest flex items-center gap-2">
        <span className="bg-accent text-black px-2 py-0.5 text-base md:text-lg font-bold">ZC</span>
        <span className="text-text">ZEROCERT</span>
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex gap-4 items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-xs tracking-wider uppercase px-3 py-2 border-b-2 transition duration-150 ${
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
            className="ml-3 px-3 py-1.5 border border-err/30 hover:border-err text-err hover:bg-err/5 font-mono text-xs font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="ml-3 px-3 py-1.5 bg-accent hover:bg-accentH text-black font-mono text-xs font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Admin →
          </Link>
        )}
      </div>

      {/* Mobile Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-muted hover:text-text focus:outline-none"
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
        <div className="absolute top-[56px] left-0 right-0 bg-bg border-b border-border p-5 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-4 duration-150 z-50">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`font-mono text-sm tracking-wider uppercase py-2 border-l-2 pl-3 transition ${
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
              className="w-full text-left py-2 border-l-2 border-transparent pl-3 text-err font-mono text-sm font-bold tracking-wider uppercase transition"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 bg-accent hover:bg-accentH text-black font-mono text-sm font-bold tracking-wider uppercase rounded transition"
            >
              Admin →
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
