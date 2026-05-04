const STEPS = ['Roles', 'About You', 'Your Story'];

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const fillPct = (currentStep / STEPS.length) * 100;

  return (
    <div
      className="relative w-full h-10 rounded-full overflow-hidden"
      style={{ background: 'rgba(0,48,73,0.1)' }}
    >
      {/* Navy fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-500 ease-in-out"
        style={{ width: `${fillPct}%` }}
      />

      {/* Blue-grey glow from fill edge */}
      <div
        className="join-progress-glow absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${fillPct}%`,
          width: '45%',
          background: 'linear-gradient(90deg, rgba(127,160,175,0.32) 0%, rgba(127,160,175,0.10) 40%, transparent 100%)',
          borderRadius: '0 9999px 9999px 0',
        }}
      />

      {/* Step labels overlay */}
      <div className="absolute inset-0 flex pointer-events-none">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className="flex-1 flex items-center justify-center text-[0.6rem] font-semibold tracking-widest uppercase"
            style={{ color: i < currentStep ? '#fff7eb' : 'rgba(0,48,73,0.3)' }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
