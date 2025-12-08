import React from 'react';
import { UserAuthProfile } from '../types';

interface UserMenuProps {
  profile: UserAuthProfile | null;
  onClose: () => void;
  onProfile: () => void;
  onCommunity: () => void;
  onHelp: () => void;
  onLogout: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ profile, onClose, onProfile, onCommunity, onHelp, onLogout, onPrivacy, onTerms }) => {
  const secondary = profile?.contactEmail || profile?.contactFacebookUrl || '';
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0" />
      <div className="absolute right-4 top-16 w-64 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-3 pt-3 pb-2">
          <div className="text-white font-semibold">{profile?.name || 'Guest Founder'}</div>
          {secondary && <div className="text-neutral-400 text-xs">{secondary}</div>}
        </div>
        <div className="border-t border-white/10" />
        <div className="py-1">
          <button className="w-full px-3 py-2 flex items-center justify-between text-neutral-200 hover:bg-white/5" onClick={onProfile}>
            <span>Profile</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
          <button className="w-full px-3 py-2 flex items-center justify-between text-neutral-200 hover:bg-white/5" onClick={onCommunity}>
            <span>Community</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
          <button className="w-full px-3 py-2 flex items-center justify-between text-neutral-200 hover:bg-white/5" onClick={onHelp}>
            <span>Help Center</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>
          </button>
          <div className="border-t border-white/10 my-2" />
          <button className="w-full px-3 py-2 flex items-center justify-between text-neutral-200 hover:bg-white/5" onClick={onLogout}>
            <span>Logout</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
          </button>
        </div>
        <div className="border-t border-white/10" />
        <div className="py-1">
          <button className="w-full px-3 py-2 text-neutral-400 hover:bg-white/5 text-left text-sm" onClick={onPrivacy}>Privacy Policy</button>
          <button className="w-full px-3 py-2 text-neutral-400 hover:bg-white/5 text-left text-sm" onClick={onTerms}>Terms of Use</button>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
