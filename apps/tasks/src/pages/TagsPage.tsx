import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Tag as TagIcon, Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function TagsPage() {
  const { tags } = useTaskStore();
  const [tagName, setTagName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    taskStore.addTag({
      name: tagName.trim(),
      color: '#6366F1',
      usageCount: 0
    });
    setTagName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Tags Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Categorize tasks with custom color-coded labels across projects.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Tag</span>
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 border-border bg-muted/20">
          <form onSubmit={handleCreateTag} className="flex gap-2">
            <Input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Tag name (e.g. Design, Frontend, API)..."
              className="text-xs h-9 flex-1"
            />
            <Button type="submit" size="sm" className="text-xs h-9">
              Save Tag
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tags.map((t) => (
          <Card key={t.id || t.name} className="p-4 flex items-center justify-between border-border shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color || '#6366F1' }} />
              <span className="text-xs font-bold text-foreground">{t.name}</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {t.usageCount || 1} tasks
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
