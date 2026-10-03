'use client';

import React, { useState, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const SIZES = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const SIZE_CHART = [
  { size: '2XS', chest: '16.5"', length: '24.5"', collar: '13.5"' },
  { size: 'XS', chest: '17.5"', length: '25.5"', collar: '14"' },
  { size: 'S', chest: '18.5"', length: '26.5"', collar: '14.5"' },
  { size: 'M', chest: '19.5"', length: '27.5"', collar: '15"' },
  { size: 'L', chest: '20.5"', length: '28.5"', collar: '15.5"' },
  { size: 'XL', chest: '21.5"', length: '29.5"', collar: '16"' },
  { size: '2XL', chest: '22.5"', length: '30.5"', collar: '16.5"' },
  { size: '3XL', chest: '23.5"', length: '31.5"', collar: '17"' },
  { size: '4XL', chest: '24.5"', length: '32.5"', collar: '17.5"' },
];

const PRODUCTS = [
  {
    id: 'black-shirt',
    name: 'District Official T-Shirt (Black)',
    price: 2000,
    color: 'Black',
    image: '/images/merch/black.jpeg', 
    description: 'Official black edition t-shirt of Leo District 306 D7. Premium breathable fabric, designed for leadership and impact.',
  },
  {
    id: 'white-shirt',
    name: 'District Official T-Shirt (White)',
    price: 2000,
    color: 'White',
    image: '/images/merch/white.jpeg',
    description: 'Official white edition t-shirt of Leo District 306 D7. Professional look for district events. High-comfort material.',
  },
];

const ALPHA_CLUBS = [
  'Leo Club of Ananda College', 'Leo Club of Anula Vidyalaya', 'Leo Club of Ashoka Vidyalaya',
  'Leo Club of Bomiriya Central College', 'Leo Club of Carey College', 'Leo Club of Asian Grammar School',
  'Leo Club of Gankanda Central College', 'Leo Club of Isipathana College', 'Leo Club of Lumbini College',
  'Leo Club of Mahanama College', 'Leo Club of Mahinda Rajapaksha College', 'Leo Club of Ferguson High School',
  'Leo Club of Pannipitiya Dharmapala Vidyalaya', "Leo Club of President's College Maharagama",
  'Leo Club of Royal College', 'Leo Club of Sivali College', "Leo Club of St. Aloysius' College",
  "Leo Club of St. John's College", 'Leo Club of Thurstan College', 'Leo Club of Gothami Balika',
];

const OMEGA_CLUBS = [
  'Leo Club of Cinnamon Gardens', 'Leo Club of Colombo Eminence', 'Leo Club of Colombo Griffins',
  'Leo Club of Colombo Hogwarts', 'Leo Club of Colombo Knights', 'Leo Club of Defence Marshals',
  'Leo Club of Homagama Central', 'Leo Club of Kottawa Central Golden City',
  'Leo Club of Kuruwita Paradise', 'Leo Club of Maharagama Golden City', 'Leo Club of Nawala Metro',
  'Leo Club of National Institute of Business Management', 'Leo Club of Pannipitiya Metro Titans',
  'Leo Club of Pannipitiya Paradise', 'Leo Club of Sabaragamuwa University',
  'Leo Club of University of Sri Jayewardenepura',
];

interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}

