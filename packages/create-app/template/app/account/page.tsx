'use client';

import React, { useState } from 'react';
import { useCustomerAuth } from '@/providers/customer-auth-provider';
import { User, LogOut, Package } from 'lucide-react';

export default function AccountPage() {
  const { user, login, logout, isLoading } = useCustomerAuth();
  const [email, setEmail] = useState('');

  if (isLoading) {
    return <div className="p-8 text-center">Loading account details...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <User className="w-12 h-12 text-indigo-600 mx-auto" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Customer Login</h1>
          <p className="text-sm text-zinc-500">Enter your email to sign in to your Scryme account.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(email);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            Sign In / Register
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
            {user.firstName?.[0] || user.email?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Customer Account'}
            </h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/50"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-600" />
          <span>Order History</span>
        </h2>
        <p className="text-sm text-zinc-500">Your recent orders placed with this store will appear here.</p>
      </div>
    </div>
  );
}
