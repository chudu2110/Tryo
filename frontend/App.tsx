import React, { useState, useEffect } from 'react';
import { ProjectPost, UserAuthProfile } from './types';
import * as storageService from './services/storageService';
import * as authService from './services/authService';
import ProjectCard from './components/ProjectCard';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';

const App: React.FC = () => {
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const loadedPosts = storageService.getPosts();
    setPosts(loadedPosts.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
    const auth = authService.getProfile();
    if (auth?.name) {
      setCurrentUser(auth.name);
      setNewName(auth.name);
      storageService.saveUser(auth.name);
    } else {
      const user = storageService.getUser();
      setCurrentUser(user);
      setNewName(user);
    }
  }, []);

  const handleCreatePost = (postData: any) => {
    const newPost = storageService.createPost(postData);
    setPosts(prev => [newPost, ...prev]);
  };

  const handleAuthSuccess = (profile: UserAuthProfile) => {
    storageService.saveUser(profile.name);
    setCurrentUser(profile.name);
    setNewName(profile.name);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-lime-accent selection:text-black">
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
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-full transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-400 to-blue-500 border-2 border-black group-hover:border-lime-accent/50 transition-colors"></div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-white hidden sm:block">{currentUser}</span>
            </div>
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

        <div className="flex flex-wrap items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <button className="px-5 py-2 rounded-full bg-lime-accent text-black font-bold text-sm shadow-[0_0_15px_rgba(195,245,60,0.2)]">
            All Projects
          </button>
          <button className="px-5 py-2 rounded-full bg-dark-800 text-neutral-400 font-medium text-sm hover:text-white border border-white/5 hover:border-white/20 transition-all">
            🔥 Trending
          </button>
          <button className="px-5 py-2 rounded-full bg-dark-800 text-neutral-400 font-medium text-sm hover:text-white border border-white/5 hover:border-white/20 transition-all">
            🤖 AI & ML
          </button>
           <button className="px-5 py-2 rounded-full bg-dark-800 text-neutral-400 font-medium text-sm hover:text-white border border-white/5 hover:border-white/20 transition-all">
            💸 Fintech
          </button>
           <button className="px-5 py-2 rounded-full bg-dark-800 text-neutral-400 font-medium text-sm hover:text-white border border-white/5 hover:border-white/20 transition-all">
            🎓 EdTech
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <ProjectCard key={post.id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 bg-dark-800 rounded-3xl border border-white/5 border-dashed">
            <p className="text-neutral-500">No projects yet. Be the first to launch!</p>
          </div>
        )}
      </main>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-lime-accent rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(195,245,60,0.4)] hover:shadow-[0_0_50px_rgba(195,245,60,0.6)] hover:scale-110 transition-all duration-300 z-30 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>

      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
        currentUser={currentUser}
      />
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
