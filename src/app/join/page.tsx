'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ProgressBar from '@/components/join/ProgressBar';
import RoleSelection from '@/components/join/RoleSelection';
import PersonalInfo from '@/components/join/PersonalInfo';
import VideoUpload from '@/components/join/VideoUpload';
import FollowUp from '@/components/join/FollowUp';
import ThankYou from '@/components/join/ThankYou';
import SubmittingOverlay from '@/components/join/SubmittingOverlay';

interface FormData {
  roles: string[];
  worshipTeam: boolean;
  instruments: string;
  name: string;
  email: string;
  gradYear: number;
  weeklyHours: number;
  videoFile: File | null;
}

export default function JoinPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    roles: [],
    worshipTeam: false,
    instruments: '',
    name: '',
    email: '',
    gradYear: 2028,
    weeklyHours: 3,
    videoFile: null,
  });
  const [submittingStage, setSubmittingStage] = useState<'uploading' | 'saving' | 'complete' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.leadershipInterest.generateUploadUrl);
  const submit = useMutation(api.leadershipInterest.submit);

  async function handleFinalSubmit(followUp: { requestsCall: boolean; phone: string }) {
    if (!formData.videoFile) return;
    setSubmittingStage('uploading');
    setError(null);

    try {
      const uploadUrl = await generateUploadUrl();

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': formData.videoFile.type },
        body: formData.videoFile,
      });
      if (!uploadRes.ok) throw new Error('Video upload failed');
      const { storageId } = await uploadRes.json();

      setSubmittingStage('saving');

      await submit({
        name: formData.name,
        email: formData.email,
        gradYear: formData.gradYear,
        weeklyHours: formData.weeklyHours,
        roles: formData.roles,
        worshipTeam: formData.worshipTeam,
        instruments: formData.instruments || undefined,
        videoStorageId: storageId,
        requestsCall: followUp.requestsCall,
        phone: followUp.phone || undefined,
      });

      setSubmittingStage('complete');
    } catch {
      setSubmittingStage(null);
      setError('Something went wrong. Please try again.');
    }
  }

  if (submitted) return <ThankYou />;

  return (
    <>
    {submittingStage && (
      <SubmittingOverlay
        stage={submittingStage}
        onDone={() => setSubmitted(true)}
      />
    )}
    <div className="join-page min-h-screen">
      <div className="max-w-3xl mx-auto px-6 pb-32">
        <div className="pt-16 pb-2">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-secondary mb-2">
            PSU Worship
          </p>
          <h1 className="font-cormorant font-semibold text-5xl sm:text-6xl text-primary leading-tight mb-3">
            Join the Team.
          </h1>
          <p className="text-base font-light text-primary/55 leading-relaxed max-w-md">
            God is working at Penn State and music is playing a huge role. We're looking for people who want to be part of that.
          </p>
        </div>

        <div className="mt-10 mb-12">
          <ProgressBar currentStep={step} />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-secondary/10 text-secondary text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <RoleSelection
            initialRoles={formData.roles}
            initialWorshipTeam={formData.worshipTeam}
            initialInstruments={formData.instruments}
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <PersonalInfo
            initialName={formData.name}
            initialEmail={formData.email}
            initialGradYear={formData.gradYear}
            initialWeeklyHours={formData.weeklyHours}
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <VideoUpload
            initialFile={formData.videoFile}
            onNext={(file) => {
              setFormData((f) => ({ ...f, videoFile: file }));
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <FollowUp
            isSubmitting={submittingStage !== null}
            onSubmit={handleFinalSubmit}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
    </>
  );
}
