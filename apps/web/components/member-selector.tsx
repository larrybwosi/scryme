"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User as UserIcon, Mail } from "lucide-react";
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

interface Member {
  id: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface MemberSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function MemberSelector({
  value,
  onValueChange,
  placeholder = "Select member...",
  className,
  error,
}: MemberSelectorProps) {
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

  const selectedMember = members.find(
    m => m.user.email === value || m.id === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white h-11",
            error && "border-red-500",
            className,
          )}>
          <div className="flex items-center gap-2 truncate">
            {selectedMember ? (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedMember.user.image || ""} />
                  <AvatarFallback className="text-[10px]">
                    {(selectedMember.user.name || selectedMember.user.email)
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {selectedMember.user.name || selectedMember.user.email}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
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
                  onSelect={() => {
                    // We store the email as it's what the workflows expect for now
                    const newValue = member.user.email;
                    onValueChange(newValue === value ? "" : newValue);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-3">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === member.user.email ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image || ""} />
                    <AvatarFallback>
                      {(member.user.name || member.user.email)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
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
