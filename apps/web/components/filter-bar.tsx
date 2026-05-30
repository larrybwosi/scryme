import { Search, Filter, ChevronDown, Download, FileSpreadsheet } from 'lucide-react';

export function FilterBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            All Supplier <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Monthly <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <button className="p-2 bg-white border border-border rounded-lg hover:bg-muted transition-colors">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4 text-muted-foreground" />
          Export PDF
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
          Export Excel
        </button>
      </div>
    </div>
  );
}
