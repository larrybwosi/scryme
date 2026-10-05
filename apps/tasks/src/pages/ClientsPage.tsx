import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Building2, Mail, Plus } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

export default function ClientsPage() {
  const clients = useTaskStore((state) => state.clients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    const newClient = {
      id: `client-${Date.now()}`,
      name,
      company,
      email: email || `contact@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      activeProjectsCount: 1,
      status: 'ACTIVE' as const,
    };

    useTaskStore.setState((state) => ({
      clients: [...state.clients, newClient],
    }));

    setIsModalOpen(false);
    setName('');
    setCompany('');
    setEmail('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Client Accounts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Directory of organization clients, associated projects, and primary contacts.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 text-xs shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Add Client Account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">New Client Organization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Company / Client Name</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Health Corp"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Primary Contact Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rachel Adams"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rachel@acmehealth.com"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs">
                  Create Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="p-4 hover:shadow-xs transition-shadow space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-foreground leading-tight">{client.company}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{client.name}</p>
                </div>
              </div>

              <Badge variant="secondary" className="text-[10px] font-semibold">
                {client.activeProjectsCount || 1} Projects
              </Badge>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0 text-indigo-500" />
                <span className="truncate">{client.email}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
