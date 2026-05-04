import Logo from '@/components/Logo';

interface ThankYouProps {
  variant?: 'application' | 'call';
}

export default function ThankYou({ variant = 'application' }: ThankYouProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 gap-8">
      <Logo className="justify-center text-3xl opacity-60" />

      <div className="flex flex-col gap-3 max-w-sm">
        {variant === 'call' ? (
          <>
            <h1 className="font-cormorant font-semibold text-5xl text-primary leading-tight">
              Talk soon.
            </h1>
            <p className="text-base font-light text-primary/60 leading-relaxed">
              Marco will reach out to set up a time to connect. No pressure — just a conversation.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-cormorant font-semibold text-5xl text-primary leading-tight">
              We're glad<br />you're here.
            </h1>
            <p className="text-base font-light text-primary/60 leading-relaxed">
              We'll be in touch soon.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
