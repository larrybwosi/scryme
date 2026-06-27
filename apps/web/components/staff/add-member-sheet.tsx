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
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Download,
} from "lucide-react";

export function AddMemberSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [lastMember, setLastMember] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "EMPLOYEE" as MemberRole,
    password: "",
  });

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

  const downloadCredentials = () => {
    if (!lastMember) return;
    const passwordText = isNewUser
      ? lastMember.password
      : "Use your existing account password";
    const content = `Name: ${lastMember.name}\nEmail: ${lastMember.email}\nPassword: ${passwordText}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addStaffMember(formData);

    if (result.success) {
      toast.success("Staff member added successfully");
      setLastMember({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setIsNewUser((result as any).isNewUser);
      setSuccess(true);
    } else {
      toast.error(result.error || "Failed to add staff member");
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[450px]">
        <SheetHeader>
          <SheetTitle>
            {success ? "Member Added Successfully" : "Add Staff Member"}
          </SheetTitle>
          <SheetDescription>
            {success
              ? "The new staff member has been added. You can now download their credentials or copy the password."
              : "Add a new member to your organization. They will be able to log in with the provided email and password."}
          </SheetDescription>
        </SheetHeader>

        {success ? (
          <div className="space-y-6 py-8">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600 uppercase font-bold tracking-wider">
                  Name
                </Label>
                <p className="text-sm font-medium text-emerald-900">
                  {lastMember?.name}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600 uppercase font-bold tracking-wider">
                  Email
                </Label>
                <p className="text-sm font-medium text-emerald-900">
                  {lastMember?.email}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600 uppercase font-bold tracking-wider">
                  Password
                </Label>
                {isNewUser ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-medium text-emerald-900 flex-1 truncate">
                      {showPassword
                        ? lastMember?.password
                        : "••••••••••••"}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                        onClick={() => setShowPassword(!showPassword)}
                      >
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
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                        onClick={handleCopyPassword}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-emerald-700">
                    User already has an account. Please use their existing
                    password.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={downloadCredentials}
                className="w-full gap-2 bg-zinc-900 text-white"
              >
                <Download size={16} />
                Download Credentials (.txt)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full border-zinc-200"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
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
          <div className="space-y-2">
            <Label htmlFor="role">Organization Role</Label>
            <Select
              value={formData.role}
              onValueChange={value =>
                setFormData({ ...formData, role: value as MemberRole })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
                <SelectItem value="REPORTER">Reporter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={generatePassword}>
                <RefreshCw size={12} />
                Regenerate
              </Button>
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
                className="pr-20 font-mono tracking-wide"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyPassword}
                  title="Copy password">
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Please share this password with the member securely.
            </p>
          </div>
          <SheetFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Staff Member...
                </>
              ) : (
                "Add Staff Member"
              )}
            </Button>
          </SheetFooter>
        </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
