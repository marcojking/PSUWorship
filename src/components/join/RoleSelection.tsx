'use client';
import { useState } from 'react';
import RoleCard from './RoleCard';
import { LEADERSHIP_ROLES, TEAM_ROLES } from '@/lib/roles';

const LEADERSHIP_DESCRIPTIONS: Record<string, string> = {
  'Vice President': 'Assist the President, step in when needed, and help coordinate across all teams.',
  'Music Director': 'Lead musical direction for worship nights and recordings — keys, arrangements, rehearsals.',
  'Treasurer': 'Manage club finances, track expenses, and handle UPAC funding requests.',
  'Secretary': 'Manage communications and keep the team organized.',
  'Event Coordinator': 'Plan and execute worship nights and events. Co-leads the Events & Hospitality team.',
  'Hospitality Lead': 'Create a welcoming environment at every event. Co-leads the Events & Hospitality team.',
  'Social Media Lead': 'Shape the creative voice of our social channels — visual storytelling, content strategy, and building our online presence.',
  'Media Lead': 'Direct photo and video coverage of events and manage content production. Training provided.',
  'Tech/Production Lead': 'Run live sound and lighting at events, oversee studio sessions. Training provided.',
  'Graphics / Art Lead': 'Design merch, album covers, visual assets, promotional materials, and maintain brand consistency.',
  'Prayer Lead': 'Organize and lead prayer for the club — before events, during meetings, and beyond.',
};

const TEAM_DESCRIPTIONS: Record<string, string> = {
  'Media & Social Team': 'Help capture events on camera, edit content, and manage social posts.',
  'Events & Hospitality Team': 'Help set up events, greet guests, and support the event planning process.',
  'Graphics / Art Team': 'Design flyers, visual assets, and album covers and artwork for our music releases.',
  'Sound & Tech Team': 'Run sound and gear at events — typically once a month or less.',
};

const MAX_SELECTIONS = 3;

interface RoleSelectionProps {
  initialRoles?: string[];
  initialWorshipTeam?: boolean;
  initialInstruments?: string;
  onRequestCall: () => void;
  onNext: (data: { roles: string[]; worshipTeam: boolean; instruments: string }) => void;
}

export default function RoleSelection({
  initialRoles = [],
  initialWorshipTeam = false,
  initialInstruments = '',
  onRequestCall,
  onNext,
}: RoleSelectionProps) {
  const [selected, setSelected] = useState<string[]>(initialRoles);
  const [worshipTeam, setWorshipTeam] = useState(initialWorshipTeam);
  const [instruments, setInstruments] = useState(initialInstruments);

  function toggleRole(title: string) {
    setSelected((prev) => {
      if (prev.includes(title)) return prev.filter((r) => r !== title);
      if (prev.length >= MAX_SELECTIONS) return prev;
      return [...prev, title];
    });
  }

  const atMax = selected.length >= MAX_SELECTIONS;

  return (
    <div className="flex flex-col gap-8">
      {/* Not sure CTA */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-primary/10 bg-primary/[0.02]">
        <p className="text-sm font-light text-primary/60 leading-snug">
          Not ready to apply yet? Have a quick conversation with Marco first.
        </p>
        <button
          onClick={onRequestCall}
          className="flex-shrink-0 h-9 px-5 rounded-full border border-primary/20 text-primary text-xs font-semibold tracking-widest uppercase transition-all hover:border-primary/50 hover:bg-primary/5 whitespace-nowrap"
        >
          Request a call
        </button>
      </div>

      {/* Counter */}
      <p
        className={`font-cormorant font-semibold italic text-lg tracking-wide transition-colors ${
          selected.length > 0 ? 'text-secondary' : 'text-primary/40'
        }`}
      >
        {selected.length} / 3 selected
      </p>

      {/* Team Positions */}
      <section>
        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="font-cormorant font-semibold italic text-2xl text-primary">Team Positions</h2>
          <div className="flex-1 h-px bg-primary/10" />
          <span className="text-xs text-primary/40 font-normal">Lower time commitment</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEAM_ROLES.map((title) => {
            const selNum = selected.indexOf(title);
            return (
              <RoleCard
                key={title}
                title={title}
                description={TEAM_DESCRIPTIONS[title]}
                variant="team"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(title)}
                onToggle={() => toggleRole(title)}
              />
            );
          })}
        </div>
      </section>

      {/* Leadership Roles */}
      <section>
        <div className="flex items-baseline gap-4 mb-4">
          <h2 className="font-cormorant font-semibold italic text-2xl text-primary">Leadership Roles</h2>
          <div className="flex-1 h-px bg-primary/10" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LEADERSHIP_ROLES.map((title) => {
            const selNum = selected.indexOf(title);
            return (
              <RoleCard
                key={title}
                title={title}
                description={LEADERSHIP_DESCRIPTIONS[title]}
                variant="leadership"
                selectionNumber={selNum >= 0 ? selNum + 1 : null}
                isDimmed={atMax && !selected.includes(title)}
                onToggle={() => toggleRole(title)}
              />
            );
          })}
        </div>
      </section>

      {/* Worship Team Block */}
      <section
        className="rounded-2xl border p-6"
        style={{ background: 'rgba(180,87,65,0.07)', borderColor: 'rgba(180,87,65,0.2)' }}
      >
        <h3 className="font-cormorant font-semibold italic text-xl text-primary mb-4">
          Interested in Live Worship or Recording Songs?
        </h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
              worshipTeam ? 'bg-secondary border-secondary' : 'bg-background border-secondary/40'
            }`}
            onClick={() => setWorshipTeam((v) => !v)}
          >
            {worshipTeam && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5l3.5 3.5L11 1" stroke="#fff7eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-semibold text-primary">
            Yes, I'd like to be part of the Worship Team
          </span>
        </label>

        {worshipTeam && (
          <input
            type="text"
            value={instruments}
            onChange={(e) => setInstruments(e.target.value)}
            placeholder="What instrument(s) do you play or want to learn? (e.g. guitar, vocals, keys)"
            className="mt-4 w-full h-12 px-4 rounded-xl border border-primary/20 bg-background text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
          />
        )}
      </section>

      {/* Continue */}
      <button
        disabled={selected.length === 0}
        onClick={() => onNext({ roles: selected, worshipTeam, instruments })}
        className="w-full h-14 rounded-full bg-primary text-background text-sm font-semibold tracking-widest uppercase transition-all hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-primary disabled:hover:shadow-none"
      >
        Continue
      </button>
    </div>
  );
}
