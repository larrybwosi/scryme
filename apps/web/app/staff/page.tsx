import React from "react";
import { getStaffMembers } from "../actions/staff";
import { StaffTable } from "../../components/staff/staff-table";
import { PageHeader } from "../../components/page-header";
import { Button } from "@repo/ui/components/ui/button";
import { Plus, Users, Search, Filter, Download } from "lucide-react";
import { AddMemberSheet } from "../../components/staff/add-member-sheet";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";

export default async function StaffPage() {
  const result = await getStaffMembers();
  const members = (result.success ? result.data : []) || [];

  return (
    <div className="flex flex-col gap-6 p-8 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#34A853]/10 rounded-xl flex items-center justify-center text-[#34A853]">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1D1D1F]">Staff Management</h1>
            <p className="text-sm text-gray-500">Manage your organization&apos;s members and their access levels.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-gray-200">
            <Download size={16} />
            <span>Export</span>
          </Button>
          <AddMemberSheet>
            <Button className="gap-2 bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 text-white">
              <Plus size={16} />
              <span>Add Staff Member</span>
            </Button>
          </AddMemberSheet>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-bold">{members.length}</h3>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100">Active</Badge>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-bold">{members.filter(m => m.role === 'ADMIN').length}</h3>
                    <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-100">Privileged</Badge>
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border shadow-sm">
                <p className="text-sm font-medium text-gray-500">Suspended</p>
                <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-bold text-red-600">{members.filter(m => m.membershipStatus === 'SUSPENDED').length}</h3>
                    <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100">Action Required</Badge>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
                placeholder="Search staff by name or email..."
                className="pl-10 bg-white border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-gray-200">
                <Filter size={14} />
                <span>Filters</span>
            </Button>
          </div>
        </div>

        <StaffTable data={members as any} />
      </div>
    </div>
  );
}
