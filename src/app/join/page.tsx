'use client';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import ProgressBar from '@/components/join/ProgressBar';
import RoleSelection from '@/components/join/RoleSelection';
import PathFork from '@/components/join/PathFork';
import PersonalInfo from '@/components/join/PersonalInfo';
import VideoUpload from '@/components/join/VideoUpload';
import QuickConnect from '@/components/join/QuickConnect';
import ThankYou from '@/components/join/ThankYou';
import SubmittingOverlay from '@/components/join/SubmittingOverlay';
import SiteNav from '@/components/SiteNav';

type Path = 'undecided' | 'apply' | 'call';

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
  const [path, setPath] = useState<Path>('undecided');
  const [thanksVariant, setThanksVariant] = useState<'application' | 'call'>('application');
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
  const requestCall = useMutation(api.leadershipInterest.requestCall);

  async function handleApplicationSubmit(file: File) {
    setSubmittingStage('uploading');
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
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
      });

      setThanksVariant('application');
      setSubmittingStage('complete');
    } catch {
      setSubmittingStage(null);
      setError('Something went wrong. Please try again.');
    }
  }

  async function handleCallRequest(data: { name: string; contact: string }) {
    setSubmittingStage('saving');
    setError(null);
    try {
      await requestCall({
        name: data.name,
        contact: data.contact,
        roles: formData.roles,
      });
      setThanksVariant('call');
      setSubmittingStage('complete');
    } catch {
      setSubmittingStage(null);
      setError('Something went wrong. Please try again.');
    }
  }

  if (submitted) return <ThankYou variant={thanksVariant} />;

  // Show fork after step 1 completes
  const showFork = step === 1.5;
  const showCallForm = path === 'call' && step === 2;

  return (
    <>
    {submittingStage && (
      <SubmittingOverlay
        stage={submittingStage}
        onDone={() => setSubmitted(true)}
      />
    )}
    <div className="join-page min-h-screen">
      <SiteNav />
      <div className="max-w-3xl mx-auto px-6 pb-32">
        <div className="pt-10 pb-2">
          <h1 className="font-cormorant font-semibold text-5xl sm:text-6xl text-primary leading-tight mb-3">
            Join the Team.
          </h1>
          <p className="text-base font-light text-primary/55 leading-relaxed max-w-md">
            God is working at Penn State and music is playing a huge role. We're looking for people who want to be part of that.
          </p>
        </div>

        {/* Progress bar only on the full application path */}
        {path === 'apply' && (
          <div className="mt-10 mb-12">
            <ProgressBar currentStep={step} />
          </div>
        )}

        {/* Spacer when no progress bar */}
        {path !== 'apply' && <div className="mt-10 mb-12" />}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-secondary/10 text-secondary text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Role selection */}
        {step === 1 && (
          <RoleSelection
            initialRoles={formData.roles}
            initialWorshipTeam={formData.worshipTeam}
            initialInstruments={formData.instruments}
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(1.5);
            }}
          />
        )}

        {/* Fork: apply vs talk first */}
        {showFork && (
          <PathFork
            onApply={() => {
              setPath('apply');
              setStep(2);
            }}
            onTalkFirst={() => {
              setPath('call');
              setStep(2);
            }}
          />
        )}

        {/* Call request path */}
        {showCallForm && (
          <QuickConnect
            roles={formData.roles}
            isSubmitting={submittingStage !== null}
            onSubmit={handleCallRequest}
            onBack={() => {
              setPath('undecided');
              setStep(1.5);
            }}
          />
        )}

        {/* Full application path */}
        {path === 'apply' && step === 2 && (
          <PersonalInfo
            initialName={formData.name}
            initialEmail={formData.email}
            initialGradYear={formData.gradYear}
            initialWeeklyHours={formData.weeklyHours}
            onNext={(data) => {
              setFormData((f) => ({ ...f, ...data }));
              setStep(3);
            }}
            onBack={() => {
              setPath('undecided');
              setStep(1.5);
            }}
          />
        )}
        {path === 'apply' && step === 3 && (
          <VideoUpload
            initialFile={formData.videoFile}
            onNext={(file) => {
              setFormData((f) => ({ ...f, videoFile: file }));
              handleApplicationSubmit(file);
            }}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
    </>
  );
}
