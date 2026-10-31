"use client";

import React, { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  access: "Admin" | "Maintainer" | "Developer" | "Guest";
  avatar: string;
  assignedTasks: number;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "tm-1",
    name: "Elena Rostova",
    role: "Lead Frontend Engineer",
    email: "elena@scryme.tech",
    access: "Admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    assignedTasks: 8,
  },
  {
    id: "tm-2",
    name: "Marcus Vance",
    role: "Senior Graphics & WebGL",
    email: "marcus@scryme.tech",
    access: "Maintainer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    assignedTasks: 6,
  },
  {
    id: "tm-3",
    name: "Sarah Chen",
    role: "Security & IAM Architect",
    email: "sarah@scryme.tech",
    access: "Maintainer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    assignedTasks: 4,
  },
  {
    id: "tm-4",
    name: "David Kim",
    role: "Distributed Systems Lead",
    email: "david@scryme.tech",
    access: "Developer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    assignedTasks: 5,
  },
];

export function TeamTab() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");

  const filteredTeam = team.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAccessChange = (id: string, newAccess: TeamMember["access"]) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === id ? { ...m, access: newAccess } : m))
    );
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      role: inviteRole,
      email: inviteEmail.trim(),
      access: "Developer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
      assignedTasks: 0,
    };

    setTeam([...team, newMember]);
    setInviteEmail("");
    setIsInviteOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Project Squad & Permissions
          </h2>
          <p className="text-body-sm text-outline">
            PRJ-204 Granular Matrix • 4 Active Engineers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter squad members..."
              className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Invite Member to PRJ-204</h3>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="engineer@scryme.tech"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Role</label>
                <input
                  type="text"
                  placeholder="e.g. Systems Engineer"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Squad Members Table */}
      <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
        <table className="w-full text-left font-body-sm">
          <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
            <tr>
              <th className="px-4 py-2.5">Member</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Access Level</th>
              <th className="px-4 py-2.5">Assigned Tasks</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filteredTeam.map((member) => (
              <tr key={member.id} className="hover:bg-surface-container transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant"
                    />
                    <div>
                      <div className="font-headline-sm text-body-sm text-on-surface font-medium">{member.name}</div>
                      <div className="text-[11px] text-outline font-label-code">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-on-surface-variant">{member.role}</td>
                <td className="px-4 py-3">
                  <select
                    value={member.access}
                    onChange={(e) => handleAccessChange(member.id, e.target.value as TeamMember["access"])}
                    className="bg-surface-container border border-outline-variant/30 text-on-surface text-[12px] rounded px-2 py-1"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Maintainer">Maintainer</option>
                    <option value="Developer">Developer</option>
                    <option value="Guest">Guest</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-label-code text-[12px] text-on-surface font-medium">
                  {member.assignedTasks} issues
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setTeam(team.filter((m) => m.id !== member.id))}
                    className="text-outline hover:text-red-400 p-1 transition-colors"
                    title="Remove Member"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove_circle_outline</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
