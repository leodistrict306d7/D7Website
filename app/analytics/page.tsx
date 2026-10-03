"use client";
import React from 'react';
import { RoleGuard } from '../../components/role-guard';

export default function AnalyticsPage() {
  return (
    <RoleGuard role={['admin','trainer']}>
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">User Analytics</h1>
        <p className="opacity-80">Integrate Firebase Analytics or Google Analytics. Placeholder widgets can go here.</p>
        <ul className="list-disc pl-6">
          <li>Logins over time</li>
          <li>Course progress by module</li>
          <li>Completions and certificates issued</li>
        </ul>
      </div>
    </RoleGuard>
  );
}