export function Footer() {
  const socials = [
    { name: 'Facebook', href: 'https://www.facebook.com/share/1DwDCti87Y/', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.84c0-2.5 1.5-3.89 3.8-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.86h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg>
    )},
    { name: 'Instagram', href: 'https://instagram.com/d7leos', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.51 5.51 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm5.75-3a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z"/></svg>
    )},
    { name: 'TikTok', href: 'https://tiktok.com/@d7leos', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M14 3c.4 2.1 1.9 3.7 4 4v2.5c-1.5 0-2.9-.5-4-1.3V15a6 6 0 1 1-6-6c.4 0 .8 0 1.1.1v2.7A3.5 3.5 0 1 0 11.5 17V3H14Z"/></svg>
    )},
    { name: 'LinkedIn', href: 'https://linkedin.com/company/leo-district-306-d7', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V23h-4V8zm7 0h3.84v2.05h.05c.53-1 1.84-2.05 3.78-2.05 4.04 0 4.78 2.66 4.78 6.13V23h-4v-6.64c0-1.58-.03-3.61-2.2-3.61-2.2 0-2.53 1.72-2.53 3.5V23h-4V8z"/></svg>
    )},
    { name: 'YouTube', href: 'https://youtube.com/@leodistrict306d7?si=fjIsqBqYMdAeiJEc', icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path fill="currentColor" d="M23.5 7.5a3.5 3.5 0 0 0-2.46-2.46C19.1 4.5 12 4.5 12 4.5s-7.1 0-9.04.54A3.5 3.5 0 0 0 .5 7.5 36.5 36.5 0 0 0 0 12a36.5 36.5 0 0 0 .5 4.5 3.5 3.5 0 0 0 2.46 2.46C4.9 19.5 12 19.5 12 19.5s7.1 0 9.04-.54A3.5 3.5 0 0 0 23.5 16.5 36.5 36.5 0 0 0 24 12a36.5 36.5 0 0 0-.5-4.5ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z"/></svg>
    )},
  ];

  return (
    <footer className="mt-12" role="contentinfo">
      <div className="container mx-auto px-4 py-10 surface-card rounded-t-2xl text-center text-sm">
        <nav aria-label="Social media links" className="mb-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow us on ${s.name} (opens in new tab)`}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/10 hover:border-white/20 text-rose hover:text-amberD7 transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </nav>
        
        <div className="space-y-2">
          <p className="opacity-80">
            © {new Date().getFullYear()} Leo District 306 D7. All rights reserved.
          </p>
          <p className="text-xs opacity-60">
            Fostering leadership through service across Colombo and Ratnapura districts.
          </p>
        </div>
        
        {/* Contact information for screen readers */}
        <div className="sr-only">
          <h2>Contact Information</h2>
          <p>Email: leodistrict306d7@gmail.com</p>
          <p>Phone: +94776243300</p>
        </div>
      </div>
    </footer>
  );
}