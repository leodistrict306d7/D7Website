'use client';

import React, { useEffect, useState } from 'react';
import { UserCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Evaluation {
  id: string;
  userId: string;
  email: string;
  mappedRole?: {
    name: string;
    position: string;
    group: string;
  };
  scores: Record<string, number>;
  totalScore: number;
  averageScore: number;
  reviewerScoreTotal?: number;
  reviewerScores?: Record<string, number>;
  attendance?: {
    council: string[];
    district: string[];
    md: string[];
  };
  projectData?: {
    servedOnCommittee: boolean;
    projectRole: string;
  };
  openResponses?: {
    selfSatisfaction: string;
    goals: string;
    implementations: string;
    feedback: string;
  };
}

const getBand = (average: number) => {
  if (average >= 4.5) return { label: 'Outstanding', color: 'bg-green-500/20 text-green-700 dark:text-green-400' };
  if (average >= 3.5) return { label: 'Exceeds Expectations', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' };
  if (average >= 2.5) return { label: 'Meets Expectations', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' };
  if (average >= 1.5) return { label: 'Needs Improvement', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' };
  return { label: 'Unsatisfactory', color: 'bg-red-500/20 text-red-700 dark:text-red-400' };
};

const getRoleQuestions = (mappedGroup: string) => {
  const group = mappedGroup || '';
  if (group.includes('Region') || group.includes('Zone')) {
    return [
      { code: 'D1', desc: '1. Have successfully conducted all required club visits and zone/region advisory meetings.' },
      { code: 'D2', desc: '2. Actively supported assigned clubs, helping them troubleshoot issues and achieve their goals.' }
    ];
  } else if (group.includes('Executive')) {
    return [
      { code: 'D1', desc: '1. Successfully fulfilled the core administrative and strategic duties mandated by executive portfolio.' },
      { code: 'D2', desc: '2. Provided strong guidance to dotted-line directors and teams, ensuring their projects stayed on track.' }
    ];
  } else if (group.includes('Team Member')) {
    return [
      { code: 'D1', desc: '1. Successfully delivered all the individual tasks and responsibilities assigned my Team Head.' },
      { code: 'D2', desc: '2. Actively collaborated with fellow team members to ensure portfolio overarching goals were accomplished.' }
    ];
  } else {
    return [
      { code: 'D1', desc: '1. Successfully proposed, planned, and executed the continuous district programs mandated under my portfolio.' },
      { code: 'D2', desc: '2. Effectively managed team/committee members to deliver specific project goals on schedule and to a high standard.' }
    ];
  }
};

const getCriteriaList = (group: string) => {
  const roleSpecificQuestions = getRoleQuestions(group);
  return [
    {
      id: 'C', title: 'Communication & Reporting', items: [
        { code: 'C1', desc: '1. Consistently submitted all periodic reports, meeting minutes, and financial updates on time.' },
        { code: 'C2', desc: '2. Actively monitors official district communication channels and responds within the agreed timelines.' },
        { code: 'C3', desc: '3. Provides regular, proactive updates to direct reporting officer regarding progress and challenges.' },
        { code: 'C4', desc: '4. Ensures all documentation and reports submitted are accurate, comprehensively detailed, and error-free.' }
      ]
    },
    {
      id: 'D', title: 'Leadership & Role Fulfillment', items: [
        ...roleSpecificQuestions,
        { code: 'D3', desc: '3. Actively coordinated with other district officers to ensure alignment across different portfolios.' },
        { code: 'D4', desc: '4. Made a clear, measurable contribution to achieving the overarching district goals linked to specific portfolio.' }
      ]
    },
    {
      id: 'E', title: 'Innovation & Growth', items: [
        { code: 'E1', desc: '1. Actively proposed and successfully implemented new, innovative ideas or improvements to district operations.' },
        { code: 'E2', desc: '2. Took the initiative to mentor junior Leos and actively supported their personal growth within the movement.' },
        { code: 'E3', desc: '3. Demonstrated strong accountability by following through on all commitments without needing continuous reminders.' },
        { code: 'E4', desc: '4. Successfully maintained positive, constructive working relationships with fellow council members and club officers.' }
      ]
    },
    {
      id: 'F', title: 'Overall Conduct & Leoism', items: [
        { code: 'F1', desc: '1. Actively pursued skill development opportunities relevant to the district role.' },
        { code: 'F2', desc: '2. Consistently demonstrated the core Leo values of Leadership, Experience, and Opportunity in daily conduct.' },
        { code: 'F3', desc: '3. Actively promoted Leo District 306D7 mission, visibility, and brand through social media and public engagements.' }
      ]
    }
  ];
};

export default function AdminKpiDashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [sortField, setSortField] = useState<string>('none');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvals = async () => {
      try {
        const response = await fetch('/api/public/kpi-evaluations', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load KPI evaluations');
        }

        const data = await response.json();
        const evals = (data.evaluations || []) as Evaluation[];
        // Sort deferred to active state
        setEvaluations(evals);
      } catch (err) {
        console.error("Failed to load KPIs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvals();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const groups = ['All', 'District Executives', 'Region Directors', 'Zone Directors', 'Team Members', 'Chief Coordinators'];
  
  const sortedEvaluations = filterGroup === 'All' 
    ? [...evaluations] 
    : evaluations.filter(e => (e.mappedRole?.group || 'Unmapped') === filterGroup);

  if (sortField === 'score-desc') {
    sortedEvaluations.sort((a, b) => (b.reviewerScoreTotal ?? b.totalScore) - (a.reviewerScoreTotal ?? a.totalScore));
  } else if (sortField === 'score-asc') {
    sortedEvaluations.sort((a, b) => (a.reviewerScoreTotal ?? a.totalScore) - (b.reviewerScoreTotal ?? b.totalScore));
  } else if (sortField === 'name-asc') {
    // @ts-ignore
    sortedEvaluations.sort((a, b) => (a.mappedRole?.name || a.email).localeCompare(b.mappedRole?.name || b.email));
  } else if (sortField === 'name-desc') {
    // @ts-ignore
    sortedEvaluations.sort((a, b) => (b.mappedRole?.name || b.email).localeCompare(a.mappedRole?.name || a.email));
  }

  return (
    <div className="space-y-8">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-burgundy/10 p-6 shadow-[0_25px_55px_-35px_rgba(113,15,56,0.4)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="heading-serif text-3xl font-bold">KPI District Oversight</h1>
              <p className="max-w-2xl text-sm opacity-80">
                Review officer self-evaluations and track overall performance bands.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
             <Loader2 className="w-8 h-8 animate-spin opacity-50" />
          </div>
        ) : (
          <div className="surface-card rounded-2xl overflow-hidden shadow-glass border border-black/10 dark:border-white/10">
            <div className="p-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5 flex-wrap gap-4">
              <h2 className="font-semibold text-lg">Evaluation Aggregates ({sortedEvaluations.length})</h2>
              <div className="flex items-center gap-3">
                <select 
                  value={sortField} 
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-maroon text-sm"
                >
                  <option value="none">Sort By... (Default List)</option>
                  <option value="score-desc">Score (High to Low)</option>
                  <option value="score-asc">Score (Low to High)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
                <select 
                  value={filterGroup} 
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-maroon text-sm"
                >
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Officer / Position</th>
                    <th className="px-6 py-4 font-semibold text-center">Self Score Total</th>
                    <th className="px-6 py-4 font-semibold text-center">Final Avg</th>
                    <th className="px-6 py-4 font-semibold">Performance Band</th>
                    <th className="px-6 py-4 font-semibold text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {sortedEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center opacity-50">No submissions found.</td>
                    </tr>
                  ) : sortedEvaluations.map((evalDoc) => {
                    const baseScore = evalDoc.reviewerScoreTotal !== undefined ? evalDoc.reviewerScoreTotal : evalDoc.totalScore;
                    const finalAverage = baseScore / 23;
                    const band = getBand(finalAverage);
                    const isExpanded = expandedId === evalDoc.id;

                    return (
                      <React.Fragment key={evalDoc.id}>
                        <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <UserCircle className="w-8 h-8 opacity-40 text-maroon dark:text-rose" />
                              <div>
                                <div className="font-semibold text-base">{evalDoc.mappedRole?.name || evalDoc.email}</div>
                                <div className="text-xs opacity-70">{evalDoc.mappedRole?.position || 'Unmapped'} &bull; {evalDoc.mappedRole?.group}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-mono text-lg font-bold opacity-80">{evalDoc.totalScore}</span>
                            <span className="text-xs opacity-50 block">/ 115</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-mono">{finalAverage.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${band.color}`}>
                              {band.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleExpand(evalDoc.id)}
                              className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors inline-flex justify-center items-center"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 shadow-inner">
                            <td colSpan={5} className="px-6 py-6 border-b-2 border-maroon">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                {/* Section A & B: Attendance and Projects */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-2">Event Attendance</h4>
                                    <div className="space-y-1">
                                      {evalDoc.attendance?.council?.length ? (
                                        <div className="text-xs"><strong className="opacity-80">Council:</strong> {evalDoc.attendance.council.join(', ')}</div>
                                      ) : null}
                                      {evalDoc.attendance?.district?.length ? (
                                        <div className="text-xs"><strong className="opacity-80">District:</strong> {evalDoc.attendance.district.join(', ')}</div>
                                      ) : null}
                                      {evalDoc.attendance?.md?.length ? (
                                        <div className="text-xs"><strong className="opacity-80">MD:</strong> {evalDoc.attendance.md.join(', ')}</div>
                                      ) : null}
                                      {(!evalDoc.attendance?.council?.length && !evalDoc.attendance?.district?.length && !evalDoc.attendance?.md?.length) && (
                                        <div className="text-xs opacity-50 italic">No events attended.</div>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-2">Project Involvement</h4>
                                    {evalDoc.projectData?.servedOnCommittee ? (
                                      <div className="text-sm bg-black/10 dark:bg-white/10 px-3 py-2 rounded">
                                        Served as: <span className="font-bold">{evalDoc.projectData.projectRole}</span>
                                      </div>
                                    ) : (
                                      <div className="text-xs opacity-50 italic">Did not serve on a project committee.</div>
                                    )}
                                  </div>
                                </div>

                                {/* Section C-F Open Responses */}
                                <div className="space-y-4 col-span-1 lg:col-span-2">
                                  <h4 className="font-semibold text-sm uppercase tracking-wider opacity-60 mb-2">Open Reflections & Feedback</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
                                      <div className="text-xs font-bold opacity-60 mb-1">Self Satisfaction & Hindrances</div>
                                      <p className="text-sm opacity-90">{evalDoc.openResponses?.selfSatisfaction || '-'}</p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
                                      <div className="text-xs font-bold opacity-60 mb-1">Goals Achieved</div>
                                      <p className="text-sm opacity-90">{evalDoc.openResponses?.goals || '-'}</p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
                                      <div className="text-xs font-bold opacity-60 mb-1">Implementations & Innovations</div>
                                      <p className="text-sm opacity-90">{evalDoc.openResponses?.implementations || '-'}</p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5">
                                      <div className="text-xs font-bold opacity-60 mb-1">Feedback to District</div>
                                      <p className="text-sm opacity-90">{evalDoc.openResponses?.feedback || '-'}</p>
                                    </div>
                                  </div>
                                </div>

                              </div>

                              {/* Detailed Component Scoring Map */}
                              <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                                <h4 className="font-semibold text-lg uppercase tracking-wider mb-6 flex items-center justify-between">
                                  <span>Detailed Evaluation Review</span>
                                  <span className="text-xs font-normal opacity-60 bg-black/5 dark:bg-white/5 py-1 px-3 rounded-full">Score 1-5</span>
                                </h4>
                                
                                <div className="space-y-8">
                                  {getCriteriaList(evalDoc.mappedRole?.group || '').map(section => (
                                    <div key={section.id} className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl p-5">
                                      <h5 className="font-semibold text-maroon dark:text-rose mb-4">{section.id}. {section.title}</h5>
                                      <div className="space-y-4">
                                        {section.items.map(item => {
                                          const selfScore = evalDoc.scores?.[item.code] || 0;
                                          const adminScore = evalDoc.reviewerScores?.[item.code];
                                          const activeScore = adminScore !== undefined ? adminScore : selfScore;

                                          return (
                                            <div key={item.code} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                              <div className="flex-[3] text-sm opacity-90 pr-4">
                                                <strong className="opacity-60 block text-xs mb-1">{item.code}</strong>
                                                {item.desc}
                                              </div>
                                              <div className="flex-[2] flex flex-col items-end gap-2 shrink-0">
                                                {adminScore !== undefined && (adminScore !== selfScore) && (
                                                  <div className="text-xs opacity-60 text-right w-full">Officer Self-Score: <strong className="line-through">{selfScore}</strong></div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                  {[1, 2, 3, 4, 5].map(val => (
                                                    <span
                                                      key={val}
                                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                                        ${activeScore === val 
                                                          ? adminScore !== undefined ? 'bg-maroon text-white scale-110 shadow-md ring-2 ring-maroon/20' : 'bg-gold text-black scale-105' 
                                                          : 'bg-black/5 dark:bg-white/5 opacity-70'}
                                                      `}
                                                      title={`Score ${val}`}
                                                    >
                                                      {val}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}
