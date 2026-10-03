import { Metadata } from 'next';
import MerchStore from '@/components/merch/checkout-form';

export const metadata: Metadata = {
  title: 'Official Merch · Leo District 306 D7',
  description: 'Get your official Leo District 306 D7 merchandise. Support our youth leadership and community service initiatives.',
};

export default function MerchPage() {
  return (
    <div className="min-h-screen py-10 bg-white dark:bg-transparent">
      <div className="max-w-5xl mx-auto text-center mb-12 px-4">
        <h1 className="heading-serif text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white uppercase tracking-tighter">
          District <span className="text-gold">Merch</span> Collection
        </h1>
        <p className="text-gray-600 dark:text-white/60 max-w-xl mx-auto text-base">
          Premium District 306 D7 apparel. Designed for the next generation of leaders.
        </p>
      </div>

      <MerchStore />
    </div>
  );
}
