'use client';

import { type Section } from '@/lib/db';
import { sectionSlideGroups } from '@/lib/live/slides';

interface SlidePreviewProps {
  sections: Section[];
  // Called when the user toggles a page break between lines within a section.
  // lineIndex is the 1-based index of the line that should begin a new slide.
  onToggleBreak: (sectionIndex: number, lineIndex: number) => void;
}

// Visual editor: shows how each section will paginate into projector slides,
// with clickable dividers between lines to split/merge pages.
export default function SlidePreview({ sections, onToggleBreak }: SlidePreviewProps) {
  return (
    <div className="space-y-5">
      {sections.map((section, sIdx) => {
        const groups = sectionSlideGroups(section);
        // Map each line index → the index of the slide it belongs to.
        const slideOfLine = new Map<number, number>();
        groups.forEach((g, gi) => g.forEach(li => slideOfLine.set(li, gi)));

        return (
          <div key={sIdx}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-primary/60">
                {section.label}
              </span>
              <span className="text-[10px] opacity-40">
                {groups.length} slide{groups.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="rounded-lg border border-primary/10 overflow-hidden">
              {section.lines.map((line, lIdx) => {
                const isBreakHere = lIdx > 0 && slideOfLine.get(lIdx) !== slideOfLine.get(lIdx - 1);
                const slideNum = (slideOfLine.get(lIdx) ?? 0) + 1;
                return (
                  <div key={lIdx}>
                    {lIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => onToggleBreak(sIdx, lIdx)}
                        className={`group w-full flex items-center gap-2 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                          isBreakHere
                            ? 'bg-amber-400/15 text-amber-700 hover:bg-amber-400/25'
                            : 'text-transparent hover:text-primary/50 hover:bg-primary/5'
                        }`}
                        title={isBreakHere ? 'Merge with slide above' : 'Split into a new slide here'}
                      >
                        <span className="flex-1 border-t border-dashed border-current" />
                        <span>{isBreakHere ? '✕ page break' : '+ split page'}</span>
                        <span className="flex-1 border-t border-dashed border-current" />
                      </button>
                    )}
                    <div className="flex items-start gap-2 px-3 py-1">
                      <span className="text-[10px] font-mono opacity-30 w-4 shrink-0 mt-0.5">{slideNum}</span>
                      <span className="text-sm">
                        {line.lyrics || <span className="opacity-25">(blank line)</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
