'use client';

import React, { useState } from 'react';
import { useFirebase } from '../../providers/firebase-provider';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Loader2, Info, Check } from 'lucide-react';
import { User } from 'firebase/auth';

const DISTRICT_EVENTS = [
  'Ashirwada Yathra',
  'District Piritha',
  'Charter District Installation Ceremony',
  'D7 Ignition',
  'NGP Forum I',
  'Pandama - Mid-Year Review',
  'D7 Youth Camp',
  'NGP Forum II & District Outing',
  'Mass Induction',
  'D7 Saviya'
];

const COUNCIL_EVENTS = [
  '1st Council Meeting',
  '2nd Council Meeting',
  '3rd Council Meeting'
];

const MD_EVENTS = [
  'Multiple District Ashirwadha Poojawa',
  'MD Installation Ceremony',
  'MD Mid-Year Review',
  'MD Council Outing',
  'Leo Olympics',
  "MD Risers' Walk"
];

const SELF_ASSESSMENT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' }
];

export function KpiForm({ user, userData, onComplete }: { user: User; userData: any; onComplete?: (data: any) => void }) {
  const { db } = useFirebase();
  const [loading, setLoading] = useState(false);

  // Section A: Attendance sets
  const [attendedCouncil, setAttendedCouncil] = useState<Set<string>>(new window.Set());
  const [attendedDistrict, setAttendedDistrict] = useState<Set<string>>(new window.Set());
  const [attendedMD, setAttendedMD] = useState<Set<string>>(new window.Set());

  // Section B: Projects
  const [projectData, setProjectData] = useState({
    servedOnCommittee: false,
    projectRole: ''
  });

  // Section C-F: 1-5 Scores
  const [scores, setScores] = useState<Record<string, number>>({});

  // Open Responses
  const [openResponses, setOpenResponses] = useState({
    selfSatisfaction: '',
    goals: '',
    implementations: '',
    feedback: ''
  });

  const toggleEvent = (eventList: string[], currentState: Set<string>, setState: React.Dispatch<React.SetStateAction<Set<string>>>, eventName: string) => {
    const newSet = new window.Set(currentState);
    if (newSet.has(eventName)) {
      newSet.delete(eventName);
    } else {
      newSet.add(eventName);
    }
    setState(newSet);
  };

  const getRoleQuestions = (mappedGroup: string) => {
    const group = mappedGroup || '';
    if (group.includes('Region') || group.includes('Zone')) {
      return [
        { code: 'D1', desc: 'I have successfully conducted all required club visits and zone/region advisory meetings during this period.' },
        { code: 'D2', desc: 'I actively supported my assigned clubs, helping them troubleshoot issues and achieve their goals.' }
      ];
    } else if (group.includes('Executive')) {
      return [
        { code: 'D1', desc: 'I successfully fulfilled the core administrative and strategic duties mandated by my executive portfolio.' },
        { code: 'D2', desc: 'I provided strong guidance to my dotted-line directors and teams, ensuring their projects stayed on track.' }
      ];
    } else if (group.includes('Team Member')) {
      return [
        { code: 'D1', desc: 'I successfully delivered all the individual tasks and responsibilities assigned to me by my Team Head.' },
        { code: 'D2', desc: 'I actively collaborated with my fellow team members to ensure our portfolio\'s overarching goals were accomplished.' }
      ];
    } else {
      // Default for Team Heads, Chief Coordinators, Directors
      return [
        { code: 'D1', desc: 'I successfully proposed, planned, and executed the continuous district programs mandated under my portfolio.' },
        { code: 'D2', desc: 'I effectively managed my team/committee members to deliver our specific project goals on schedule and to a high standard.' }
      ];
    }
  };

  const getApplicableDistrictEvents = (group?: string) => {
    const g = group || '';
    const isExec = g.toLowerCase().includes('executive');
    const isRegion = g.toLowerCase().includes('region');
    const isZone = g.toLowerCase().includes('zone');
    
    return DISTRICT_EVENTS.filter(e => {
      if (e === 'NGP Forum I') return isExec || isRegion;
      if (e === 'D7 Ignition') return isExec || isRegion || isZone;
      return true;
    });
  };

  const roleSpecificQuestions = getRoleQuestions(userData?.mappedRole?.group);
  const applicableDistrictEvents = getApplicableDistrictEvents(userData?.mappedRole?.group);

  const getCriteriaList = () => {
    return [
      {
        id: 'C', title: 'Communication & Reporting', items: [
          { code: 'C1', desc: 'I have consistently submitted all my periodic reports, meeting minutes, and financial updates on time.' },
          { code: 'C2', desc: 'I actively monitor official district communication channels and respond within the agreed timelines.' },
          { code: 'C3', desc: 'I provide regular, proactive updates to my direct reporting officer regarding my progress and challenges.' },
          { code: 'C4', desc: 'I ensure that all documentation and reports I submit are accurate, comprehensively detailed, and error-free.' }
        ]
      },
      {
        id: 'D', title: 'Leadership & Role Fulfillment', items: [
          ...roleSpecificQuestions,
          { code: 'D3', desc: 'I have actively coordinated with other district officers to ensure alignment across different portfolios.' },
          { code: 'D4', desc: 'I have made a clear, measurable contribution to achieving the overarching district goals linked to my specific portfolio.' }
        ]
      },
      {
        id: 'E', title: 'Innovation & Growth', items: [
          { code: 'E1', desc: 'I actively proposed and successfully implemented new, innovative ideas or improvements to district operations.' },
          { code: 'E2', desc: 'I took the initiative to mentor junior Leos and actively supported their personal growth within the movement.' },
          { code: 'E3', desc: 'I demonstrated strong accountability by following through on all my commitments without needing continuous reminders.' },
          { code: 'E4', desc: 'I successfully maintained positive, constructive working relationships with fellow council members and club officers.' }
        ]
      },
      {
        id: 'F', title: 'Overall Conduct & Leoism', items: [
          { code: 'F1', desc: 'I actively pursued skill development opportunities (such as the Rangers Workshop) relevant to my district role.' },
          { code: 'F2', desc: 'I consistently demonstrated the core Leo values of Leadership, Experience, and Opportunity in my daily professional conduct.' },
          { code: 'F3', desc: 'I actively promoted Leo District 306D7\'s mission, visibility, and brand through social media and public engagements.' }
        ]
      }
    ];
  };

  const calculateTotal = () => {
    let total = 0;

    // Sect A max 20 based on attendance average
    const totalApplicableEventsCount = COUNCIL_EVENTS.length + applicableDistrictEvents.length + MD_EVENTS.length;
    const attendancePercent = (attendedCouncil.size + attendedDistrict.size + attendedMD.size) / totalApplicableEventsCount || 0;
    total += Math.round(attendancePercent * 20);

    // Sect B max 20
    if (projectData.servedOnCommittee) {
      total += 5;
      if (projectData.projectRole === 'Chairperson') total += 15;
      else if (projectData.projectRole === 'Secretary' || projectData.projectRole === 'Treasurer') total += 10;
      else if (projectData.projectRole === 'Committee Member') total += 5;
    }

    // Sect C-F (15 items * 5 = 75 points max)
    const criteriaScores = Object.values(scores).reduce((a, b) => a + (b || 0), 0);
    total += criteriaScores;

    return Math.min(total, 115);
  };

  const totalScore = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const answeredCount = Object.keys(scores).length;
    if (answeredCount < 15) {
      alert(`Please assign a score to all Self-Assessment criteria. You have rated ${answeredCount}/15.`);
      const firstMissing = getCriteriaList().flatMap(s => s.items).find(i => !scores[i.code]);
      if (firstMissing) {
        document.getElementById(`criterion-${firstMissing.code}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (projectData.servedOnCommittee && !projectData.projectRole) {
      alert('Please select your project role under Section B.');
      return;
    }

    setLoading(true);
    try {
      if (!db) return;
      const evalRef = doc(db, 'evaluations', user.uid);
      
      // Ensure we don't save events that aren't applicable to this user in case they selected them prior to a role change
      const validDistrictAttendance = Array.from(attendedDistrict).filter(e => applicableDistrictEvents.includes(e));

      const dataToSave = {
        userId: user.uid,
        email: user.email,
        mappedRole: userData?.mappedRole,
        attendance: {
          council: Array.from(attendedCouncil),
          district: validDistrictAttendance,
          md: Array.from(attendedMD)
        },
        projectData,
        scores,
        openResponses,
        totalScore,
        averageScore: totalScore / 23,
        submittedAt: serverTimestamp(),
      };
      
      await setDoc(evalRef, dataToSave);
      
      if (onComplete) {
        onComplete(dataToSave);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEventCheckboxes = (title: string, events: string[], currentState: Set<string>, setState: React.Dispatch<React.SetStateAction<Set<string>>>) => (
    <div className="mb-6">
      <h4 className="font-semibold text-lg mb-3 opacity-90">{title}</h4>
      <div className="flex flex-wrap gap-3">
        {events.map((eventName) => {
          const isSelected = currentState.has(eventName);
          return (
            <button
              key={eventName}
              type="button"
              onClick={() => toggleEvent(events, currentState, setState, eventName)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 shadow-sm ${isSelected
                  ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400 dark:bg-green-500/20'
                  : 'bg-white/50 dark:bg-black/30 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 hover:shadow-md'
                }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${isSelected ? 'bg-green-500 border-green-500 text-white' : 'border-black/20 dark:border-white/20 bg-white dark:bg-black'}`}>
                {isSelected && <Check className="w-3 h-3" strokeWidth={3} />}
              </div>
              {eventName}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-20">

      <div className="surface-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between border-maroon/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-maroon via-gold to-maroon"></div>
        <div>
          <h2 className="text-2xl font-bold text-maroon dark:text-petal mb-1">Self Assessment Questionnaire</h2>
          <p className="opacity-80 text-sm">Reviewing your performance as: <strong>{userData?.mappedRole?.name} ({userData?.mappedRole?.position})</strong></p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-100 p-5 rounded-2xl flex gap-4 text-sm leading-relaxed shadow-sm">
        <Info className="w-6 h-6 flex-shrink-0 text-blue-500" />
        <p>This is a self-assessment. Answer truthfully reflecting on your tenure. Click the events you attended, select your exact project role, and score yourself using the agreement levels for the detailed statements.</p>
      </div>

      {/* SECTION A: ATTENDANCE */}
      <div className="surface-card p-8 rounded-2xl border-l-4 border-l-maroon shadow-sm">
        <h3 className="text-xl font-bold text-maroon dark:text-petal mb-6 pb-2 border-b border-black/10 dark:border-white/10 heading-serif">
          A. Event Participation
        </h3>
        {renderEventCheckboxes('Council Meetings', COUNCIL_EVENTS, attendedCouncil, setAttendedCouncil)}
        {renderEventCheckboxes('District Events', applicableDistrictEvents, attendedDistrict, setAttendedDistrict)}
        {renderEventCheckboxes('Multiple District Events', MD_EVENTS, attendedMD, setAttendedMD)}
      </div>

      {/* SECTION B: PROJECTS */}
      <div className="surface-card p-8 rounded-2xl border-l-4 border-l-gold shadow-sm">
        <h3 className="text-xl font-bold text-maroon dark:text-petal mb-6 pb-2 border-b border-black/10 dark:border-white/10 heading-serif">
          B. Project / Committee Involvement
        </h3>
        <div className="space-y-6">
          <label className="flex items-center gap-4 p-5 rounded-2xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors shadow-sm bg-white/50 dark:bg-black/30">
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${projectData.servedOnCommittee ? 'bg-maroon border-maroon text-white' : 'border-black/20 dark:border-white/20'}`}>
              {projectData.servedOnCommittee && <Check className="w-4 h-4" strokeWidth={3} />}
            </div>
            <input
              type="checkbox"
              checked={projectData.servedOnCommittee}
              onChange={(e) => setProjectData(p => ({ ...p, servedOnCommittee: e.target.checked }))}
              className="hidden"
            />
            <span className="font-semibold text-lg opacity-90">I served on at least one district project committee.</span>
          </label>

          {projectData.servedOnCommittee && (
            <div className="p-6 border border-black/10 dark:border-white/10 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block font-semibold mb-4 opacity-90">What was your highest role on a committee?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {['Chairperson', 'Secretary', 'Treasurer', 'Committee Member'].map((role) => (
                  <label key={role} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center h-full shadow-sm hover:shadow-md ${projectData.projectRole === role ? 'border-maroon bg-maroon/5 text-maroon dark:text-rose' : 'border-black/10 dark:border-white/10 hover:border-maroon/30'}`}>
                    <input
                      type="radio"
                      name="projectRole"
                      value={role}
                      checked={projectData.projectRole === role}
                      onChange={(e) => setProjectData(p => ({ ...p, projectRole: e.target.value }))}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full mb-3 border-2 flex items-center justify-center ${projectData.projectRole === role ? 'border-maroon' : 'border-black/20 dark:border-white/20'}`}>
                      {projectData.projectRole === role && <div className="w-2.5 h-2.5 rounded-full bg-maroon" />}
                    </div>
                    <span className="font-medium text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION C-F: 1-5 ASSESSMENT (Likert Scale Circles) */}
      {getCriteriaList().map((section) => (
        <div key={section.id} className="surface-card p-8 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-maroon dark:text-petal mb-8 pb-3 border-b border-black/10 dark:border-white/10 heading-serif">
            Section {section.id}: {section.title}
          </h3>
          <div className="space-y-8">
            {section.items.map((item) => (
              <div key={item.code} id={`criterion-${item.code}`} className="space-y-4">
                <p className="font-medium text-lg leading-relaxed opacity-90">
                  <span className="font-bold text-maroon dark:text-rose mr-2">{item.code}.</span>
                  {item.desc}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 lg:gap-2 justify-between items-stretch sm:items-start bg-black/[0.02] dark:bg-white/[0.02] p-2 sm:p-3 rounded-2xl border border-black/5 dark:border-white/5">
                  {SELF_ASSESSMENT_OPTIONS.map((opt) => {
                    const isSelected = scores[item.code] === opt.value;
                    return (
                      <label key={opt.value} className={`flex flex-row sm:flex-col items-center sm:justify-start justify-start gap-3 sm:gap-3 p-3 sm:p-4 rounded-xl cursor-pointer flex-1 transition-all ${isSelected ? 'bg-maroon text-white shadow-md sm:-translate-y-1' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}>
                        <input
                          type="radio"
                          name={item.code}
                          value={opt.value}
                          checked={isSelected}
                          onChange={(e) => setScores(s => ({ ...s, [item.code]: Number(e.target.value) }))}
                          className="hidden"
                        />
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-black/20 dark:border-white/20 bg-white dark:bg-black'}`}>
                          <span className={`text-sm sm:text-base font-bold ${isSelected ? 'text-white' : 'text-transparent'}`}>{opt.value}</span>
                        </div>
                        <span className={`text-sm font-semibold sm:text-center text-left leading-tight ${isSelected ? 'text-white' : ''}`}>
                          {opt.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* OPEN RESPONSES */}
      <div className="surface-card p-8 rounded-2xl space-y-6 shadow-sm">
        <h3 className="text-xl font-bold text-maroon dark:text-petal mb-6 pb-2 border-b border-black/10 dark:border-white/10 heading-serif">
          Open Reflections & Feedback
        </h3>

        <div>
          <label className="block font-semibold mb-2 text-lg">How satisfied are you with your personal performance this term? What hindered your growth?</label>
          <textarea
            value={openResponses.selfSatisfaction}
            onChange={(e) => setOpenResponses(r => ({ ...r, selfSatisfaction: e.target.value }))}
            className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-base h-28 focus:ring-2 focus:ring-maroon focus:outline-none resize-none shadow-inner"
            required
            placeholder="Share your honest thoughts..."
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-lg">What professional or project goals did you achieve?</label>
          <textarea
            value={openResponses.goals}
            onChange={(e) => setOpenResponses(r => ({ ...r, goals: e.target.value }))}
            className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-base h-28 focus:ring-2 focus:ring-maroon focus:outline-none resize-none shadow-inner"
            required
            placeholder="Detail your completed milestones..."
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-lg">What new implementations or innovations are you most proud of?</label>
          <textarea
            value={openResponses.implementations}
            onChange={(e) => setOpenResponses(r => ({ ...r, implementations: e.target.value }))}
            className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-base h-28 focus:ring-2 focus:ring-maroon focus:outline-none resize-none shadow-inner"
            required
            placeholder="What positive changes did you bring to the council?"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2 text-lg">Any constructive feedback or support needed from the District?</label>
          <textarea
            value={openResponses.feedback}
            onChange={(e) => setOpenResponses(r => ({ ...r, feedback: e.target.value }))}
            className="w-full p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-base h-28 focus:ring-2 focus:ring-maroon focus:outline-none resize-none shadow-inner"
            placeholder="How can the District Executives better support you?"
          />
        </div>
      </div>

      <div className="flex justify-center md:justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-8 py-4 rounded-2xl btn-primary font-bold shadow-xl flex items-center justify-center gap-3 hover:-translate-y-1 transition-all hover:shadow-maroon/20 hover:shadow-2xl text-lg"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
          Submit Self-Assessment
        </button>
      </div>

    </form>
  );
}

