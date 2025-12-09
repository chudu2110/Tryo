import React, { useState, useRef } from 'react';
import { ProjectField, ProjectStage } from '../types';
import { enhanceDescription } from '../services/geminiService';
import * as authService from '../services/authService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  currentUser: string;
  currentUserId?: string | undefined;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit, currentUser, currentUserId }) => {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [field, setField] = useState<ProjectField>(ProjectField.OTHER);
  const [stage, setStage] = useState<ProjectStage>(ProjectStage.IDEA);
  const [compensation, setCompensation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [rolesInput, setRolesInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!description) return;
    setAiLoading(true);
    const enhanced = await enhanceDescription(description);
    setDescription(enhanced);
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl: string | null = imagePreview;
    try {
      if (imageFile && currentUserId) {
        const uploaded = await authService.uploadFile(currentUserId, imageFile, 'post_cover');
        imageUrl = uploaded || imagePreview;
      }
    } catch {}

    const postData = {
      founderName: currentUser,
      founderId: currentUserId,
      projectName,
      field,
      stage,
      compensation,
      deadline,
      description,
      roles: rolesInput.split(',').map(r => r.trim()).filter(r => r.length > 0),
      imageUrl: imageUrl || `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
    };
    onSubmit(postData);
    setLoading(false);
    onClose();
    setProjectName('');
    setDescription('');
    setCompensation('');
    setRolesInput('');
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-dark-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-dark-800">
          <h2 className="text-xl font-bold text-white">Post Opportunity</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent focus:ring-1 focus:ring-lime-accent transition-all placeholder:text-neutral-700"
                  placeholder="e.g. Stealth AI"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Field</label>
                <select 
                  value={field}
                  onChange={(e) => setField(e.target.value as ProjectField)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent appearance-none cursor-pointer"
                >
                  {Object.values(ProjectField).map(f => (
                    <option key={f} value={f} className="bg-dark-900">{f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400 uppercase">Project Cover</label>
              <div className="flex items-center gap-3">
                <input 
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="block text-neutral-300"
                />
              </div>
              <div className="w-full h-32 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-sm text-neutral-500">No image selected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Short Description</label>
                <button 
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={aiLoading || !description}
                  className="flex items-center gap-1 text-xs font-bold text-lime-accent hover:text-lime-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? (
                    <span className="animate-pulse">✨ Magic working...</span>
                  ) : (
                    <>
                      <span>✨ AI Enhance</span>
                    </>
                  )}
                </button>
              </div>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent h-32 resize-none placeholder:text-neutral-700"
                placeholder="What are you building? Who do you need?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase">Stage</label>
                <select 
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProjectStage)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent appearance-none cursor-pointer"
                >
                  {Object.values(ProjectStage).map(s => (
                    <option key={s} value={s} className="bg-dark-900">{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-neutral-400 uppercase">Compensation</label>
                 <input 
                  type="text" 
                  required
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent placeholder:text-neutral-700"
                  placeholder="e.g. 1-5% Equity"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-neutral-400 uppercase">Required Roles</label>
                 <input 
                  type="text" 
                  required
                  value={rolesInput}
                  onChange={(e) => setRolesInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent placeholder:text-neutral-700"
                  placeholder="e.g. Frontend, Marketing (comma separated)"
                />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-neutral-400 uppercase">Application Deadline</label>
                 <input 
                  type="date" 
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-accent [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full bg-lime-accent hover:bg-lime-400 text-black font-bold text-lg py-4 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(195,245,60,0.3)] hover:shadow-[0_0_30px_rgba(195,245,60,0.5)]"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span>Launching</span>
                    <span className="inline-block w-5 text-left animate-pulse">...</span>
                  </span>
                ) : (
                  'Post Opportunity'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
