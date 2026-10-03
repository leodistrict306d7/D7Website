const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

type GtagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
};

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}

export const getGaId = () => GA_MEASUREMENT_ID;

export const isGaEnabled = () => typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID !== '';

export const pageview = (url: string) => {
  if (!isGaEnabled()) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: GtagEvent) => {
  if (!isGaEnabled()) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};
