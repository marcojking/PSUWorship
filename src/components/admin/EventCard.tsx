import Link from 'next/link';

type EventCardProps = {
  slug: string;
  title: string;
  subtitle?: string;
  location?: string;
  status: 'planning' | 'confirmed' | 'complete';
  color: 'navy' | 'rust' | 'blue';
  startDate: number;
  endDate: number;
  isActive?: boolean;
};

const STATUS_LABEL: Record<string, string> = { planning: 'Planning', confirmed: 'Confirmed', complete: 'Complete' };
const STATUS_COLOR: Record<string, string> = {
  planning: 'bg-[rgba(0,48,73,0.12)] text-[#003049]',
  confirmed: 'bg-[rgba(80,140,80,0.15)] text-[#2a6a2a]',
  complete: 'bg-[rgba(127,160,175,0.2)] text-[#2a5869]',
};
const ACCENT: Record<string, string> = { navy: '#003049', rust: '#b45741', blue: '#7fa0af' };

function fmt(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function EventCard({ slug, title, subtitle, location, status, color, startDate, endDate, isActive }: EventCardProps) {
  const accentColor = ACCENT[color];
  const dateLabel = endDate > startDate ? `${fmt(startDate)} – ${fmt(endDate)}` : fmt(startDate);

  return (
    <Link
      href={`/admin/event/${slug}`}
      className={`block rounded-lg border p-4 transition-all hover:shadow-md ${isActive ? 'ring-2 ring-[#003049]' : ''}`}
      style={{ borderColor: `${accentColor}30`, borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#003049] truncate">{title}</p>
          {subtitle && <p className="text-sm text-[rgba(0,48,73,0.6)] truncate">{subtitle}</p>}
          <p className="text-xs text-[rgba(0,48,73,0.5)] mt-1">{dateLabel}{location ? ` · ${location}` : ''}</p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </Link>
  );
}
