'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { org, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navItems = [
    { label: 'Verify', href: '/verify' },
    ...(org
      ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Bulk Issue', href: '/bulk-issue' },
          { label: 'Analytics', href: '/analytics' },
        ]
      : []),
  ];

  return (
    <nav className="px-7 border-b border-border flex justify-between items-center bg-bg/90 backdrop-blur-md sticky top-0 z-50 h-[52px]">
      <Link href="/" className="font-display text-xl md:text-2xl text-accent tracking-widest flex items-center gap-2 select-none">
        <span className="bg-accent text-black px-2 py-0.5 text-base md:text-lg font-bold">ZC</span>
        <span className="text-text">ZEROCERT</span>
      </Link>
      
      <div className="flex gap-1 md:gap-3 items-center h-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[10px] md:text-xs tracking-wider uppercase px-3 py-1.5 border-b-2 transition duration-150 ${
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
            className="ml-3 px-3 py-1.5 border border-err/30 hover:border-err text-err hover:bg-err/5 font-mono text-[10px] md:text-xs font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="ml-3 px-3 py-1.5 bg-accent hover:bg-accentH text-black font-mono text-[10px] md:text-xs font-bold tracking-wider uppercase rounded transition duration-150"
          >
            Admin →
          </Link>
        )}
      </div>
    </nav>
  );
}
