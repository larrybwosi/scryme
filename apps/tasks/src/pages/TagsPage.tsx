import React, { useState } from 'react';
import { Tag as TagIcon, Plus } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

export default function TagsPage() {
  const [tags, setTags] = useState([
    { id: 'tag-1', name: 'Frontend', color: 'bg-indigo-500', count: 12 },
    { id: 'tag-2', name: 'Backend', color: 'bg-emerald-500', count: 8 },
    { id: 'tag-3', name: 'Design System', color: 'bg-purple-500', count: 5 },
    { id: 'tag-4', name: 'DevOps', color: 'bg-amber-500', count: 4 },
    { id: 'tag-5', name: 'QA & Testing', color: 'bg-rose-500', count: 6 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('bg-indigo-500');

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const newTag = {
      id: `tag-${Date.now()}`,
      name: tagName,
      color: tagColor,
      count: 0,
    };

    setTags([...tags, newTag]);
    setIsModalOpen(false);
    setTagName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Task Labels & Tags
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Categorize workspace tasks across engineering, design, and operations.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Create New Tag</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Tag Label</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTag} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Label Name</Label>
                <Input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g. Critical Bug / Feature"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Theme Accent Color</Label>
                <select
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="bg-indigo-500">Indigo</option>
                  <option value="bg-emerald-500">Emerald</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-amber-500">Amber</option>
                  <option value="bg-rose-500">Rose Red</option>
                  <option value="bg-cyan-500">Cyan Blue</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Save Tag
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <Card key={tag.id} className="p-4 hover:shadow-xs transition-shadow flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3.5 w-3.5 rounded-full ${tag.color} shrink-0`} />
              <div className="font-bold text-xs text-foreground">{tag.name}</div>
            </div>

            <Badge variant="secondary" className="text-xs font-semibold">
              {tag.count} Tasks
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
