import React, { useEffect, useState } from 'react';
import { UserAuthProfile } from '../types';
import * as authService from '../services/authService';

interface ProfilePageProps {
  profile: UserAuthProfile;
  onSaved: (profile: UserAuthProfile) => void;
  onDeleted: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onSaved, onDeleted }) => {
  const [name, setName] = useState(profile.name || '');
  const [dob, setDob] = useState(profile.dateOfBirth || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || '');
  const [contactFacebookUrl, setContactFacebookUrl] = useState(profile.contactFacebookUrl || '');
  const [cvLink, setCvLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [cvFilePath, setCvFilePath] = useState<string | undefined>(profile.cvFilePath);
  const [portfolioFilePath, setPortfolioFilePath] = useState<string | undefined>(profile.portfolioFilePath);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setName(profile.name || '');
    setDob(profile.dateOfBirth || '');
    setBio(profile.bio || '');
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

  const save = async () => {
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
    const saved = await authService.saveProfile(updated);
    onSaved(saved);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 w-full bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Your Profile</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => { location.hash = ''; }} className="px-4 py-2 rounded-full bg-white/10 text-white">Back to Home</button>
            <button onClick={save} className="px-4 py-2 rounded-full bg-lime-accent text-black font-bold">Save</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Display name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Date of birth</label>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white [color-scheme:dark]" />
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase">Short bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24" />
        </section>

        {profile.provider === 'google' && (
          <section className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Gmail</label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="your.email@gmail.com" />
          </section>
        )}
        {profile.provider === 'facebook' && (
          <section className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase">Facebook profile link</label>
            <input value={contactFacebookUrl} onChange={(e) => setContactFacebookUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="https://facebook.com/your.profile" />
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">CV</h3>
            <input value={cvLink} onChange={(e) => setCvLink(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="CV URL" />
            <div>
              <label className="text-xs text-neutral-500">Upload CV file</label>
              <input type="file" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const path = await authService.uploadFile(profile.id, f);
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
                  const path = await authService.uploadFile(profile.id, f);
                  setPortfolioFilePath(path);
                }
              }} className="mt-1 text-neutral-300" />
              {portfolioFilePath && <p className="text-xs text-neutral-400 mt-1">Uploaded: {portfolioFilePath}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-2">
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
        </section>
      </main>
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-950/50 border border-red-700/40 rounded-2xl p-6">
          <div className="text-white font-semibold mb-2">Danger Zone</div>
          <p className="text-red-300 text-sm mb-4">Deleting your account will permanently disable the Gmail or Facebook link used. You won’t be able to register again with this identifier.</p>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Delete Account</button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
              <button onClick={async () => {
                const identifier = profile.providerId || (profile.provider === 'google' ? profile.contactEmail : profile.contactFacebookUrl) || '';
                if (identifier) {
                  await authService.deleteAccount(profile.provider, identifier);
                }
                onDeleted();
                location.hash = '';
              }} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Confirm Delete</button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ProfilePage;
