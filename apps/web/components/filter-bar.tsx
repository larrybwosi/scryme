import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function FilterBar() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search purchases..."
          className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </button>
      </div>
    </div>
  );
}
