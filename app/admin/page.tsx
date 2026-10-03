'use client';

import Link from 'next/link';
import { RoleGuard } from '@/components/role-guard';

const ADMIN_LINKS = [
  {
    href: '/admin/projects',
    label: 'Manage Projects',
    description: 'Create, update, and curate district project stories with rich galleries.',
  },
  {
    href: '/admin/lms',
    label: 'Manage Training Modules',
    description: 'Build structured learning journeys with modules, quizzes, and requirements.',
  },
  {
    href: '/admin/all-rounders',
    label: 'Manage All-Rounders',
    description: 'Celebrate outstanding Leos with monthly highlights and photo galleries.',
  },
  {
    href: '/admin/ascent',
    label: 'Manage Ascent Newsletter',
    description: 'Embed and feature the latest digital newsletter issues from Heyzine.',
  },
  {
    href: '/admin/merch',
    label: 'Manage Merch Orders',
    description: 'View and export district t-shirt orders, verify payment slips, and manage inventory.',
  },
  {
    href: '/admin/kpi',
    label: 'KPI Management (Dist. President)',
    description: 'Review officer self-evaluations, determine final assessment scores, and track performance bands.',
  },
];

export default function AdminHome() {
  return (
    <RoleGuard role={['admin', 'trainer']}>
      <div className="space-y-8">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-rose/10 p-6 shadow-[0_25px_55px_-35px_rgba(225,173,54,0.4)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="heading-serif text-3xl font-bold">Admin Dashboard</h1>
              <p className="max-w-2xl text-sm opacity-80">
                Access mission-critical tools for maintaining district content, training resources, monthly highlights, and newsletters. Each workspace includes draft-safe editing, intuitive validation, and quick links to published stories.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              All systems operational
            </div>
          </div>
        </header>

        <nav aria-label="Admin sections">
          <ul className="grid gap-4 lg:grid-cols-2">
            {ADMIN_LINKS.map(({ href, label, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group block h-full rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-200 hover:border-burgundy/40 hover:bg-white/10 hover:shadow-[0_18px_35px_-28px_rgba(113,15,56,0.7)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
                    <span
                      aria-hidden
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy/20 text-base text-burgundy transition group-hover:bg-burgundy group-hover:text-white"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-3 text-sm opacity-70">{description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </RoleGuard>
  );
}