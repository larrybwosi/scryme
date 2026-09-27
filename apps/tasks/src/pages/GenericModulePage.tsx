import React from 'react';
import { useLocation } from 'react-router';
import { Sparkles } from 'lucide-react';

export default function GenericModulePage() {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ') || 'Module';

  return (
    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 max-w-2xl mx-auto mt-8 shadow-xs">
      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
        {pageName} Module
      </h2>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        This local-first view for <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{pageName}</span> is initialized and fully structured. Select <span className="font-semibold text-indigo-600 dark:text-indigo-400">Tasks</span> or <span className="font-semibold text-indigo-600 dark:text-indigo-400">Time tracker</span> from the sidebar to manage active items.
      </p>
    </div>
  );
}
