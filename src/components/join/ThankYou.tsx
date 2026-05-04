import Logo from '@/components/Logo';

export default function ThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 gap-8">
      <Logo className="justify-center text-3xl opacity-60" />

      <div className="flex flex-col gap-3 max-w-sm">
        <h1 className="font-cormorant font-semibold text-5xl text-primary leading-tight">
          We're glad<br />you're here.
        </h1>
        <p className="text-base font-light text-primary/60 leading-relaxed">
          We'll be in touch soon.
        </p>
      </div>
    </div>
  );
}
