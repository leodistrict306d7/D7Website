"use client";
import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and if analytics is available
    if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
      return;
    }

    const metrics: PerformanceMetrics = {};

    // Measure Core Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // Report to analytics if available
      if ('gtag' in window && typeof (window as any).gtag === 'function') {
        const gtag = (window as any).gtag;
        
        if (metrics.fcp) {
          gtag('event', 'timing_complete', {
            name: 'first_contentful_paint',
            value: Math.round(metrics.fcp)
          });
        }

        if (metrics.ttfb) {
          gtag('event', 'timing_complete', {
            name: 'time_to_first_byte',
            value: Math.round(metrics.ttfb)
          });
        }
      }
    };

    // Use Web Vitals library if available, otherwise fallback to Performance API
    if ('web-vitals' in window) {
      // If web-vitals library is loaded
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = (window as any)['web-vitals'];
      
      getCLS((metric: any) => {
        metrics.cls = metric.value;
        reportMetric('cumulative_layout_shift', metric.value);
      });

      getFID((metric: any) => {
        metrics.fid = metric.value;
        reportMetric('first_input_delay', metric.value);
      });

      getFCP((metric: any) => {
        metrics.fcp = metric.value;
        reportMetric('first_contentful_paint', metric.value);
      });

      getLCP((metric: any) => {
        metrics.lcp = metric.value;
        reportMetric('largest_contentful_paint', metric.value);
      });

      getTTFB((metric: any) => {
        metrics.ttfb = metric.value;
        reportMetric('time_to_first_byte', metric.value);
      });
    } else {
      // Fallback to Performance API
      measureWebVitals();
    }

    // Monitor resource loading performance
    const monitorResources = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Find slow resources (>2s)
      const slowResources = resources.filter(resource => resource.duration > 2000);
      
      if (slowResources.length > 0 && 'gtag' in window) {
        const gtag = (window as any).gtag;
        slowResources.forEach(resource => {
          gtag('event', 'slow_resource', {
            resource_name: resource.name,
            duration: Math.round(resource.duration),
            resource_type: getResourceType(resource.name)
          });
        });
      }
    };

    // Monitor JavaScript errors
    const errorHandler = (event: ErrorEvent) => {
      if ('gtag' in window && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'exception', {
          description: `${event.filename}:${event.lineno} - ${event.message}`,
          fatal: false,
        });
      }
    };

    // Monitor unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if ('gtag' in window && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'exception', {
          description: `Unhandled Promise Rejection: ${event.reason}`,
          fatal: false,
        });
      }
    };

    // Set up event listeners
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Monitor resources after page load
    if (document.readyState === 'complete') {
      monitorResources();
    } else {
      window.addEventListener('load', monitorResources);
    }

    // Cleanup
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      window.removeEventListener('load', monitorResources);
    };
  }, []);

  return null; // This component doesn't render anything
}

function reportMetric(name: string, value: number) {
  if ('gtag' in window && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'timing_complete', {
      name,
      value: Math.round(value)
    });
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Performance metric - ${name}: ${Math.round(value)}ms`);
  }
}

function getResourceType(url: string): string {
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
  if (url.match(/\.(css)$/i)) return 'stylesheet';
  if (url.match(/\.(js|mjs)$/i)) return 'script';
  if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
  return 'other';
}
