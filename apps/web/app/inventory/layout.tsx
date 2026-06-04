import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      {/* Header with Breadcrumbs */}
      <header className="px-8 py-4 bg-white border-b border-gray-100">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-900 flex items-center gap-1">
            <Home size={14} />
          </Link>
          <ChevronRight size={14} />
          <span className="font-medium text-gray-900">Inventory</span>
        </nav>
      </header>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {children}
      </div>
    </div>
  );
}
