import React from 'react';
import { useLocation } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';

export default function GenericModulePage() {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ') || 'Module';

  return (
    <Card className="p-8 text-center border-border max-w-2xl mx-auto mt-8 shadow-xs space-y-4">
      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-foreground capitalize">
        {pageName} Module
      </h2>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        This local-first view for <span className="font-semibold text-foreground capitalize">{pageName}</span> is initialized and fully structured. Select <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tasks</span> or <span className="font-semibold text-indigo-600 dark:text-indigo-400">Time tracker</span> from the sidebar to manage active items.
      </p>
    </Card>
  );
}
