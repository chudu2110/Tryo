import React, { useMemo, useState } from 'react';
import { AuthProvider, UserAuthProfile } from '../types';
import * as authService from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserAuthProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'provider'|'loginConfirm'|'register'>('provider');
  const [provider, setProvider] = useState<AuthProvider | null>(null);
  const existing = useMemo(() => authService.getProfile(), []);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [registerStep, setRegisterStep] = useState(0);

  if (!isOpen) return null;

  const chooseProvider = (p: AuthProvider) => {
    setProvider(p);
    if (existing) {
      setStep('loginConfirm');
    } else {
      setStep('register');
      setRegisterStep(0);
    }
  };

  const continueLogin = () => {
    if (!existing) return;
    onSuccess(existing);
    onClose();
  };

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    const profile: UserAuthProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      provider,
      dateOfBirth: dob,
      bio: bio.trim(),
      links: [cvLink, portfolioLink, linkedinLink, twitterLink].map(s => s.trim()).filter(s => s.length > 0),
    };
    authService.saveProfile(profile);
    onSuccess(profile);
    onClose();
  };

  const questions = [
    {
      key: 'name',
      label: 'Display name',
      type: 'text' as const,
      value: name,
      onChange: setName,
      placeholder: 'Your display name',
      required: true,
    },
    {
      key: 'dob',
      label: 'Date of birth',
      type: 'date' as const,
      value: dob,
      onChange: setDob,
    },
    {
      key: 'bio',
      label: 'Short bio',
      type: 'textarea' as const,
      value: bio,
      onChange: setBio,
      placeholder: 'A short introduction',
    },
    {
      key: 'cv',
      label: 'CV',
      type: 'text' as const,
      value: cvLink,
      onChange: setCvLink,
      placeholder: 'CV URL',
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      type: 'text' as const,
      value: portfolioLink,
      onChange: setPortfolioLink,
      placeholder: 'Portfolio URL',
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      type: 'text' as const,
      value: linkedinLink,
      onChange: setLinkedinLink,
      placeholder: 'LinkedIn URL',
    },
    {
      key: 'twitter',
      label: 'Twitter/X',
      type: 'text' as const,
      value: twitterLink,
      onChange: setTwitterLink,
      placeholder: 'Twitter/X URL',
    },
  ];

  const canContinue = () => {
    const q = questions[registerStep];
    if (!q) return false;
    if (q.required) {
      return (q.value as string).trim().length > 0;
    }
    return true;
  };

  const goNext = () => {
    if (registerStep < questions.length - 1) {
      setRegisterStep(registerStep + 1);
    } else {
      const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
      submitRegistration(fakeEvent);
    }
  };

  const goBack = () => {
    if (registerStep === 0) {
      setStep('provider');
    } else {
      setRegisterStep(registerStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-dark-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-dark-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Join with</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        {step === 'provider' && (
          <div className="p-6 space-y-4">
            <p className="text-neutral-300">Choose an account to continue:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => chooseProvider('google')} className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 flex items-center justify-center gap-2">
                <img src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>
              <button onClick={() => chooseProvider('facebook')} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-500 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V11h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12"/></svg>
                <span>Continue with Facebook</span>
              </button>
            </div>
          </div>
        )}
        {step === 'loginConfirm' && existing && (
          <div className="p-6 space-y-6">
            <p className="text-neutral-300">You previously signed in to Tryo. Continue as "{existing.name}"?</p>
            <div className="flex gap-3">
              <button onClick={continueLogin} className="px-5 py-2 rounded-xl bg-lime-accent text-black font-bold">Continue</button>
              <button onClick={() => setStep('provider')} className="px-5 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
            </div>
          </div>
        )}
        {step === 'register' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-wide text-neutral-400 uppercase">Step {registerStep + 1}/{questions.length}</span>
              <div className="h-1 w-40 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-lime-accent" style={{ width: `${((registerStep + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">{questions[registerStep].label}</label>
              {questions[registerStep].type === 'textarea' ? (
                <textarea
                  value={questions[registerStep].value as string}
                  onChange={(e) => questions[registerStep].onChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24 placeholder:text-neutral-700"
                  placeholder={questions[registerStep].placeholder}
                />
              ) : questions[registerStep].type === 'date' ? (
                <input
                  type="date"
                  value={questions[registerStep].value as string}
                  onChange={(e) => questions[registerStep].onChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white [color-scheme:dark]"
                />
              ) : (
                <input
                  type="text"
                  value={questions[registerStep].value as string}
                  onChange={(e) => questions[registerStep].onChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-700"
                  placeholder={questions[registerStep].placeholder}
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <button onClick={goBack} className="px-5 py-2 rounded-xl bg-white/10 text-white">Back</button>
              <button onClick={goNext} disabled={!canContinue()} className="px-5 py-2 rounded-xl bg-lime-accent text-black font-bold disabled:opacity-50">{registerStep === questions.length - 1 ? 'Finish' : 'Next'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
