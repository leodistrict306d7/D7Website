"use client";
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggleButton } from './theme-toggle';
import { useState } from 'react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  // Single source of truth for nav link order
  const links = [
    { href: '/about', label: 'About' },
    { href: '/council', label: 'Council' },
    { href: '/projects', label: 'Projects' },
    { href: '/lms', label: 'LMS' },
    { href: '/all-rounders', label: 'D7 All-Rounders' },
    { href: '/ascent', label: 'Ascent' },
    { href: '/merch', label: 'Merch' },
  ];

  const NavLinks = () => (
    <>
      {links.map((l) => (
        <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
          {l.label}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur">
      <div className="container mx-auto px-4 py-3 surface-card rounded-b-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logos/dp.png" alt="D7" className="h-8 w-8 object-contain" width={32} height={32} />
            <span className="font-semibold tracking-wide">Leo District 306 D7</span>
          </Link>
          <nav id="navigation" className="hidden md:flex items-center gap-5 text-sm" aria-label="Main navigation">
            <NavLinks />
            <ThemeToggleButton />
          </nav>
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggleButton />
            <button 
              aria-label="Menu" 
              aria-expanded={open}
              className="p-2 rounded border border-white/20" 
              onClick={() => setOpen(v => !v)}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
        <nav 
          className={`md:hidden transition-all duration-300 ease-out ${
            open ? 'max-h-[60vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
          aria-label="Mobile navigation"
        >
          <div className="mt-4 pb-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-base font-medium rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}