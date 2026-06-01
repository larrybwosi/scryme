import React from 'react';
import { useAuth } from '@/lib/providers/auth-context';
import { Button } from '@repo/ui/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@repo/ui/components/ui/avatar';

export const UserSwitcher: React.FC = () => {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <div className="p-4 border-b border-sidebar-border/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold truncate leading-tight">{user.name}</span>
            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-medium">
              {user.role || 'Operator'}
            </span>
          </div>
        </div>
        <Button
          onClick={() => logout()}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
