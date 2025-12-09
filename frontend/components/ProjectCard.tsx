import React from 'react';
import { ProjectPost } from '../types';

interface ProjectCardProps {
  post: ProjectPost;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ post }) => {
  const daysLeft = Math.ceil(
    (new Date(post.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

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
            <p className="text-sm text-neutral-400">by {post.founderName}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-neutral-500 uppercase">Stage</span>
            <span className="text-sm font-semibold text-white">{post.stage}</span>
          </div>
        </div>

        <p className="mt-4 text-neutral-300 text-sm leading-relaxed line-clamp-3">
          {post.description}
        </p>

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
    </div>
  );
};

export default ProjectCard;
