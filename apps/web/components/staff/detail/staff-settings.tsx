"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import {
  CreditCard,
  Key,
  RefreshCcw,
  User,
  Save,
  Phone,
  Home,
  Hash,
  Tag,
  Lock,
  Briefcase,
  Calendar,
  Heart,
  Loader2,
  Mail,
} from "lucide-react";
import {
  updateMemberCustomization,
  generateMemberPin,
  generateMemberCardId,
  resetMemberPassword,
} from "../../../app/actions/staff";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { ImageUpload } from "../../image-upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

export function StaffSettings({
  member,
  allMembers = [],
}: {
  member: any;
  allMembers?: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [form, setForm] = useState({
    cardId: member.cardId || "",
    pin: "",
    phone: member.phone || "",
    address: member.address || "",
    age: member.age || "",
    gender: member.gender || "",
    tags: member.tags || "",
    image: member.user?.image || "",
    name: member.user?.name || "",
    email: member.user?.email || "",
    jobTitle: member.jobTitle || "",
    employmentType: member.employmentType || "",
    joiningDate: member.joiningDate
      ? new Date(member.joiningDate).toISOString().split("T")[0]
      : "",
    emergencyContactName: member.emergencyContactName || "",
    emergencyContactPhone: member.emergencyContactPhone || "",
    emergencyContactRelation: member.emergencyContactRelation || "",
    managerId: member.managerId || "",
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateMemberCustomization(member.id, form);
    if (result.success) {
      toast.success("Settings updated successfully");
      setForm(prev => ({ ...prev, pin: "" }));
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleGeneratePin = async () => {
    const result = await generateMemberPin(member.id);
    if (result.success) {
      toast.success(`PIN updated to: ${result.pin}`, {
        duration: 10000,
        description: "Please share this with the staff member securely.",
      });
    } else {
      toast.error(result.error);
    }
  };

  const handleGenerateCard = async () => {
    const result = await generateMemberCardId(member.id);
    if (result.success) {
      toast.success(`Card ID updated to: ${result.cardId}`);
      setForm(prev => ({ ...prev, cardId: result.cardId }));
    } else {
      toast.error(result.error);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    const result = await resetMemberPassword(member.id);
    if (result.success) {
      toast.success(`Password reset successful`, {
        duration: 15000,
        description: `New password: ${result.password}. Please copy and share it securely.`,
      });
      setShowResetConfirm(false);
    } else {
      toast.error(result.error);
    }
    setResettingPassword(false);
  };

  return (
    <div className="bg-background">
      <form onSubmit={handleUpdate} className="">
        {/* Sticky header with Save button */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-background/95 backdrop-blur-sm border-b border-border px-1 py-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Staff Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              {form.name || member.user?.email || "Manage staff details"}
            </p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <User size={20} className="text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage staff personal details and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Profile Image</Label>
                    <ImageUpload
                      value={form.image ? [form.image] : []}
                      onChange={urls =>
                        setForm({ ...form, image: urls[0] || "" })
                      }
                      maxImages={1}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Full Name</Label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="name"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="e.g. John Doe"
                          value={form.name}
                          onChange={e =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="e.g. john@example.com"
                          value={form.email}
                          onChange={e =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="phone"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="+254..."
                          value={form.phone}
                          onChange={e =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-foreground">Gender</Label>
                      <Select
                        value={form.gender || undefined}
                        onValueChange={val =>
                          setForm({ ...form, gender: val })
                        }>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-foreground">Age / Date of Birth</Label>
                      <div className="relative">
                        <Hash
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="age"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="e.g. 25"
                          value={form.age}
                          onChange={e =>
                            setForm({ ...form, age: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags" className="text-foreground">Tags (Comma separated)</Label>
                      <div className="relative">
                        <Tag
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="tags"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="Shift A, Morning, Delivery"
                          value={form.tags}
                          onChange={e =>
                            setForm({ ...form, tags: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-foreground">Address</Label>
                    <div className="relative">
                      <Home
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <Input
                        id="address"
                        className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                        placeholder="Full residential address"
                        value={form.address}
                        onChange={e =>
                          setForm({ ...form, address: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Briefcase size={20} className="text-blue-500" />
                    Employment Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Corporate position and employment contract information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="text-foreground">Job Title</Label>
                      <div className="relative">
                        <Briefcase
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="jobTitle"
                          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                          placeholder="e.g. Senior Accountant"
                          value={form.jobTitle}
                          onChange={e =>
                            setForm({ ...form, jobTitle: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentType" className="text-foreground">Employment Type</Label>
                      <Select
                        value={form.employmentType || undefined}
                        onValueChange={val =>
                          setForm({ ...form, employmentType: val })
                        }>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full-time</SelectItem>
                          <SelectItem value="PART_TIME">Part-time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERN">Intern</SelectItem>
                          <SelectItem value="TEMPORARY">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="joiningDate" className="text-foreground">Joining Date</Label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <Input
                          id="joiningDate"
                          type="date"
                          className="pl-10 bg-background border-border text-foreground"
                          value={form.joiningDate}
                          onChange={e =>
                            setForm({ ...form, joiningDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager" className="text-foreground">Reporting Manager</Label>
                      <Select
                        value={form.managerId || "none"}
                        onValueChange={val =>
                          setForm({
                            ...form,
                            managerId: val === "none" ? "" : val,
                          })
                        }>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {allMembers
                            .filter(m => m.id !== member.id)
                            .map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.user?.name || m.user?.email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Heart size={20} className="text-rose-500" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Primary contact in case of an emergency.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName" className="text-foreground">Contact Name</Label>
                      <Input
                        id="emergencyName"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                        placeholder="Full Name"
                        value={form.emergencyContactName}
                        onChange={e =>
                          setForm({
                            ...form,
                            emergencyContactName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone" className="text-foreground">Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                        placeholder="+254..."
                        value={form.emergencyContactPhone}
                        onChange={e =>
                          setForm({
                            ...form,
                            emergencyContactPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelation" className="text-foreground">Relationship</Label>
                    <Input
                      id="emergencyRelation"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                      placeholder="e.g. Spouse, Parent, Sibling"
                      value={form.emergencyContactRelation}
                      onChange={e =>
                        setForm({
                          ...form,
                          emergencyContactRelation: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Lock size={20} className="text-destructive" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Advanced account security settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/10">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">
                        Reset Account Password
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This will generate a new random password for the user.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={resettingPassword}
                      className="gap-2">
                      <RefreshCcw size={14} />
                      Reset Password
                    </Button>

                    <AlertDialog
                      open={showResetConfirm}
                      onOpenChange={setShowResetConfirm}>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This will reset the member&apos;s password and
                            generate a new random one. The current password will
                            no longer work.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={resettingPassword}
                            className="bg-background border-border text-foreground hover:bg-accent hover:text-foreground">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={e => {
                              e.preventDefault();
                              handleResetPassword();
                            }}
                            disabled={resettingPassword}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {resettingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              "Reset Password"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-[72px] self-start">
              <Card className="border-border shadow-sm bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <CreditCard size={20} className="text-orange-500" />
                    Identification
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Configure POS and access credentials.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Card ID</Label>
                    <div className="flex gap-2">
                      <Input
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                        placeholder="Scan or enter card ID"
                        value={form.cardId}
                        onChange={e =>
                          setForm({ ...form, cardId: e.target.value })
                        }
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleGenerateCard}
                            type="button"
                            aria-label="Generate random Card ID"
                            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                            <RefreshCcw size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generate random Card ID</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">PIN Code (6 digits)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        maxLength={6}
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                        placeholder="Set new PIN"
                        value={form.pin}
                        onChange={e =>
                          setForm({ ...form, pin: e.target.value })
                        }
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleGeneratePin}
                            type="button"
                            aria-label="Generate random 6-digit PIN"
                            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent">
                            <Key size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Generate random 6-digit PIN
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Staff will use this PIN to log in to the POS and perform
                      sensitive actions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
