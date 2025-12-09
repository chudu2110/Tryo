import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const test = async () => {
      const res = await supabase.from('posts').select('id');
      const hasError = Boolean(res.error);
      const noDataConfigured = res.data === null && res.error === null;
      if (noDataConfigured) {
        setStatus('pending');
        setMessage('Supabase chưa được cấu hình đầy đủ, đang chạy với dữ liệu cục bộ');
        return;
      }
      if (hasError) {
        const msg = res.error?.message || '';
        if (msg.includes("Could not find the table") && msg.includes("public.posts")) {
          setStatus('pending');
          setMessage('Supabase chưa có bảng public.posts, vui lòng áp dụng supabase/schema.sql');
          return;
        }
        setStatus('error');
        setMessage(msg || 'Supabase client chưa được cấu hình hoặc URL/Key không hợp lệ');
        return;
      }
      setStatus('ok');
    };
    void test();
  }, []);

  useEffect(() => {
    if (status === 'ok') {
      const hold = setTimeout(() => setFade(true), 1000);
      const hide = setTimeout(() => setShow(false), 1500);
      return () => { clearTimeout(hold); clearTimeout(hide); };
    }
  }, [status]);

  if (!show) return null;

  const isError = status === 'error';

  return (
    <div className={`fixed inset-0 z-50 bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}>
      <style>{`@keyframes loadingProgress { from { width: 0% } to { width: 80% } }`}</style>
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        {!isError && (
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border-[6px] border-lime-accent border-t-transparent animate-spin mb-8" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">Getting things ready</h1>
            <p className="text-neutral-400 mb-8 text-center max-w-xl">{message ? message : 'Initializing systems, please wait…'}</p>
            <div className="w-[min(80vw,36rem)] h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-lime-accent rounded-full" style={{ animation: 'loadingProgress 1200ms ease-out forwards' }} />
            </div>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">Server is busy right now</h1>
            <p className="text-neutral-400 mb-2">Please reload or come back later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
