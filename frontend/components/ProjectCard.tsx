import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ProjectPost, UserAuthProfile } from '../types';
import * as authService from '../services/authService';
import * as storageService from '../services/storageService';

interface ProjectCardProps {
  post: ProjectPost;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ post }) => {
  const daysLeft = Math.ceil(
    (new Date(post.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<UserAuthProfile | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showProfile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showProfile]);

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

  const imgSrc = normalizeSrc(post.imageUrl);

  const openProfile = async () => {
    try { storageService.incrementProfileViews(post.id); } catch {}
    setShowProfile(true);
    setProfileLoading(true);
    const local = authService.getSavedProfileByName(post.founderName);
    if (local) {
      setProfile(local);
      setProfileLoading(false);
      return;
    }
    try {
      const fetched = await authService.getPublicProfileByName(post.founderName);
      if (fetched) {
        setProfile(fetched);
        authService.setSavedProfileByName(post.founderName, fetched);
      }
    } catch {}
    setProfileLoading(false);
  };

  useEffect(() => {}, []);

  return (
    <div className="group relative w-full bg-dark-800 rounded-3xl overflow-hidden border border-white/5 hover:border-lime-accent/50 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-lime-accent/10">
      <div className="h-48 w-full overflow-hidden relative">
        <img 
          src={imgSrc || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`}
          alt={post.projectName} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`; }}
        />
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <span className="text-xs font-bold text-white uppercase tracking-wider">{post.field}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
             <h3 className="text-xl font-bold text-white mb-1 group-hover:text-lime-accent transition-colors">
              {post.projectName}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-neutral-400">by {post.founderName}</p>
              <button aria-label="View author profile" onClick={openProfile} className="p-1 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-neutral-500 uppercase">Stage</span>
            <span className="text-sm font-semibold text-white">{post.stage}</span>
          </div>
        </div>

        <p className={`mt-4 text-neutral-300 text-sm leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
          {post.description}
        </p>

        <div className="mt-2 flex justify-end">
          <button
            aria-label={descExpanded ? 'Collapse description' : 'Expand description'}
            onClick={() => setDescExpanded(v => !v)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {descExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            )}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {post.roles.map((role, idx) => (
            <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-neutral-300 border border-white/5">
              {role}
            </span>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 uppercase">Compensation</span>
            <span className="text-sm font-semibold text-lime-accent">{post.compensation}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-neutral-500 uppercase">Deadline</span>
            <span className={`text-sm font-semibold ${daysLeft < 3 ? 'text-red-400' : 'text-white'}`}>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
            </span>
          </div>
        </div>
      </div>
      {showProfile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowProfile(false)} />
          <div className="relative w-full max-w-md bg-dark-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-dark-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-lime-400 to-blue-500 border-2 border-black" />
                <div>
                  <p className="text-sm font-bold text-white">{post.founderName}</p>
                  <p className="text-xs text-neutral-500">Author</p>
                </div>
              </div>
              <button onClick={() => setShowProfile(false)} className="text-neutral-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {profileLoading ? (
                <p className="text-sm text-neutral-400">Loading...</p>
              ) : profile ? (
                <>
                  {profile.bio && <p className="text-sm text-neutral-300">{profile.bio}</p>}
                  <div className="space-y-1">
                    {profile.provider === 'google' && profile.contactEmail && (
                      <p className="text-sm"><span className="text-neutral-500">Email:</span> <span className="text-white">{profile.contactEmail}</span></p>
                    )}
                    {profile.provider === 'facebook' && profile.contactFacebookUrl && (
                      <p className="text-sm"><span className="text-neutral-500">Facebook:</span> <a href={profile.contactFacebookUrl} target="_blank" rel="noreferrer" className="text-lime-accent hover:underline">{profile.contactFacebookUrl}</a></p>
                    )}
                    {profile.phoneNumber && (
                      <p className="text-sm"><span className="text-neutral-500">Phone:</span> <span className="text-white">{profile.phoneNumber}</span></p>
                    )}
                    {(profile.links || []).length > 0 && (
                      <div className="space-y-1">
                        {(profile.links || []).map((l, i) => {
                          if (typeof l === 'string') {
                            const lower = l.toLowerCase();
                            const text = lower.includes('linkedin') ? 'LinkedIn' : l;
                            return (
                              <a key={i} href={l} target="_blank" rel="noreferrer" className="block text-sm text-lime-accent hover:underline">{text}</a>
                            );
                          }
                          const t = (l as any).title || (l as any).url;
                          const u = (l as any).url;
                          const text = (t || '').toLowerCase().includes('linkedin') ? 'LinkedIn' : t;
                          return (
                            <a key={i} href={u} target="_blank" rel="noreferrer" className="block text-sm text-lime-accent hover:underline">{text}</a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-300">No public profile found.</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectCard;
