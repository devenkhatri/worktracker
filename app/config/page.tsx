"use client";

import { ConfigVerification } from '@/components/config-verification';

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground">
          Verify and manage your Google Sheets integration settings
        </p>
      </div>

      <ConfigVerification />
    </div>
  );
}