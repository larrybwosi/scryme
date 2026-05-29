'use client';

import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { QRCodeCanvas } from 'qrcode.react';
import { usePosStore } from '@/store/store';
import * as LucideIcons from 'lucide-react';
import {
  MonitorSmartphone,
  QrCode,
  CreditCard,
  CheckCircle,
  DollarSign,
  Smartphone,
} from 'lucide-react';
import { useFormattedCurrency } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// --- Types ---
interface CartItem {
  id?: string;
  name: string;
  variant?: string;
  qty: number;
  price: number;
}

interface CartPayload {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  finalTotal: number;
}

interface PaymentPayload {
  type: 'MPESA_QR' | 'CARD_PAYMENT' | 'CASH_PAYMENT' | 'MPESA_STK' | 'CLEAR' | 'CLEAR_COMPLETED';
  amount?: number;
  qrData?: string;
  paybill?: string;
  tillNo?: string;
  accountRef?: string;
  mode?: 'QR' | 'PAYBILL';
  cashReceived?: number;
  change?: number;
  phoneNumber?: string;
}

// --- Configuration ---
// --- Configuration ---
// Removed hardcoded PROMO_SLIDES in favor of store configuration

// --- Sub-Components ---

const DynamicIcon = ({ name, className }: { name?: string; className?: string }) => {
  const Icon = (LucideIcons as any)[name || 'Store'] || LucideIcons.Store;
  return <Icon className={className} />;
};

const PromoSlide = ({ slide, isFullScreen = false }: { slide: any, isFullScreen?: boolean }) => (
  <div className={`relative z-10 p-6 flex flex-col items-center text-center ${isFullScreen ? '' : 'rounded-2xl shadow-2xl mb-6'} ${isFullScreen ? '' : slide.background}`}>
    {slide.type === 'qr' ? (
      <div className="bg-white p-3 rounded-xl shadow-lg mb-6">
        <QRCodeCanvas value={slide.payload || ""} size={isFullScreen ? 280 : 140} />
      </div>
    ) : (
      <div className="mb-6 scale-75 md:scale-100">
          <DynamicIcon name={slide.iconName} className="h-24 w-24 text-white/90" />
      </div>
    )}
    
    <h2 className={`${isFullScreen ? 'text-5xl md:text-7xl mb-6' : 'text-2xl lg:text-3xl mb-2'} font-bold tracking-tight ${isFullScreen ? 'text-white' : slide.textColor || 'text-white'}`}>
      {slide.title}
    </h2>
    <p className={`${isFullScreen ? 'text-2xl text-slate-200' : 'text-slate-400 text-lg'} max-w-md mx-auto`}>
      {slide.subtitle || slide.desc}
    </p>
  </div>
);

