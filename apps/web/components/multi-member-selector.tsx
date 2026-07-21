"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User as UserIcon, Mail, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { getStaffMembers } from "../app/actions/staff";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import { Badge } from "@repo/ui/components/ui/badge";

interface Member {
  id: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface MultiMemberSelectorProps {
  value?: string[]; // Array of emails
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function MultiMemberSelector({
  value = [],
  onValueChange,
  placeholder = "Select members...",
  className,
  error,
}: MultiMemberSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const result = await getStaffMembers();
        if (result.success && result.data) {
          setMembers(result.data as any);
        }
      } catch (error) {
        console.error("Failed to load members", error);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

  const selectedMembers = members.filter(
    m => value.includes(m.user.email) || value.includes(m.id),
  );

  const toggleMember = (memberEmail: string) => {
    const newValue = value.includes(memberEmail)
      ? value.filter(v => v !== memberEmail)
      : [...value, memberEmail];
    onValueChange(newValue);
  };

  const removeMember = (e: React.MouseEvent, memberEmail: string) => {
    e.stopPropagation();
    onValueChange(value.filter(v => v !== memberEmail));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white min-h-[44px] h-auto py-2 px-3",
            error && "border-red-500",
            className,
          )}>
          <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
            {selectedMembers.length > 0 ? (
              selectedMembers.map(member => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="max-w-[120px] truncate">
                    {member.user.name || member.user.email}
                  </span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={(e) => removeMember(e, member.user.email)}
                  />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start">
        <Command>
          <CommandInput placeholder="Search member by name or email..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading members..." : "No member found."}
            </CommandEmpty>
            <CommandGroup>
              {members.map(member => (
                <CommandItem
                  key={member.id}
                  value={member.user.name + " " + member.user.email}
                  onSelect={() => toggleMember(member.user.email)}
                  className="flex items-center gap-3 py-3">
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    value.includes(member.user.email)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className="h-4 w-4" />
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback>
                      {(member.user.name || member.user.email)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="font-medium truncate">
                      {member.user.name || "Unnamed"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {member.user.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
