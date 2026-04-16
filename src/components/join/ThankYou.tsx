import Logo from '@/components/Logo';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 gap-8">
      <Logo className="justify-center text-3xl opacity-60" />

      <div className="flex flex-col gap-4 max-w-sm">
        <h1 className="font-cormorant font-semibold text-5xl text-primary leading-tight">
          We're glad<br />you're here.
        </h1>
        <p className="text-base font-light text-primary/60 leading-relaxed">
          We'll review your application with our faculty mentor and be in touch soon. In the meantime — keep worshipping.
        </p>
      </div>

      <div className="w-12 h-px bg-secondary" />

      <p className="text-xs text-primary/30 tracking-widest uppercase">
        Penn State Worship
      </p>
    </div>
  );
}
