"use client";
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const ReCAPTCHA = dynamic<any>(() => import('react-google-recaptcha'), { ssr: false });
const partnerLogos = [
  { src: '/logos/lion.png', alt: 'Lions Clubs International' },
  { src: '/logos/leo.png', alt: 'LEO' },
  { src: '/logos/srilanka.png', alt: 'Leos of Sri Lanka and Maldives' },
  { src: '/logos/mdp.png', alt: 'Multiple District President' },
  { src: '/logos/council.png', alt: 'District Council' },
  { src: '/logos/dp.png', alt: 'District President' },
];

const slides = [
  '/images/mdphero.jpeg',
  '/images/hero1.jpg',
  '/images/hero2.jpg',
  '/images/hero3.jpg',
  '/images/hero4.jpeg',
  '/images/hero5.jpg',
  '/images/hero6.jpeg',
  '/images/hero7.jpeg',
];

const installationStart = Date.UTC(2026, 9, 4, 3, 30);
const installationEnd = Date.UTC(2026, 9, 4, 18, 30);

type InstallationCountdown = {
  phase: 'upcoming' | 'today' | 'past';
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const [installationCountdown, setInstallationCountdown] = useState<InstallationCountdown | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  // Contact form state
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [contactError, setContactError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [recaptchaTheme, setRecaptchaTheme] = useState<'light'|'dark'>('light');
  const [recaptchaSize, setRecaptchaSize] = useState<'normal'|'compact'>('normal');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIndex((currentIndex) => (currentIndex + 1) % slides.length);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [index]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((installationStart - now) / 1000));

      setInstallationCountdown({
        phase: now < installationStart ? 'upcoming' : now < installationEnd ? 'today' : 'past',
        days: Math.floor(remaining / 86400),
        hours: Math.floor((remaining % 86400) / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      });
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(countdownInterval);
  }, []);

  // Adapt reCAPTCHA theme and size
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setRecaptchaTheme(isDark ? 'dark' : 'light');
    };
    updateTheme();
    const mo = new MutationObserver(updateTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mq = window.matchMedia('(max-width: 420px)');
    const updateSize = () => setRecaptchaSize(mq.matches ? 'compact' : 'normal');
    updateSize();
    mq.addEventListener?.('change', updateSize);

    return () => {
      mo.disconnect();
      mq.removeEventListener?.('change', updateSize);
    };
  }, []);

  // Touch handlers for hero slideshow
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = touchStartX.current;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;
    touchStartX.current = 0;
    touchEndX.current = 0;
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swipe left - next slide
        setIndex((prev) => (prev + 1) % slides.length);
      } else {
        // Swipe right - previous slide
        setIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero with background slideshow */}
      <div 
        className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden rounded-3xl glass"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Image src={src} alt="District event" fill className="object-cover select-none" draggable={false} priority={i === 0} />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="heading-serif text-3xl sm:text-5xl md:text-6xl font-bold text-white whitespace-normal">
            Leo District 306 D7
          </h1>
          <p className="mt-4 text-white/90 max-w-2xl">Fostering leadership through service by empowering youth, building communities, and creating impact.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-2">
            <a href="/projects" className="w-full sm:w-auto px-5 py-2 rounded-lg btn-secondary font-semibold transition">Explore Projects</a>
            <a href="/lms" className="w-full sm:w-auto px-5 py-2 rounded-lg btn-primary transition">Login to LMS</a>
            <a href="https://forms.gle/NK8PtVKqZAapSUft5" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-5 py-2 rounded-lg bg-maroon text-white hover:bg-maroon-700 transition">Join Us</a>
          </div>
        </div>
      </div>

      {/* Seamless looping carousel of partner logos */}
      <div className="surface-card rounded-2xl p-4 overflow-hidden">
        <div className="relative w-full mask-fade-x">
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {/* First set of logos */}
            {partnerLogos.map((logo, index) => (
              <div key={`set1-${index}`} className="relative flex-shrink-0 mx-8 h-14 md:h-16 w-32">
                <Image src={logo.src} alt={logo.alt} fill className="object-contain opacity-95 hover:opacity-100 transition" sizes="128px" />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {partnerLogos.map((logo, index) => (
              <div key={`set2-${index}`} className="relative flex-shrink-0 mx-8 h-14 md:h-16 w-32">
                <Image src={logo.src} alt={logo.alt} fill className="object-contain opacity-95 hover:opacity-100 transition" sizes="128px" />
              </div>
            ))}
            {/* Third set to ensure no gaps */}
            {partnerLogos.map((logo, index) => (
              <div key={`set3-${index}`} className="relative flex-shrink-0 mx-8 h-14 md:h-16 w-32">
                <Image src={logo.src} alt={logo.alt} fill className="object-contain opacity-95 hover:opacity-100 transition" sizes="128px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Installation Countdown */}
      <section className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-[#180b12] via-[#2b0c19] to-[#10090e] p-6 md:p-10 text-white min-h-[300px] flex items-center">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-maroon/30 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
          <div className="text-center md:text-left space-y-3 max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold tracking-wider uppercase">
              Leo District 306 D7
            </div>
            <h2 className="heading-serif text-3xl md:text-5xl font-bold text-gold">
              {installationCountdown?.phase === 'today'
                ? 'Today is the Day!'
                : installationCountdown?.phase === 'past'
                  ? 'Installation Day has passed'
                  : 'Installation Countdown'}
            </h2>
            <p className="text-white/85 text-lg leading-relaxed">
              {installationCountdown?.phase === 'today'
                ? 'Today we celebrate the installation of Leo District 306 D7.'
                : installationCountdown?.phase === 'past'
                  ? 'Thank you for celebrating this milestone with us.'
                  : 'The countdown is on for the installation of Leo District 306 D7.'}
            </p>
            <p className="text-gold/90 font-semibold">October 4, 2026</p>
          </div>
          {installationCountdown?.phase === 'upcoming' && (
            <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full md:w-auto" aria-label="Time remaining until installation">
              {[
                { label: 'Days', value: installationCountdown.days },
                { label: 'Hours', value: installationCountdown.hours },
                { label: 'Minutes', value: installationCountdown.minutes },
                { label: 'Seconds', value: installationCountdown.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0 rounded-xl border border-white/15 bg-black/25 px-2 py-4 sm:px-4 text-center backdrop-blur-sm">
                  <div className="text-2xl sm:text-4xl font-bold tabular-nums text-gold">{String(value).padStart(2, '0')}</div>
                  <div className="mt-1 text-xs sm:text-sm text-white/75">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Key numbers with animated counters */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="stats">
        {[
          { label: 'Clubs', value: 37 },
          { label: 'Members', value: 2000 },
          { label: 'Projects', value: 108 },
          { label: 'Beneficiaries Served', value: 2490 }
        ].map((item) => (
          <CounterCard key={item.label} {...item} />
        ))}
      </section>

      {/* District Directory */}
      <section className="glass rounded-2xl p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 text-left md:max-w-2xl">
            <p className="uppercase tracking-wider text-sm opacity-70">District Resources</p>
            <h2 className="heading-serif text-3xl md:text-4xl font-bold">District Directory</h2>
            <p className="opacity-80 leading-relaxed">
              Explore the latest District 306 D7 directory to connect with club leaders, council members, and key contacts across the district.
            </p>
          </div>
          <div className="flex md:justify-end md:flex-shrink-0">
            <a
              href="https://heyzine.com/flip-book/6ac000f48c.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-lg btn-primary font-semibold transition"
            >
              View District Directory
            </a>
          </div>
        </div>
      </section>

      {/* Stay Updated */}
      <NewsletterCard />

      {/* Get in Touch */}
      <section className="glass rounded-2xl p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <p className="uppercase tracking-wider text-sm opacity-70">Stay connected</p>
            <h2 className="heading-serif text-3xl md:text-4xl font-bold">Get in Touch</h2>
            <p className="opacity-80 leading-relaxed">If you have inquiries or need assistance, feel free to contact the District leadership. We are here to help and guide you.</p>

            <div className="mt-4 grid gap-3">
              <a href="tel:+94776243300" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-white/10 border border-white/20 hover:bg-white/15 transition">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gold/20 text-gold">
                  {/* Phone icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.003 5.884c-.06-1.05.78-1.94 1.83-1.94h2.4c.9 0 1.67.64 1.82 1.53l.37 2.1c.13.73-.22 1.47-.85 1.84l-1.26.73c.98 1.92 2.56 3.5 4.48 4.48l.73-1.26c.37-.63 1.11-.98 1.84-.85l2.1.37c.89.15 1.53.92 1.53 1.82v2.4c0 1.05-.89 1.89-1.94 1.83-9.7-.56-13.76-4.62-14.32-14.32Z"/></svg>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base break-words">Leo Lion Nipuni Wijesekara — District President</div>
                  <div className="opacity-80 text-sm">+94 70 571 4939</div>
                </div>
              </a>

              <a href="mailto:leodistrict306d7@gmail.com" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 dark:bg-white/10 border border-white/20 hover:bg-white/15 transition">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gold/20 text-gold">
                  {/* Mail icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Zm2.284-.75a.75.75 0 0 0-.534 1.282l6.75 6.75a.75.75 0 0 0 1.06 0l6.75-6.75a.75.75 0 1 0-1.06-1.06L12 11.69 4.844 5.72a.75.75 0 0 0-.31-.72Z"/></svg>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base">District Email</div>
                  <div className="opacity-80 text-sm break-words">leodistrict306d7@gmail.com</div>
                </div>
              </a>
            </div>
          </div>

          {/* Functional contact form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setContactError(null);
              if (!captchaToken) {
                setContactError('Please complete the reCAPTCHA.');
                return;
              }
              setContactStatus('loading');
              try {
                const res = await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ firstName, email, phone, message, token: captchaToken }),
                });
                const data = await res.json();
                if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send');
                setContactStatus('done');
                setFirstName('');
                setEmail('');
                setPhone('');
                setMessage('');
                setCaptchaToken(null);
              } catch (err: any) {
                setContactStatus('error');
                setContactError(err.message || 'Something went wrong.');
              }
            }}
            className="space-y-3 bg-white/5 dark:bg-white/5 border border-white/20 rounded-2xl p-4"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
                className="px-4 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/30 outline-none"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                required
                className="px-4 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/30 outline-none"
              />
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/30 outline-none"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              rows={4}
              required
              className="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/30 outline-none"
            />
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
              <div className="rounded-xl bg-white/10 dark:bg-white/10 border border-white/20 p-2 inline-block">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(token: string | null) => setCaptchaToken(token)}
                  theme={recaptchaTheme}
                  size={recaptchaSize}
                />
              </div>
            ) : (
              <div className="text-xs opacity-70">Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY to enable reCAPTCHA</div>
            )}
            {contactError && <p className="text-red-500 text-sm">{contactError}</p>}
            {contactStatus === 'done' && <p className="text-green-500 text-sm">Message sent! We will get back to you.</p>}
            <div className="flex justify-end">
              <button disabled={contactStatus==='loading'} type="submit" className="px-4 py-2 rounded-lg btn-primary disabled:opacity-60">
                {contactStatus === 'loading' ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function CounterCard({ label, value }: { label: string; value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setCount(Math.floor(value * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className="glass rounded-2xl p-6 text-center">
      <div className="text-3xl md:text-4xl font-bold text-gold">{count.toLocaleString()}</div>
      <div className="mt-1 text-sm opacity-80">{label}</div>
    </div>
  );
}

function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="heading-serif text-2xl font-semibold">Stay Updated</h3>
      <p className="opacity-80 text-sm mt-1">Subscribe to our newsletter for district updates and opportunities.</p>
      <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="w-full sm:flex-1 px-4 py-2 rounded-lg bg-white/70 dark:bg-white/10 border border-white/30 outline-none focus:ring-2 focus:ring-gold" />
        <button disabled={status==='loading'} className="w-full sm:w-auto px-4 py-2 rounded-lg btn-primary disabled:opacity-60">Subscribe</button>
      </form>
      {status === 'done' && <p className="text-green-500 mt-2">Subscribed!</p>}
      {status === 'error' && <p className="text-red-500 mt-2">Error. Try again.</p>}
    </div>
  );
}