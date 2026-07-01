import React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface StorefrontLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const StorefrontLayout: React.FC<StorefrontLayoutProps> = ({
  children,
  header,
  footer,
  className
}) => {
  return (
    <div className={cn("min-h-screen bg-background font-sans antialiased", className)}>
      {header && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
      )}
      <main className="container py-8">
        {children}
      </main>
      {footer && (
        <footer className="border-t bg-muted/50">
          {footer}
        </footer>
      )}
    </div>
  );
};
