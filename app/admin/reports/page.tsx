"use client";

export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../../../components/role-guard';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ReportsPage() {
  return (
    <RoleGuard role={['admin','trainer']}>
      <Reports />
    </RoleGuard>
  );
}

function Reports() {
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'attempts'));
      setAttempts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  const download = () => {
    const rows = [
      ['id', 'quizId', 'uid', 'score', 'total', 'at'],
      ...attempts.map((a) => [a.id, a.quizId, a.uid ?? '', a.score, a.total, (a.at?.toDate?.() ?? a.at ?? '').toString()])
    ];
    const csv = rows.map((r) => r.map((v) => JSON.stringify(v ?? '')).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'report-attempts.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>
      <button onClick={download} className="px-3 py-1 rounded bg-blue-600 text-white">Download Attempts CSV</button>
      <div className="text-sm opacity-70">Rows: {attempts.length}</div>
    </div>
  );
}