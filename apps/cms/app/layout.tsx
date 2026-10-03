import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scryme Product Marketing CMS',
  description: 'Multi-Tenant Product Marketing Content Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#09090b', color: '#f4f4f5' }}>
        {children}
      </body>
    </html>
  );
}
