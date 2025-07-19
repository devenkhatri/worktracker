"use client";

import { UserProfile } from '@/components/user-profile';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          View your account information and login history
        </p>
      </div>

      <div className="max-w-2xl">
        <UserProfile />
      </div>
    </div>
  );
}