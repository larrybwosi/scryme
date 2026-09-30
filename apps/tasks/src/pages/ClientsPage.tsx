import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Card } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function ClientsPage() {
  const clients = useTaskStore((state) => state.clients);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    taskStore.addClient({
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      company: company.trim() || 'Enterprise Client',
      activeProjectsCount: 1,
      status: 'ACTIVE'
    });
    setName('');
    setEmail('');
    setCompany('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Clients
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization client directory and project relationships.
          </p>
        </div>

        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 shadow-xs border-border bg-muted/20">
          <form onSubmit={handleAddClient} className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Add New Client</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                type="text"
                required
                placeholder="Client / Company Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
              <Input
                type="email"
                placeholder="Contact Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
              <Input
                type="text"
                placeholder="Company Entity"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Save Client
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            No clients found. Click "Add Client" to create your first client record.
          </div>
        ) : (
          clients.map((client) => (
            <Card key={client.id} className="p-5 border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{client.name}</h3>
                  <div className="text-xs text-muted-foreground">{client.company}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {client.status}
                </Badge>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Active Projects</span>
                <span className="font-bold text-foreground">{client.activeProjectsCount || 0} projects</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
