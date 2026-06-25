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
  Users,
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

export function StaffSettings({
  member,
  allMembers = [],
}: {
  member: any;
  allMembers?: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [form, setForm] = useState({
    cardId: member.cardId || "",
    pin: "",
    phone: member.phone || "",
    address: member.address || "",
    age: member.age || "",
    gender: member.gender || "",
    tags: member.tags || "",
    image: member.user?.image || "",
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
    if (
      !confirm(
        "Are you sure you want to reset this member's password? A random password will be generated.",
      )
    ) {
      return;
    }
    setResettingPassword(true);
    const result = await resetMemberPassword(member.id);
    if (result.success) {
      toast.success(`Password reset successful`, {
        duration: 15000,
        description: `New password: ${result.password}. Please copy and share it securely.`,
      });
    } else {
      toast.error(result.error);
    }
    setResettingPassword(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleUpdate} className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User size={20} className="text-[#34A853]" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Manage staff personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <ImageUpload
                  value={form.image ? [form.image] : []}
                  onChange={urls => setForm({ ...form, image: urls[0] || "" })}
                  maxImages={1}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="phone"
                      className="pl-10"
                      placeholder="+254..."
                      value={form.phone}
                      onChange={e =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={form.gender || ""}
                    onValueChange={val => setForm({ ...form, gender: val })}>
                    <SelectTrigger>
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
                  <Label htmlFor="age">Age / Date of Birth</Label>
                  <div className="relative">
                    <Hash
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="age"
                      className="pl-10"
                      placeholder="e.g. 25"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Comma separated)</Label>
                  <div className="relative">
                    <Tag
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="tags"
                      className="pl-10"
                      placeholder="Shift A, Morning, Delivery"
                      value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <Home
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <Input
                    id="address"
                    className="pl-10"
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

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase size={20} className="text-blue-500" />
                Employment Details
              </CardTitle>
              <CardDescription>
                Corporate position and employment contract information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <div className="relative">
                    <Briefcase
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="jobTitle"
                      className="pl-10"
                      placeholder="e.g. Senior Accountant"
                      value={form.jobTitle}
                      onChange={e =>
                        setForm({ ...form, jobTitle: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={form.employmentType || ""}
                    onValueChange={val =>
                      setForm({ ...form, employmentType: val })
                    }>
                    <SelectTrigger>
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
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <Input
                      id="joiningDate"
                      type="date"
                      className="pl-10"
                      value={form.joiningDate}
                      onChange={e =>
                        setForm({ ...form, joiningDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager">Reporting Manager</Label>
                  <Select
                    value={form.managerId || ""}
                    onValueChange={val => setForm({ ...form, managerId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Manager</SelectItem>
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

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Heart size={20} className="text-rose-500" />
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Primary contact in case of an emergency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    placeholder="Full Name"
                    value={form.emergencyContactName}
                    onChange={e =>
                      setForm({ ...form, emergencyContactName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
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
                <Label htmlFor="emergencyRelation">Relationship</Label>
                <Input
                  id="emergencyRelation"
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

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-[#1D1D1F]">
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Lock size={20} className="text-red-500" />
              Security
            </CardTitle>
            <CardDescription>
              Advanced account security settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/30">
              <div className="space-y-1">
                <p className="font-semibold text-sm">Reset Account Password</p>
                <p className="text-xs text-gray-500">
                  This will generate a new random password for the user.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="gap-2">
                <RefreshCcw size={14} />
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard size={20} className="text-orange-500" />
              Identification
            </CardTitle>
            <CardDescription>
              Configure POS and access credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Card ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Scan or enter card ID"
                  value={form.cardId}
                  onChange={e => setForm({ ...form, cardId: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateCard}
                  type="button"
                  title="Generate random Card ID">
                  <RefreshCcw size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>PIN Code (6 digits)</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  maxLength={6}
                  placeholder="Set new PIN"
                  value={form.pin}
                  onChange={e => setForm({ ...form, pin: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleGeneratePin}
                  type="button"
                  title="Generate random 6-digit PIN">
                  <Key size={16} />
                </Button>
              </div>
              <p className="text-[10px] text-gray-500">
                Staff will use this PIN to log in to the POS and perform
                sensitive actions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