export default function CustomerDisplay() {
  const settings = usePosStore(state => state.settings);
  const config = settings.customerDisplayConfig || {
      enabled: true,
      welcomeMessage: "Dealio Enterprise",
      subMessage: "Welcome to our store",
      showTime: true,
      slideIntervalSeconds: 8,
      showCompanyLogo: true,
      promoSlides: []
  };
  
  // Use config slides or fallback to empty array (should prevent crashing if empty)
  // But logic needs slides to rotate. If empty, show welcome message static?
  const slides = config.promoSlides && config.promoSlides.length > 0 ? config.promoSlides : [{
      id: 'default', type: 'icon', title: config.welcomeMessage, subtitle: config.subMessage, background: 'bg-slate-800', textColor: 'text-white', iconName: 'Store'
  }];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState({
    subtotal: 0.00,
    tax: 0.00,
    discount: 0.00,
    finalTotal: 0.00
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [promoIndex, setPromoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentPayload>({ type: 'CLEAR' });
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Fallback formatter
  const utilsFormatCurrency = useFormattedCurrency();
  const formatCurrency = utilsFormatCurrency || ((val: number) => `KSH ${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    const promoTimer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % slides.length);
    }, (config.slideIntervalSeconds || 8) * 1000);

    const unlistenCart = listen<CartPayload>('cart-update', (event) => {
      const { items, subtotal, tax, discount, finalTotal } = event.payload;
      setCart(items);
      setTotals({ subtotal, tax, discount, finalTotal });
    });

    const unlistenPayment = listen<PaymentPayload>('payment-update', (event) => {
      const payload = event.payload;
      if (payload.type === 'CLEAR_COMPLETED') {
        setPaymentDetails({ type: 'CLEAR' });
        setShowCompletionMessage(true);
        setTimeout(() => setShowCompletionMessage(false), 4000);
      } else {
        setPaymentDetails(payload);
      }
    });

    return () => {
      clearInterval(timer);
      clearInterval(promoTimer);
      unlistenCart.then(f => f());
      unlistenPayment.then(f => f());
    };
  }, [slides.length, config.slideIntervalSeconds]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [cart]);

  const currentSlide = slides[promoIndex] || slides[0];
  const isPaymentActive = paymentDetails.type !== 'CLEAR' && paymentDetails.type !== 'CLEAR_COMPLETED';
  
  // IDLE LOGIC: Empty cart AND no active payment
  const isIdle = cart.length === 0 && !isPaymentActive;



  return (
    <div className="h-[100dvh] w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden select-none">
      
      {/* ================= PAYMENT OVERLAY (Global Modal) ================= */}
      <AnimatePresence>
        {(isPaymentActive || showCompletionMessage) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6"
          >
             {/* ... (Keep existing Payment Modal Content exactly as is) ... */}
             {showCompletionMessage ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-sm w-full"
              >
                <div className="mx-auto h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Approved</h2>
                <p className="text-slate-500 mt-2">Thank you for your business.</p>
              </motion.div>
            ) : paymentDetails.type === 'MPESA_QR' && paymentDetails.qrData ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-emerald-600 p-6 text-white text-center">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <QrCode className="h-6 w-6" /> Scan to Pay
                  </h2>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-center">
                    <div className="p-4 border-2 border-slate-100 rounded-xl shadow-sm">
                      <QRCodeCanvas
                        value={paymentDetails.qrData}
                        size={220}
                        level="H"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                       <span className="text-xs uppercase font-semibold text-slate-500">Method</span>
                       <span className="font-bold text-slate-800">{paymentDetails.mode === 'PAYBILL' ? 'Paybill' : 'Buy Goods'}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-b border-slate-200 pb-2">
                       <span className="text-xs uppercase font-semibold text-slate-500">Business No.</span>
                       <span className="font-mono text-lg font-bold text-slate-900">{paymentDetails.mode === 'PAYBILL' ? paymentDetails.paybill : paymentDetails.tillNo}</span>
                    </div>
                    {paymentDetails.accountRef && (
                       <div className="flex justify-between items-baseline">
                         <span className="text-xs uppercase font-semibold text-slate-500">Account</span>
                         <span className="font-mono text-lg font-bold text-slate-900">{paymentDetails.accountRef}</span>
                       </div>
                    )}
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                    <p className="text-4xl font-extrabold text-emerald-600 tabular-nums">
                      {formatCurrency(paymentDetails.amount || 0)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : paymentDetails.type === 'CARD_PAYMENT' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-blue-600 p-6 text-white text-center">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <CreditCard className="h-6 w-6" /> Card Payment
                  </h2>
                </div>
                <div className="p-10 text-center space-y-8">
                  <div className="relative h-32 w-full flex items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75 mx-auto w-32 h-32"></div>
                      <CreditCard className="relative z-10 h-20 w-20 text-blue-600" />
                  </div>
                  <p className="text-xl font-medium text-slate-700">Please tap, insert, or swipe your card on the terminal.</p>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <span className="text-4xl font-black text-slate-900 tabular-nums">
                      {formatCurrency(paymentDetails.amount || 0)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : paymentDetails.type === 'CASH_PAYMENT' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-emerald-600 p-6 text-white text-center">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6" /> Cash Payment
                  </h2>
                </div>
                <div className="p-8 space-y-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Total Amount</p>
                    <p className="text-5xl font-extrabold text-slate-900 tabular-nums">
                      {formatCurrency(paymentDetails.amount || 0)}
                    </p>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-lg">
                        <span className="text-slate-500 font-medium">Cash Given</span>
                        <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(paymentDetails.cashReceived || 0)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center text-2xl">
                        <span className="text-emerald-600 font-bold">Change</span>
                        <span className="font-black text-emerald-600 tabular-nums">{formatCurrency(paymentDetails.change || 0)}</span>
                      </div>
                  </div>
                </div>
              </motion.div>
            ) : paymentDetails.type === 'MPESA_STK' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
              >
                <div className="bg-green-600 p-6 text-white text-center">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Smartphone className="h-6 w-6" /> M-Pesa Request
                  </h2>
                </div>
                <div className="p-10 text-center space-y-6">
                  <div className="relative h-24 w-full flex items-center justify-center mb-4">
                      <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-75 mx-auto w-24 h-24"></div>
                      <Smartphone className="relative z-10 h-16 w-16 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Check your phone</h3>
                    <p className="text-slate-500 text-lg">
                      We've sent a payment request to:
                    </p>
                    <p className="text-2xl font-mono font-bold text-slate-800 mt-2 tracking-wider">
                      {paymentDetails.phoneNumber}
                    </p>
                  </div>

                  <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm font-medium">
                      Please enter your M-Pesa PIN to complete the payment of <strong>{formatCurrency(paymentDetails.amount || 0)}</strong>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT SWITCHER ================= */}
      <AnimatePresence mode="wait">
        {isIdle ? (
          // --- IDLE SCREENSAVER MODE ---
          <motion.div
            key="idle-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 flex flex-col items-center justify-center ${currentSlide.background}`}
          >
             {/* Animated Background Pattern */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]"></div>

             {/* Header Info */}
             <div className="absolute top-0 left-0 right-0 p-8 flex justify-between text-white/60">
                <div className="flex items-center gap-3">
                   {config.showCompanyLogo && <LucideIcons.Store className="h-6 w-6" />}
                  <span className="font-bold uppercase tracking-widest">{config.welcomeMessage}</span>
                </div>
                {config.showTime && (
                    <div className="font-mono text-xl">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
             </div>

             {/* Main Slide Content */}
             <AnimatePresence mode="wait">
               <motion.div
                 key={`idle-${promoIndex}`}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.5 }}
                 className="relative z-10"
               >
                 <PromoSlide slide={currentSlide} isFullScreen={true} />
               </motion.div>
             </AnimatePresence>

             {/* Footer Indicators */}
             <div className="absolute bottom-12 flex gap-3 z-20">
              {slides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-500 ${idx === promoIndex ? 'w-16 bg-white' : 'w-2 bg-white/30'}`} 
                />
              ))}
            </div>
          </motion.div>
        ) : (
          // --- ACTIVE CART MODE ---
          <motion.div
            key="active-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full w-full lg:grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_500px]"
          >
            {/* LEFT COLUMN: CART LIST */}
            <div className="flex flex-col h-full bg-white relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] w-full">
              
              <header className="h-16 md:h-20 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-4">
                  {config.showCompanyLogo && (
                      <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <LucideIcons.Store className="h-5 w-5 text-white" />
                      </div>
                  )}
                  <div>
                    <h1 className="text-base md:text-lg font-bold uppercase tracking-widest text-slate-900">{config.welcomeMessage}</h1>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1"><LucideIcons.Wifi size={10}/> Online</span>
                      <span>•</span>
                      <span>{config.subMessage}</span>
                    </div>
                  </div>
                </div>
                {config.showTime && (
                    <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-2 text-slate-500">
                        <LucideIcons.Clock size={14} />
                        <span className="font-mono text-sm md:text-base">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-400">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                )}
              </header>

              <main ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth p-0 md:p-2">
                <div className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {cart.map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-4 p-4 md:p-6 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="shrink-0 w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                          <span className="font-mono font-bold text-lg text-slate-600">{item.qty}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-lg truncate">{item.name}</h3>
                          <p className="text-sm text-slate-500 font-medium">
                            {item.variant ? <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs mr-2 text-slate-600">{item.variant}</span> : null}
                            @{formatCurrency(item.price)}/ea
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-xl font-bold text-slate-900 tabular-nums tracking-tight">
                            {formatCurrency(item.price * item.qty)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </main>
            </div>

            {/* RIGHT COLUMN: SIDEBAR & TOTALS */}
            <aside className="hidden lg:flex flex-col bg-slate-900 text-white shrink-0 shadow-2xl z-20 overflow-hidden">
              
              {/* Active Mode Promo Carousel */}
              <div className="flex-1 relative overflow-hidden bg-slate-800 items-center justify-center flex">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={promoIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                    >
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                        <PromoSlide slide={currentSlide} isFullScreen={false} />
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="absolute bottom-6 flex gap-2 z-20">
                    {slides.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === promoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} 
                      />
                    ))}
                  </div>
              </div>

              {/* Financial Footer */}
              <div className="bg-slate-950 p-6 lg:p-10 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <div className="space-y-3 mb-6 text-sm lg:text-base font-medium">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-200 tabular-nums">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  
                  <AnimatePresence>
                    {totals.discount > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex justify-between text-emerald-400 overflow-hidden"
                      >
                        <span className="flex items-center gap-1"><LucideIcons.Percent size={14}/> Savings</span>
                        <span className="font-mono tabular-nums">- {formatCurrency(totals.discount)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex justify-between text-slate-400">
                    <span>Tax (16%)</span>
                    <span className="font-mono text-slate-200 tabular-nums">{formatCurrency(totals.tax)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed border-slate-800">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs lg:text-sm font-semibold text-slate-500 uppercase tracking-widest">Total Due</span>
                    <motion.span 
                      key={totals.finalTotal}
                      initial={{ scale: 0.95, color: '#94a3b8' }}
                      animate={{ scale: 1, color: '#ffffff' }}
                      className="text-5xl lg:text-7xl font-black tracking-tighter tabular-nums font-mono leading-none"
                    >
                      {formatCurrency(totals.finalTotal)}
                    </motion.span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-2"><LucideIcons.Receipt size={16}/> Receipt Ready</span>
                  <span className="flex items-center gap-2"><MonitorSmartphone size={16}/> Terminal Active</span>
                </div>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}