"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { MemberRole } from "@repo/db/client";
import { addStaffMember } from "../../app/actions/staff";
import { createOrgInvitation } from "../../app/actions/invitations";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Download,
  Link as LinkIcon,
  UserPlus,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";

const ROLE_OPTIONS: {
  value: MemberRole;
  label: string;
  description: string;
}[] = [
  {
    value: "OWNER",
    label: "Owner",
    description: "Full control, including billing",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Manage settings and members",
  },
  {
    value: "MANAGER",
    label: "Manager",
    description: "Manage day-to-day operations",
  },
  {
    value: "EMPLOYEE",
    label: "Employee",
    description: "Standard workspace access",
  },
  {
    value: "CASHIER",
    label: "Cashier",
    description: "Point-of-sale access only",
  },
  {
    value: "REPORTER",
    label: "Reporter",
    description: "Read-only reporting access",
  },
];

function RoleBadge({ role }: { role: MemberRole }) {
  const label = ROLE_OPTIONS.find(r => r.value === role)?.label ?? role;
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
      {label}
    </span>
  );
}

export function AddMemberSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"direct" | "invite">("direct");

  // Direct Add state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [lastMember, setLastMember] = useState<{
    name: string;
    email: string;
    role: MemberRole;
    password: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE" as MemberRole,
    password: "",
  });

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("EMPLOYEE");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const generatePassword = useCallback(() => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pwd = "";
    const values = new Uint32Array(12);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < 12; i++) {
      pwd += charset[values[i] % charset.length];
    }
    setFormData(prev => ({ ...prev, password: pwd }));
  }, []);

  // Automatically generate a password whenever the sheet opens
  useEffect(() => {
    if (open) {
      generatePassword();
    }
  }, [open, generatePassword]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset form state cleanly when sheet is closed
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        role: "EMPLOYEE",
        password: "",
      });
      setInviteEmail("");
      setInviteRole("EMPLOYEE");
      setInviteLink(null);
      setInviteCopied(false);
      setActiveTab("direct");
      setShowPassword(false);
      setCopied(false);
      setSuccess(false);
      setIsNewUser(true);
      setLastMember(null);
    }
  };

  const handleCopyPassword = async () => {
    const password = success ? lastMember?.password : formData.password;
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy password");
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      toast.success("Invitation link copied!");
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const downloadCredentials = () => {
    if (!lastMember) return;
    const passwordText = isNewUser
      ? lastMember.password
      : "Use your existing account password";
    const content = `Name: ${lastMember.name}\nEmail: ${lastMember.email}\nRole: ${lastMember.role}\nPassword: ${passwordText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credentials-${lastMember.email}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmitDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addStaffMember(formData);

    if (result.success) {
      toast.success("Staff member added successfully");
      setLastMember({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      });
      setIsNewUser((result as any).isNewUser);
      setSuccess(true);
    } else {
      toast.error(result.error || "Failed to add staff member");
    }
    setLoading(false);
  };

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);

    const result = await createOrgInvitation({
      email: inviteEmail,
      role: inviteRole,
    });

    if (result.success && result.data) {
      toast.success("Invitation link generated!");
      const link = `${window.location.origin}/invite/${result.data.token}`;
      setInviteLink(link);
    } else {
      toast.error(result.error || "Failed to generate invitation link");
    }
    setInviteLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm:max-w-115 p-0 flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              {activeTab === "direct" ? (
                <UserPlus className="h-4 w-4 text-white" strokeWidth={2} />
              ) : (
                <Mail className="h-4 w-4 text-white" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-slate-900 leading-tight">
                {activeTab === "direct"
                  ? success
                    ? "Member added"
                    : "Add staff member"
                  : inviteLink
                    ? "Invitation ready"
                    : "Invite staff member"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-slate-500 mt-0.5">
                {activeTab === "direct"
                  ? success
                    ? "Share their credentials to complete onboarding."
                    : "Create an account with immediate access."
                  : inviteLink
                    ? "Send this link to the recipient to complete setup."
                    : "Send a secure link for them to join on their own."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Tab switcher */}
          {!success && !inviteLink && (
            <div className="px-6 pt-5">
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-md py-1.5 text-sm font-medium transition-all cursor-pointer",
                    activeTab === "direct"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                  onClick={() => setActiveTab("direct")}>
                  Direct add
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md py-1.5 text-sm font-medium transition-all cursor-pointer",
                    activeTab === "invite"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                  onClick={() => setActiveTab("invite")}>
                  Invite via link
                </button>
              </div>
            </div>
          )}

          {/* 1. Direct Add Flow */}
          {activeTab === "direct" &&
            (success ? (
              <div className="px-6 py-5 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-inset ring-emerald-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[13px] font-medium text-emerald-800">
                    {lastMember?.name} now has access to your workspace
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Name
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {lastMember?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Email
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {lastMember?.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Role
                    </span>
                    {lastMember && <RoleBadge role={lastMember.role} />}
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500">
                        Password
                      </span>
                    </div>
                    {isNewUser ? (
                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 truncate rounded-md bg-slate-50 px-2.5 py-1.5 text-[13px] font-mono text-slate-900 ring-1 ring-inset ring-slate-200">
                          {showPassword ? lastMember?.password : "••••••••••••"}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-900"
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-900"
                          onClick={handleCopyPassword}>
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-[13px] text-slate-500">
                        This person already has an account — they should sign in
                        with their existing password.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={downloadCredentials}
                    className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800">
                    <Download size={16} />
                    Download credentials
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="w-full border-slate-200 text-slate-700">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitDirect}
                className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-[13px] font-medium text-slate-700">
                    Full name
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-[13px] font-medium text-slate-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="role"
                    className="text-[13px] font-medium text-slate-700">
                    Organization role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={value =>
                      setFormData({ ...formData, role: value as MemberRole })
                    }>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {
                      ROLE_OPTIONS.find(r => r.value === formData.role)
                        ?.description
                    }
                  </p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-[13px] font-medium text-slate-700">
                      Temporary password
                    </Label>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
                      onClick={generatePassword}>
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Autogenerated password"
                      className="pr-20 font-mono text-[13px] tracking-wide"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-900"
                        onClick={handleCopyPassword}
                        title="Copy password">
                        {copied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-900"
                        onClick={() => setShowPassword(!showPassword)}
                        title={
                          showPassword ? "Hide password" : "Show password"
                        }>
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <ShieldCheck size={12} className="shrink-0" />
                    Share this password with the member through a secure
                    channel.
                  </p>
                </div>
                <DialogFooter className="pt-2 px-0">
                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding staff member...
                      </>
                    ) : (
                      "Add staff member"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ))}

          {/* 2. Invite via Link Flow */}
          {activeTab === "invite" &&
            (inviteLink ? (
              <div className="px-6 py-5 space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-inset ring-emerald-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[13px] font-medium text-emerald-800">
                    Invitation link generated
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Recipient
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {inviteEmail}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-medium text-slate-500">
                      Role
                    </span>
                    <RoleBadge role={inviteRole} />
                  </div>
                  <div className="px-4 py-3 space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">
                      Secure link
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Input
                        readOnly
                        value={inviteLink}
                        className="h-9 text-xs font-mono bg-slate-50 border-slate-200 select-all flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 border-slate-200"
                        onClick={handleCopyInviteLink}>
                        {inviteCopied ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  This link expires after use and grants the selected role once
                  the recipient signs in or creates an account.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={handleCopyInviteLink}
                    className="w-full gap-2 bg-slate-900 text-white hover:bg-slate-800">
                    <LinkIcon size={16} />
                    Copy invitation link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="w-full border-slate-200 text-slate-700">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleGenerateInvite}
                className="px-6 py-5 space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="invite-email"
                    className="text-[13px] font-medium text-slate-700">
                    Recipient email
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="recipient@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-400">
                    They&apos;ll sign in or create an account using this email.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="invite-role"
                    className="text-[13px] font-medium text-slate-700">
                    Organization role
                  </Label>
                  <Select
                    value={inviteRole}
                    onValueChange={value => setInviteRole(value as MemberRole)}>
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">
                    {
                      ROLE_OPTIONS.find(r => r.value === inviteRole)
                        ?.description
                    }
                  </p>
                </div>
                <DialogFooter className="pt-2 px-0">
                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800"
                    disabled={inviteLoading}>
                    {inviteLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating link...
                      </>
                    ) : (
                      "Generate invitation link"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
