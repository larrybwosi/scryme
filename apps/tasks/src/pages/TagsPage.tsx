import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Tag as TagIcon, Plus } from 'lucide-react';

export default function TagsPage() {
  const { tags } = useTaskStore();
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#6366F1');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    taskStore.addTag({
      name: tagName.trim(),
      color: tagColor,
      usageCount: 1
    });
    setTagName('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Custom Tags & Categorization
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage task labels, color codes, and workflow categorization.
        </p>
      </div>

      {/* Add Tag Form */}
      <form onSubmit={handleAddTag} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <input
          type="text"
          required
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          placeholder="New Tag Name..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="color"
          value={tagColor}
          onChange={(e) => setTagColor(e.target.value)}
          className="h-8 w-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0.5"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </button>
      </form>

      {/* Tags Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tags.map((t) => (
          <div key={t.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color || '#6366F1' }} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.name}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {t.usageCount || 1} tasks
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
