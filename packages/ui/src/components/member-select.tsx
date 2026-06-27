import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, User } from "lucide-react";
import Image from "next/image";

interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
  isActive: "active" | "inactive" | "pending";
  status: "ONLINE" | "OFFLINE";
  username: string;
  isGuest: boolean;
  customRoles: string[];
  tags: string[];
  lastActive?: string;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
}

interface MemberSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeMember?: string;
  filterByRole?: string[];
  filterByStatus?: ("active" | "inactive" | "pending")[];
  showRole?: boolean;
  showDepartment?: boolean;
  members: Member[];
  isLoading?: boolean;
  error?: any;
}

export const MemberSelect: React.FC<MemberSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select a member",
  disabled = false,
  required = false,
  excludeMember,
  filterByRole,
  filterByStatus = ["active"],
  showRole = false,
  showDepartment = false,
  members,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <p className="text-sm text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load members. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Alert variant="default">
        <User className="h-4 w-4" />
        <AlertDescription>No members available.</AlertDescription>
      </Alert>
    );
  }

  // Apply filters
  let filteredMembers = members;

  // Filter out excluded member
  if (excludeMember) {
    filteredMembers = filteredMembers.filter(
      (member) => member.id !== excludeMember,
    );
  }

  // Filter by status using isActive field
  if (filterByStatus && filterByStatus.length > 0) {
    filteredMembers = filteredMembers.filter((member) =>
      filterByStatus.includes(member.isActive),
    );
  }

  // Filter by role
  if (filterByRole && filterByRole.length > 0) {
    filteredMembers = filteredMembers.filter(
      (member) => member.role && filterByRole.includes(member.role),
    );
  }

  // Helper function to format member details
  const formatMemberDetails = (member: Member): string => {
    const details = [];

    if (showRole && member.role) {
      details.push(member.role);
    }

    if (showDepartment && member.customRoles && member.customRoles.length > 0) {
      details.push(member.customRoles.join(", "));
    }

    return details.length > 0 ? details.join(" • ") : member.email;
  };

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || filteredMembers.length === 0}
      required={required}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredMembers.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            <div className="flex items-center gap-2 w-full">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-3 h-3" />
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate">{member.name}</span>
                  {member.isGuest && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                      Guest
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {formatMemberDetails(member)}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
