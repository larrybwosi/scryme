import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/providers/cart-provider';
import { CustomerAuthProvider } from '@/providers/customer-auth-provider';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Scryme E-commerce Store',
  description: 'Powered by Scryme V3 SDK',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        <CustomerAuthProvider>
          <CartProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
