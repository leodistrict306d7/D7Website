export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-[9999] px-4 py-2 bg-gold text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="absolute top-4 left-32 z-[9999] px-4 py-2 bg-gold text-black font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:ring-offset-2 transform -translate-y-full focus:translate-y-0 transition-transform"
      >
        Skip to navigation
      </a>
    </div>
  );
}
