import React from 'react';
import { StagingManager } from '@/components/bakery/StagingManager';

export default function StagingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Production Staging & Dispatch
        </h1>
        <p className="text-sm text-muted-foreground">
          Log production items sent to Front Office / POS counter for sale.
        </p>
      </div>

      <StagingManager />
    </div>
  );
}