export default function MerchStore() {
  const [view, setView] = useState<'gallery' | 'product' | 'checkout'>('gallery');
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    clubType: '',
    clubName: '',
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * 2000, 0);
  }, [cart]);

  const addToCart = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find(item => item.productId === productId && item.size === size);
      if (existing) {
        return prev.map(item => 
          (item.productId === productId && item.size === size) 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId, size, quantity }];
    });
    setSelectedProduct(null);
    setView('gallery');
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'PDF file size must be under 2MB.' });
        return;
      }
      setReceipt(file);
      setStatus(null);
      return;
    }

    try {
      const options = { maxSizeMB: 0.9, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      setReceipt(compressedFile);
      setStatus(null);
    } catch (error) {
      console.error('Compression failed:', error);
      setReceipt(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) {
      setStatus({ type: 'error', message: 'Please upload your payment slip.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('clubType', formData.clubType);
      data.append('clubName', formData.clubName);
      data.append('cart', JSON.stringify(cart));
      data.append('totalAmount', totalAmount.toString());
      data.append('receipt', receipt);

      const response = await fetch('/api/checkout', { method: 'POST', body: data });
      const result = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Order placed successfully!' });
        setCart([]);
        setFormData({ name: '', email: '', clubType: '', clubName: '' });
        setReceipt(null);
        setTimeout(() => { setView('gallery'); setStatus(null); }, 5000);
      } else {
        throw new Error(result.error || 'Checkout failed');
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'gallery') {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {PRODUCTS.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -4 }}
              className="group cursor-pointer bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
              onClick={() => { setSelectedProduct(product); setView('product'); }}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 md:opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <h3 className="heading-serif text-xl md:text-2xl font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gold font-black text-base md:text-lg tracking-tighter">Rs. {product.price}.00</p>
                </div>
              </div>
              <div className="p-4 md:p-5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <div>
                   <h3 className="heading-serif text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                   <p className="text-maroon dark:text-gold font-black text-sm tracking-tighter">Rs. {product.price}.00</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-maroon text-white flex items-center justify-center transition-transform group-hover:rotate-90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-6 inset-x-0 flex justify-center px-4 z-50 pointer-events-none"
            >
              <button 
                onClick={() => setView('checkout')}
                className="bg-maroon text-white py-3 px-6 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border border-white/20 whitespace-nowrap pointer-events-auto"
              >
                <div className="relative">
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <span className="absolute -top-1.5 -right-1.5 bg-gold text-maroon text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-maroon">{cart.reduce((s,i)=>s+i.quantity, 0)}</span>
                </div>
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Ready to Order</p>
                  <p className="text-sm font-black tracking-tight leading-none">Checkout Rs. {totalAmount}</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'product' && selectedProduct) {
    return <ProductPage product={selectedProduct} onBack={() => setView('gallery')} onAddToCart={addToCart} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button onClick={() => setView('gallery')} className="w-fit text-gray-500 dark:text-white/40 hover:text-maroon dark:hover:text-white transition-colors uppercase text-[9px] font-black tracking-[0.2em] flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
          Back
        </button>
        <h2 className="heading-serif text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Your Bag</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-white/5 p-5 md:p-6 rounded-[1.5rem] border border-gray-200 dark:border-white/10 space-y-4 md:space-y-6">
            {cart.map((item, idx) => {
              const p = PRODUCTS.find(prod => prod.id === item.productId)!;
              return (
                <div key={idx} className="flex gap-4 md:gap-6 pb-4 md:pb-6 border-b border-gray-100 dark:border-white/5 last:border-0 last:pb-0">
                  <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/5">
                    <Image src={p.image} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="heading-serif text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight">{p.name}</h4>
                      <button onClick={() => removeFromCart(idx)} className="text-gray-300 dark:text-white/20 hover:text-rose transition-colors p-1">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                    <p className="text-[9px] md:text-xs text-gray-500 dark:text-white/40 mb-1 md:mb-2 font-bold uppercase tracking-[0.15em]">Size: {item.size} | Qty: {item.quantity}</p>
                    <p className="text-sm md:text-base font-black text-maroon dark:text-gold">Rs. {item.quantity * 2000}.00</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-[1.5rem] border border-gray-200 dark:border-white/10 space-y-4 md:space-y-6">
              <h3 className="heading-serif text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Order Details</h3>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-white/40 ml-1">Member Name</label>
                  <input
                    type="text" name="name" required value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    className="w-full rounded-xl border-white/10 bg-white/5 p-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-maroon outline-none border transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-white/40 ml-1">Email Address</label>
                  <input
                    type="email" name="email" required value={formData.email} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    className="w-full rounded-xl border-white/10 bg-white/5 p-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-maroon outline-none border transition-all placeholder:text-gray-300 dark:placeholder:text-white/10"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-white/40 ml-1">Club Type</label>
                  <select
                    name="clubType" required value={formData.clubType} onChange={(e) => setFormData(prev => ({...prev, clubType: e.target.value, clubName: ''}))}
                    className="w-full rounded-xl border-white/10 bg-gray-50 dark:bg-gray-950 p-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-maroon outline-none border transition-all appearance-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Alpha">Alpha Leo Club</option>
                    <option value="Omega">Omega Leo Club</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-white/40 ml-1">Your Club</label>
                  <select
                    name="clubName" required value={formData.clubName} onChange={(e) => setFormData(prev => ({...prev, clubName: e.target.value}))}
                    className="w-full rounded-xl border-white/10 bg-gray-50 dark:bg-gray-950 p-3.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-maroon outline-none border transition-all appearance-none"
                  >
                    <option value="">Choose Club</option>
                    {formData.clubType === 'Alpha' && ALPHA_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                    {formData.clubType === 'Omega' && OMEGA_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-[1.5rem] border border-gray-200 dark:border-white/10 space-y-4 md:space-y-6">
              <h3 className="heading-serif text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Payment</h3>
              <div className="bg-maroon/5 dark:bg-maroon/20 border border-maroon/10 dark:border-maroon/30 p-5 md:p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3 text-maroon dark:text-gold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Bank Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <p className="text-[8px] text-gray-400 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Institution</p>
                    <p className="text-gray-900 dark:text-white font-bold text-xs md:text-sm leading-tight">Commercial Bank Battaramulla</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Account Holder</p>
                    <p className="text-gray-900 dark:text-white font-bold uppercase text-xs md:text-sm leading-tight">Leo District 306 D7</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Account Number</p>
                    <p className="text-maroon dark:text-gold font-black text-base md:text-lg tracking-tighter">8027577024</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 dark:text-white/30 uppercase font-black tracking-widest mb-0.5">Branch</p>
                    <p className="text-gray-900 dark:text-white font-bold text-xs md:text-sm">Battaramulla</p>
                  </div>
                </div>
              </div>

              <div className="relative group overflow-hidden rounded-2xl">
                <input type="file" accept="image/*,.pdf" required onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="border-2 border-dashed border-gray-200 dark:border-white/10 group-hover:border-maroon/30 dark:group-hover:border-gold/50 group-hover:bg-gray-50 dark:group-hover:bg-white/5 rounded-2xl p-6 md:p-8 text-center transition-all bg-gray-50 dark:bg-black/20">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 dark:text-white/40 group-hover:text-maroon dark:group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                  <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-1">Upload Receipt</p>
                  <p className="text-[8px] md:text-[9px] text-gray-400 dark:text-white/30 uppercase font-black tracking-[0.15em]">Image or PDF (MAX 2MB)</p>
                </div>
              </div>
              {receipt && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-maroon/5 dark:bg-gold/10 border border-maroon/10 dark:border-gold/20 p-3 rounded-xl flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-maroon dark:bg-gold animate-pulse" />
                  <span className="text-[9px] md:text-[10px] text-maroon dark:text-gold font-black uppercase tracking-widest leading-none">
                    Ready: {receipt.name.length > 15 ? receipt.name.substring(0, 15) + '...' : receipt.name} ({(receipt.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                </motion.div>
              )}
            </div>

            {status && (
              <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest text-center border ${status.type === 'success' ? 'bg-green-50 text-green-800 border-green-100 dark:bg-gold/10 dark:text-gold dark:border-gold/20' : 'bg-red-50 text-red-800 border-red-100 dark:bg-rose/10 dark:text-rose dark:border-rose/20'}`}>
                {status.message}
              </div>
            )}

            <button
              type="submit" disabled={isSubmitting || cart.length === 0}
              className="w-full py-5 md:py-6 bg-maroon text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs md:text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl shadow-maroon/30"
            >
              {isSubmitting ? 'Securing Order...' : `Confirm Transaction`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-white/5 p-6 md:p-8 rounded-[2rem] border border-gray-200 dark:border-white/10 lg:sticky lg:top-12 shadow-sm">
            <h3 className="heading-serif text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter border-b border-gray-100 dark:border-white/5 pb-4 mb-6 md:mb-8">Summary</h3>
            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 dark:text-white/40 font-bold uppercase tracking-widest">Subtotal</span>
                <span className="text-gray-900 dark:text-white font-black">Rs. {totalAmount}.00</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 dark:text-white/40 font-bold uppercase tracking-widest">Processing</span>
                <span className="text-maroon dark:text-gold font-black uppercase">FREE</span>
              </div>
              <div className="pt-4 md:pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-end">
                <span className="text-gray-400 dark:text-white/40 font-black uppercase tracking-widest text-[8px] pb-1">Grand Total</span>
                <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Rs. {totalAmount}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 text-[9px] md:text-[10px]">
              <p className="font-black uppercase text-gray-400 dark:text-white/20 mb-2 tracking-[0.2em]">Terms & Security</p>
              <p className="text-gray-500 dark:text-white/50 leading-relaxed italic">
                By confirming, you agree to the district merch acquisition protocols. Your data is secured via encrypted service channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPage({ product, onBack, onAddToCart }: { product: typeof PRODUCTS[0], onBack: () => void, onAddToCart: (id: string, s: string, q: number) => void }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(1);

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <button onClick={onBack} className="mb-6 md:mb-8 text-gray-500 dark:text-white/40 hover:text-maroon dark:hover:text-white transition-colors uppercase text-[9px] font-black tracking-[0.2em] flex items-center gap-2 group">
        <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
        Back
      </button>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12 md:mb-16">
        <div className="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm md:shadow-xl group mx-auto w-full max-w-sm lg:max-w-none">
          <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="space-y-6 md:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left py-2">
          <div className="w-full">
            <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3 leading-none">{product.name}</h1>
            <p className="text-xl md:text-2xl font-black text-maroon dark:text-gold tracking-tighter leading-tight">Rs. {product.price}.00</p>
          </div>

          <p className="text-gray-600 dark:text-white/60 leading-relaxed text-sm md:text-base font-light max-w-md">
            {product.description}
          </p>

          <div className="space-y-6 md:space-y-8 w-full">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/30">Size Portfolio</p>
              <div className="flex flex-wrap gap-2.5 md:gap-3 justify-center lg:justify-start">
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl font-black transition-all border ${selectedSize === s ? 'bg-maroon text-white border-maroon shadow-lg dark:bg-white dark:text-maroon dark:border-white dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white border-gray-200 dark:border-white/10 hover:border-maroon dark:hover:border-white/30 text-xs'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/30">Quantity</p>
              <div className="flex items-center gap-6 md:gap-8 bg-gray-100 dark:bg-black/40 rounded-2xl w-fit p-1.5 md:p-2 border border-gray-200 dark:border-white/10 shadow-inner">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-black text-lg border border-gray-200 dark:border-transparent">-</button>
                <span className="font-black text-lg md:text-xl text-gray-900 dark:text-white w-6 md:w-8 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-maroon text-white hover:bg-maroon-700 transition-colors font-black text-lg shadow-md">+</button>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onAddToCart(product.id, selectedSize, qty)}
            className="w-full max-w-sm py-4 md:py-5 bg-maroon dark:bg-gold text-white dark:text-maroon rounded-2xl font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-maroon/20 dark:shadow-gold/20 text-xs md:text-sm"
          >
            Add to Bag
          </button>
        </div>
      </div>

      <div className="pt-10 md:pt-16 border-t border-gray-100 dark:border-white/10 w-full max-w-3xl mx-auto">
        <h3 className="heading-serif text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 text-center flex flex-col items-center gap-3">
          Detailed Size Portfolio
          <span className="w-12 h-[2px] bg-maroon dark:bg-gold" />
        </h3>
        <div className="bg-white dark:bg-black/20 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm md:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] md:text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/30">
                  <th className="py-3.5 px-4 md:py-4 md:px-6 text-left font-black uppercase tracking-widest">Size</th>
                  <th className="py-3.5 px-4 md:py-4 md:px-6 text-center font-black uppercase tracking-widest border-l border-gray-100 dark:border-white/5">Chest</th>
                  <th className="py-3.5 px-4 md:py-4 md:px-6 text-center font-black uppercase tracking-widest border-l border-gray-100 dark:border-white/5">Length</th>
                  <th className="py-3.5 px-4 md:py-4 md:px-6 text-center font-black uppercase tracking-widest border-l border-gray-100 dark:border-white/5">Collar</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-white/60">
                {SIZE_CHART.map((item) => (
                  <tr key={item.size} className={`border-b border-gray-50 dark:border-white/5 transition-colors ${selectedSize === item.size ? 'bg-maroon/5 text-maroon dark:bg-gold/10 dark:text-gold font-bold' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <td className="py-3.5 px-4 md:py-4 md:px-6 font-black uppercase">{item.size}</td>
                    <td className="py-3.5 px-4 md:py-4 md:px-6 text-center border-l border-gray-50 dark:border-white/5 font-medium">{item.chest}</td>
                    <td className="py-3.5 px-4 md:py-4 md:px-6 text-center border-l border-gray-50 dark:border-white/5 font-medium">{item.length}</td>
                    <td className="py-3.5 px-4 md:py-4 md:px-6 text-center border-l border-gray-50 dark:border-white/5 font-medium">{item.collar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-6 text-gray-400 dark:text-white/20 text-[8px] uppercase font-black tracking-[0.2em] text-center">
          * Measurements are in inches. Choice carefully before confirming order.
        </p>
      </div>
    </div>
  );
}
