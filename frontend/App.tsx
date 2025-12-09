import React, { useState, useEffect } from 'react';
import { ProjectPost, UserAuthProfile, ProjectField } from './types';
import * as storageService from './services/storageService';
import * as authService from './services/authService';
import ProjectCard from './components/ProjectCard';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import UserMenu from './components/UserMenu';
import ConnectionStatus from './components/ConnectionStatus';

const App: React.FC = () => {
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentProfile, setCurrentProfile] = useState<UserAuthProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [route, setRoute] = useState<string>(typeof window !== 'undefined' ? (window.location.hash.replace('#','') || 'home') : 'home');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewsVersion, setViewsVersion] = useState(0);

  useEffect(() => {
    const loadedPosts = storageService.getPosts();
    setPosts(loadedPosts.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
    const auth = authService.getProfile();
    if (auth?.name) {
      setCurrentUser(auth.name);
      setNewName(auth.name);
      setCurrentProfile(auth);
      storageService.saveUser(auth.name);
    } else {
      setCurrentUser('Guest Founder');
      setNewName('Guest Founder');
      storageService.saveUser('Guest Founder');
    }
  }, []);

  useEffect(() => {
    const lower = searchQuery.trim().toLowerCase();
    const items = new Set<string>();
    posts.forEach(p => {
      if (p.projectName) items.add(p.projectName);
      p.roles.forEach(r => items.add(r));
      items.add(p.field);
    });
    const base = Array.from(items);
    const filtered = lower.length > 0 ? base.filter(s => s.toLowerCase().includes(lower)) : [];
    setSuggestions(filtered.slice(0, 8));
  }, [posts, searchQuery]);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#','') || 'home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onPostsChanged = () => {
      const loaded = storageService.getPosts();
      setPosts(loaded.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
    };
    window.addEventListener('posts:changed', onPostsChanged as EventListener);
    return () => window.removeEventListener('posts:changed', onPostsChanged as EventListener);
  }, []);

  useEffect(() => {
    const onViewsChanged = () => {
      setViewsVersion(v => v + 1);
    };
    window.addEventListener('posts:viewsChanged', onViewsChanged as EventListener);
    return () => window.removeEventListener('posts:viewsChanged', onViewsChanged as EventListener);
  }, []);

  useEffect(() => {
    const onProfileUpdated = () => {
      const refreshed = authService.getProfile();
      if (refreshed) {
        setCurrentProfile(refreshed);
        setCurrentUser(refreshed.name);
        setNewName(refreshed.name);
      }
    };
    window.addEventListener('auth:profileUpdated', onProfileUpdated as EventListener);
    return () => window.removeEventListener('auth:profileUpdated', onProfileUpdated as EventListener);
  }, []);

  useEffect(() => {
    if (route === 'profile') {
      const refreshed = authService.getProfile();
      if (refreshed) {
        setCurrentProfile(refreshed);
        setCurrentUser(refreshed.name);
        setNewName(refreshed.name);
      }
    }
  }, [route]);

  const handleCreatePost = (postData: any) => {
    storageService.createPost(postData);
    // posts:changed listener will refresh list
  };

  const handleAuthSuccess = (profile: UserAuthProfile) => {
    storageService.saveUser(profile.name);
    setCurrentUser(profile.name);
    setNewName(profile.name);
    setCurrentProfile(profile);
  };

  const handleLogout = () => {
    authService.clearProfile();
    storageService.saveUser('Guest Founder');
    setCurrentProfile(null);
    setCurrentUser('Guest Founder');
    setNewName('Guest Founder');
    window.location.hash = '';
    setIsUserMenuOpen(false);
  };

  return (
    route === 'profile' && currentProfile ? (
      <ProfilePage 
        profile={currentProfile}
        onSaved={(p) => { setCurrentProfile(p); setCurrentUser(p.name); setNewName(p.name); }}
        onDeleted={handleLogout}
      />
    ) : (
      <div className="min-h-screen pb-20 selection:bg-lime-accent selection:text-black">
        <ConnectionStatus />
        <header className="sticky top-0 z-40 w-full bg-black/50 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-full h-full">
                  <defs>
                    <linearGradient id="tryoGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6a00ff" />
                      <stop offset="55%" stopColor="#2d6bdd" />
                      <stop offset="100%" stopColor="#10c7e4" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#tryoGradient)" />
                  <path d="M12 6l5 5h-3v7H10v-7H7l5-5z" fill="#ffffff" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Tryo</span>
            </div>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => {
                  if (currentProfile) { setIsUserMenuOpen(true); } else { setIsAuthOpen(true); }
                }}
                className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-400 to-blue-500 border-2 border-black group-hover:border-lime-accent/50 transition-colors"></div>
                <span className="text-sm font-medium text-neutral-300 group-hover:text-white hidden sm:block">{currentUser}</span>
              </div>
              {isUserMenuOpen && (
                <UserMenu 
                  profile={currentProfile}
                  onClose={() => setIsUserMenuOpen(false)}
                  onProfile={() => { window.location.hash = 'profile'; setIsUserMenuOpen(false); }}
                  onCommunity={() => { window.location.hash = 'home'; setIsUserMenuOpen(false); }}
                  onHelp={() => { window.location.hash = 'home'; setIsUserMenuOpen(false); }}
                  onLogout={handleLogout}
                  onPrivacy={() => { window.location.hash = 'privacy'; setIsUserMenuOpen(false); }}
                  onTerms={() => { window.location.hash = 'terms'; setIsUserMenuOpen(false); }}
                />
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-lime-500">future</span>, together.
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed">
              Find your next co-founder, join an early-stage rocket ship, or post your wild idea. 
              Remote-first opportunities for the next generation of builders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => { setActiveCategory('all'); }} className={`px-5 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(195,245,60,0.2)] ${activeCategory==='all' ? 'bg-lime-accent text-black' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'}`}>
              All Projects
            </button>
            <button onClick={() => { setActiveCategory('trending'); }} className={`px-5 py-2 rounded-full text-sm font-medium ${activeCategory==='trending' ? 'bg-lime-accent text-black font-bold shadow-[0_0_15px_rgba(195,245,60,0.2)]' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'}`}>
              🔥 Trending
            </button>
            <button onClick={() => { setActiveCategory(ProjectField.AI); }} className={`px-5 py-2 rounded-full text-sm font-medium ${activeCategory===ProjectField.AI ? 'bg-lime-accent text-black font-bold shadow-[0_0_15px_rgba(195,245,60,0.2)]' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'}`}>
              🤖 AI & ML
            </button>
            <button onClick={() => { setActiveCategory(ProjectField.FINTECH); }} className={`px-5 py-2 rounded-full text-sm font-medium ${activeCategory===ProjectField.FINTECH ? 'bg-lime-accent text-black font-bold shadow-[0_0_15px_rgba(195,245,60,0.2)]' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'}`}>
              💸 Fintech
            </button>
            <button onClick={() => { setActiveCategory(ProjectField.EDTECH); }} className={`px-5 py-2 rounded-full text-sm font-medium ${activeCategory===ProjectField.EDTECH ? 'bg-lime-accent text-black font-bold shadow-[0_0_15px_rgba(195,245,60,0.2)]' : 'bg-dark-800 text-neutral-400 hover:text-white border border-white/5 hover:border-white/20'}`}>
              🎓 EdTech
            </button>
          </div>

          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto z-30">
              <input
                value={searchQuery}
                onChange={(e) => { const v = e.target.value; setSearchQuery(v); setShowSuggestions(v.trim().length > 0); }}
                onFocus={() => setShowSuggestions(searchQuery.trim().length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full rounded-full px-5 py-3 text-white placeholder:text-neutral-500 bg-white/10 appearance-none focus:outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-lime-accent"
                placeholder="Search projects, roles, fields..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              {showSuggestions && suggestions.length > 0 && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((s, i) => (
                    <button key={i} onMouseDown={() => { setSearchQuery(s); setShowSuggestions(false); }} className="w-full text-left px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const qMatch = (p: ProjectPost) => q.length === 0 || [p.projectName, p.description, p.field, ...p.roles].some(x => x.toLowerCase().includes(q));
              if (activeCategory === 'trending') {
                const topIds = storageService.getTopTrendingPostIds(30);
                const idToRank = new Map<string, number>(topIds.map((id, idx) => [id, idx]));
                const topPosts = posts.filter(p => topIds.includes(p.id)).filter(qMatch);
                topPosts.sort((a, b) => (idToRank.get(a.id) ?? 9999) - (idToRank.get(b.id) ?? 9999));
                return topPosts.map(post => (<ProjectCard key={post.id} post={post} />));
              }
              const base = posts.filter(p => (activeCategory === 'all' ? true : p.field === activeCategory)).filter(qMatch);
              return base.map(post => (<ProjectCard key={post.id} post={post} />));
            })()}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-20 bg-dark-800 rounded-3xl border border-white/5 border-dashed">
              <p className="text-neutral-500">No projects yet. Be the first to launch!</p>
            </div>
          )}
        </main>

        {currentProfile && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-lime-accent rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(195,245,60,0.4)] hover:shadow-[0_0_50px_rgba(195,245,60,0.6)] hover:scale-110 transition-all duration-300 z-30 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        )}

        <CreatePostModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePost}
          currentUser={currentUser}
          currentUserId={currentProfile?.id}
        />
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
        {route === 'privacy' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy</h2>
            <p className="text-neutral-400">This is a placeholder Privacy Policy section.</p>
          </div>
        )}
        {route === 'terms' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-2xl font-bold text-white mb-4">Terms of Use</h2>
            <p className="text-neutral-400">This is a placeholder Terms of Use section.</p>
          </div>
        )}
      </div>
    )
  );
};

export default App;
