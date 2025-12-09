import React, { useEffect, useState } from 'react';
import { UserAuthProfile, ProjectPost, ProjectField, ProjectStage } from '../types';
import * as authService from '../services/authService';
import * as storageService from '../services/storageService';

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
  const [section, setSection] = useState<'profile'|'posts'>('profile');
  const [myPosts, setMyPosts] = useState<ProjectPost[]>([]);
  const [editingPost, setEditingPost] = useState<ProjectPost | null>(null);
  const [editForm, setEditForm] = useState<{ projectName: string; field: ProjectField; stage: ProjectStage; compensation: string; deadline: string; description: string; rolesInput: string; imageUrl: string }>({ projectName: '', field: ProjectField.OTHER, stage: ProjectStage.IDEA, compensation: '', deadline: '', description: '', rolesInput: '', imageUrl: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  useEffect(() => {
    setMyPosts(storageService.getPostsByFounder(profile.name));
  }, [profile.name, section]);

  const save = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
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
    } catch (e: any) {
      setSaveError(e?.message || 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const normalizeSrc = (src?: string) => {
    if (!src) return src;
    if (src.startsWith('backend/uploads') || src.startsWith('backend\\uploads')) {
      const parts = src.replace(/\\/g, '/').split('/');
      const idx = parts.indexOf('uploads');
      if (idx >= 0) {
        return '/uploads/' + parts.slice(idx + 1).join('/');
      }
    }
    return src;
  };

  const openEdit = (post: ProjectPost) => {
    setEditingPost(post);
    setEditForm({
      projectName: post.projectName,
      field: post.field,
      stage: post.stage,
      compensation: post.compensation,
      deadline: post.deadline,
      description: post.description,
      rolesInput: post.roles.join(', '),
      imageUrl: post.imageUrl,
    });
  };

  const saveEdit = () => {
    if (!editingPost) return;
    const updated: ProjectPost = {
      ...editingPost,
      projectName: editForm.projectName,
      field: editForm.field,
      stage: editForm.stage,
      compensation: editForm.compensation,
      deadline: editForm.deadline,
      description: editForm.description,
      roles: editForm.rolesInput.split(',').map(r => r.trim()).filter(Boolean),
      imageUrl: editForm.imageUrl,
    };
    storageService.updatePost(updated);
    setMyPosts(storageService.getPostsByFounder(profile.name));
    setEditingPost(null);
  };

  const deletePost = (id: string) => {
    storageService.deletePost(id);
    setMyPosts(storageService.getPostsByFounder(profile.name));
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 w-full bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Your Profile</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => { location.hash = ''; }} className="px-4 py-2 rounded-full bg-white/10 text-white">Back to Home</button>
            <button onClick={save} disabled={saveLoading} className="px-4 py-2 rounded-full bg-lime-accent text-black font-bold disabled:opacity-50">{saveLoading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="md:col-span-1 space-y-2">
            <button onClick={() => setSection('profile')} className={`w-full text-left px-4 py-2 rounded-xl border ${section==='profile' ? 'bg-white/10 border-white/30 text-white' : 'bg-black/30 border-white/10 text-neutral-300 hover:text-white'}`}>My Profile</button>
            <button onClick={() => setSection('posts')} className={`w-full text-left px-4 py-2 rounded-xl border ${section==='posts' ? 'bg-white/10 border-white/30 text-white' : 'bg-black/30 border-white/10 text-neutral-300 hover:text-white'}`}>My Posts</button>
          </aside>
          <section className="md:col-span-3 space-y-8">
            {section === 'profile' ? (
              <>
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

        {saveError && (
          <p className="text-xs text-red-400">{saveError}</p>
        )}
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
            <div>
              <label className="text-xs text-neutral-500">Upload CV file</label>
              <div className="flex items-center gap-3 mt-1">
              <input type="file" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const path = await authService.uploadFile(profile.id, f);
                  setCvFilePath(path);
                  try {
                    const saved = await authService.saveProfile({
                      ...profile,
                      cvFilePath: path,
                    });
                    onSaved(saved);
                  } catch (err) {
                    setSaveError('Save failed');
                  }
                }
              }} className="text-neutral-300" />
              </div>
              {cvFilePath && (
                <p className="text-xs text-neutral-400 mt-1">Current: {cvFilePath.split(/[/\\]/).pop()}</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Portfolio</h3>
            <div>
              <label className="text-xs text-neutral-500">Upload portfolio file</label>
              <div className="flex items-center gap-3 mt-1">
              <input type="file" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const path = await authService.uploadFile(profile.id, f);
                  setPortfolioFilePath(path);
                  try {
                    const saved = await authService.saveProfile({
                      ...profile,
                      portfolioFilePath: path,
                    });
                    onSaved(saved);
                  } catch (err) {
                    setSaveError('Save failed');
                  }
                }
              }} className="text-neutral-300" />
              </div>
              {portfolioFilePath && (
                <p className="text-xs text-neutral-400 mt-1">Current: {portfolioFilePath.split(/[/\\]/).pop()}</p>
              )}
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

        <section className="space-y-4">
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
        </section>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">My Posts</h3>
                  <span className="text-neutral-400 text-sm">{myPosts.length} posts</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {myPosts.map(p => (
                    <div key={p.id} className="bg-dark-800 rounded-2xl border border-white/10 p-4 flex gap-4">
                      <img src={normalizeSrc(p.imageUrl) || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`} alt="cover" className="w-28 h-20 rounded-xl object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`; }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold">{p.projectName}</div>
                            <div className="text-xs text-neutral-400">{p.field} • {p.stage}</div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(p)} className="px-3 py-1 rounded-xl bg-white/10 text-white">Edit</button>
                            <button onClick={() => deletePost(p.id)} className="px-3 py-1 rounded-xl bg-red-600 text-white">Delete</button>
                          </div>
                        </div>
                        <p className="text-neutral-300 text-sm mt-2 line-clamp-2">{p.description}</p>
                      </div>
                    </div>
                  ))}
                  {myPosts.length === 0 && (
                    <div className="text-center py-10 bg-dark-800 rounded-2xl border border-white/10">
                      <p className="text-neutral-500">No posts yet.</p>
                    </div>
                  )}
                </div>

                {editingPost && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingPost(null)} />
                    <div className="relative w-full max-w-2xl bg-dark-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-800">
                        <h2 className="text-xl font-bold text-white">Edit Post</h2>
                        <button onClick={() => setEditingPost(null)} className="text-neutral-400 hover:text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                      <div className="overflow-y-auto p-6 space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-neutral-400 uppercase">Project Name</label>
                          <input value={editForm.projectName} onChange={(e) => setEditForm({ ...editForm, projectName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase">Field</label>
                            <select value={editForm.field} onChange={(e) => setEditForm({ ...editForm, field: e.target.value as ProjectField })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white">
                              {Object.values(ProjectField).map(f => (<option key={f} value={f} className="bg-dark-900">{f}</option>))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase">Stage</label>
                            <select value={editForm.stage} onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as ProjectStage })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white">
                              {Object.values(ProjectStage).map(s => (<option key={s} value={s} className="bg-dark-900">{s}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase">Compensation</label>
                            <input value={editForm.compensation} onChange={(e) => setEditForm({ ...editForm, compensation: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase">Deadline</label>
                            <input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white [color-scheme:dark]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-neutral-400 uppercase">Short Description</label>
                          <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-neutral-400 uppercase">Required Roles</label>
                          <input value={editForm.rolesInput} onChange={(e) => setEditForm({ ...editForm, rolesInput: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Frontend, Marketing" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-neutral-400 uppercase">Cover Image URL</label>
                          <input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-neutral-400 uppercase">Upload New Cover</label>
                          <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const path = await authService.uploadFile(profile.id, f);
                                setEditForm({ ...editForm, imageUrl: path });
                              }
                            }} className="text-neutral-300" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button onClick={() => setEditingPost(null)} className="px-5 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
                          <button onClick={saveEdit} className="px-5 py-2 rounded-xl bg-lime-accent text-black font-bold">Save</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      
    </div>
  );
};

export default ProfilePage;
