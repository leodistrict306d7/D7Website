'use client';

import React, { useState } from 'react';
import { COUNCIL_ROLES, CouncilRole } from '../../data/council_roles';
import { Search, UserCheck } from 'lucide-react';

export function RoleMapper({ onMapped }: { onMapped: (role: CouncilRole) => void }) {
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<CouncilRole | null>(null);

  const filteredRoles = COUNCIL_ROLES.filter((r: CouncilRole) => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.position.toLowerCase().includes(query.toLowerCase()) ||
    r.group.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8); // Limits to 8 matches initially for performance

  return (
    <div className="surface-card p-6 md:p-8 rounded-2xl max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-maroon dark:text-petal mb-2">Welcome! Let&apos;s map your profile.</h2>
        <p className="opacity-70 text-sm">Please find and select your designated role on the district council. This links your evaluation submissions to your position.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
        <input 
          type="text"
          placeholder="Search your name or position..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-maroon dark:focus:ring-rose"
        />
      </div>

      <div className="space-y-2 mb-8 max-h-64 overflow-y-auto pr-2">
        {filteredRoles.length > 0 ? (
          filteredRoles.map((role: CouncilRole, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                selectedRole === role 
                  ? 'border-maroon dark:border-rose bg-maroon/5 dark:bg-rose/10 shadow-sm' 
                  : 'border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${selectedRole === role ? 'bg-maroon text-white dark:bg-rose' : 'bg-black/10 dark:bg-white/10 opacity-50'}`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold">{role.name}</div>
                <div className="text-sm opacity-70 mt-1">{role.position} &bull; {role.group}</div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center opacity-50 border border-dashed rounded-xl border-black/20 dark:border-white/20">
            No matching council members found.
          </div>
        )}
      </div>

      <button
        onClick={() => selectedRole && onMapped(selectedRole)}
        disabled={!selectedRole}
        className="w-full py-3 rounded-lg btn-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Confirm & Link Profile
      </button>
    </div>
  );
}
