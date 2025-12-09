import React, { useEffect, useState } from 'react';
import { UserAuthProfile } from '../types';
import * as authService from '../services/authService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserAuthProfile;
  onSaved: (profile: UserAuthProfile) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, profile, onSaved }) => {
  const [name, setName] = useState(profile.name || '');
  const [dob, setDob] = useState(profile.dateOfBirth || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [links, setLinks] = useState<string[]>(profile.links || []);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || '');
  const [contactFacebookUrl, setContactFacebookUrl] = useState(profile.contactFacebookUrl || '');
  const [cvLink, setCvLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [cvFilePath, setCvFilePath] = useState<string | undefined>(profile.cvFilePath);
  const [portfolioFilePath, setPortfolioFilePath] = useState<string | undefined>(profile.portfolioFilePath);

  useEffect(() => {
    setName(profile.name || '');
    setDob(profile.dateOfBirth || '');
    setBio(profile.bio || '');
    setLinks(profile.links || []);
    setContactEmail(profile.contactEmail || '');
    setContactFacebookUrl(profile.contactFacebookUrl || '');
    const guess = (needle: string, fallback: string = '') => (profile.links || []).find(l => l.toLowerCase().includes(needle)) || fallback;
    setCvLink(guess('cv'));
    setPortfolioLink(guess('portfolio'));
    setLinkedinUrl(guess('linkedin'));
    setTwitterUrl(guess('twitter'));
    setCvFilePath(profile.cvFilePath);
    setPortfolioFilePath(profile.portfolioFilePath);
  }, [profile]);

  if (!isOpen) return null;

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updated: UserAuthProfile = {
      ...profile,
      name: name.trim(),
      dateOfBirth: dob,
      bio: bio.trim(),
      links: [cvLink, portfolioLink, linkedinUrl, twitterUrl].map(l => l.trim()).filter(Boolean),
      contactEmail: profile.provider === 'google' ? contactEmail.trim() : undefined,
      contactFacebookUrl: profile.provider === 'facebook' ? contactFacebookUrl.trim() : undefined,
      cvFilePath,
      portfolioFilePath,
    };
    try {
      const saved = await authService.saveProfile(updated);
      onSaved(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const setLink = (index: number, value: string) => {
    const next = [...links];
    next[index] = value;
    setLinks(next);
  };

  const addLink = () => setLinks([...links, '']);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-dark-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-dark-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Date of birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white [color-scheme:dark]" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Short bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24" />
          </div>

          {profile.provider === 'google' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Gmail</label>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="your.email@gmail.com" />
            </div>
          )}
          {profile.provider === 'facebook' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Facebook profile link</label>
              <input value={contactFacebookUrl} onChange={(e) => setContactFacebookUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://facebook.com/your.profile" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">CV</h3>
              <input value={cvLink} onChange={(e) => setCvLink(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="CV URL" />
              <div>
                <label className="text-xs text-neutral-500">Upload CV file</label>
                <input type="file" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const path = await authService.uploadFile(profile.id, f, 'cv');
                    setCvFilePath(path);
                  }
                }} className="mt-1 text-neutral-300" />
                {cvFilePath && <p className="text-xs text-neutral-400 mt-1">Uploaded: {cvFilePath}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Portfolio</h3>
              <input value={portfolioLink} onChange={(e) => setPortfolioLink(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Portfolio URL" />
              <div>
                <label className="text-xs text-neutral-500">Upload portfolio file</label>
                <input type="file" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const path = await authService.uploadFile(profile.id, f, 'portfolio');
                    setPortfolioFilePath(path);
                  }
                }} className="mt-1 text-neutral-300" />
                {portfolioFilePath && <p className="text-xs text-neutral-400 mt-1">Uploaded: {portfolioFilePath}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase">LinkedIn</label>
                <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="LinkedIn URL" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Twitter/X</label>
                <input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Twitter/X URL" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
            <button onClick={save} disabled={saving} aria-busy={saving} className="px-5 py-2 rounded-xl bg-lime-accent text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span>Saving</span>
                  <span className="inline-block w-5 text-left animate-pulse">...</span>
                </span>
              ) : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
