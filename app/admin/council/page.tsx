"use client";

export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { RoleGuard } from '../../../components/role-guard';
import { db } from '../../../lib/firebase';
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';

export default function AdminCouncilPage() {
  return (
    <RoleGuard role={['admin']}>
      <CouncilManager />
    </RoleGuard>
  );
}

function CouncilManager() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');

  const load = async () => {
    const snap = await getDocs(collection(db, 'council'));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await addDoc(collection(db, 'council'), { name, role, createdAt: serverTimestamp() });
    setName('');
    setRole('Member');
    await load();
  };

  const del = async (id: string) => {
    await deleteDoc(doc(db, 'council', id));
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Council Members</h1>
      <div className="flex flex-col sm:flex-row gap-2">
        <input className="border rounded px-2 py-1 flex-1 bg-transparent" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" />
        <input className="border rounded px-2 py-1 bg-transparent" value={role} onChange={(e)=>setRole(e.target.value)} placeholder="Role" />
        <button onClick={add} className="px-3 py-1 rounded bg-blue-600 text-white">Add</button>
      </div>
      <ul className="space-y-2">
        {items.map(p => (
          <li key={p.id} className="flex items-center justify-between border rounded px-3 py-2">
            <span>{p.name} – {p.role}</span>
            <button onClick={()=>del(p.id)} className="text-sm text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}