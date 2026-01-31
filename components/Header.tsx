
import React from 'react';
import { AuthState } from '../types.ts';
import { InfoTopic } from './InfoView.tsx';

interface HeaderProps {
  auth: AuthState;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
  onNavigate: (topic: InfoTopic) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  flashNews?: string[]; // Dynamic news from admin
}

const Header: React.FC<HeaderProps> = ({ 
  auth, 
  onLoginClick, 
  onLogout, 
  onAdminClick, 
  onHomeClick,
  onNavigate,
  searchQuery,
  setSearchQuery,
  flashNews = []
}) => {
  return (
    <div className="flex flex-col w-full sticky top-0 z-50 shadow-xl">
      {/* Top Professional Bar */}
      <div className="bg-[#1e1b4b] text-white text-[10px] sm:text-[11px] py-2 px-4 border-b border-white/10">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-medium">
              <i className="fa-solid fa-phone text-amber-400"></i> +91 9902122531
            </span>
            <span className="hidden md:flex items-center gap-2 font-medium">
              <i className="fa-solid fa-envelope text-amber-400"></i> support@shamanthacademy.com
            </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex gap-3 pr-4 border-r border-white/10 hidden sm:flex">
                <i className="fa-brands fa-facebook hover:text-amber-400 transition-colors cursor-pointer"></i>
                <i className="fa-brands fa-linkedin hover:text-amber-400 transition-colors cursor-pointer"></i>
                <i className="fa-brands fa-youtube hover:text-amber-400 transition-colors cursor-pointer"></i>
             </div>
             <button 
                onClick={() => onNavigate('course-schedule')}
                className="text-amber-400 font-black uppercase tracking-widest hover:underline"
             >
                Course Schedule
             </button>
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation */}
      <header className="bg-white py-3 px-4 border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <div onClick={onHomeClick} className="flex items-center gap-3 cursor-pointer group flex-shrink-0">
            <div className="w-10 h-10 bg-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:bg-indigo-800 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-full"></div>
              SA
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black text-[#1e1b4b] tracking-tighter">SHAMANTH</span>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">ACADEMY</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-grow max-w-xl relative hidden md:block">
            <input 
              type="text"
              placeholder="What do you want to learn today?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 focus:bg-white transition-all outline-none shadow-inner"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Signed In As</span>
                  <span className="text-xs font-bold text-slate-900">{auth.user?.email.split('@')[0]}</span>
                </div>
                <div className="flex items-center gap-3">
                   {auth.user?.role === 'ADMIN' && (
                     <button onClick={onAdminClick} className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors">
                       <i className="fa-solid fa-user-shield"></i>
                     </button>
                   )}
                   <button onClick={onLogout} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all">
                      <i className="fa-solid fa-power-off"></i>
                   </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 text-xs uppercase tracking-widest"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Flash News Marquee */}
      {flashNews.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 py-2 overflow-hidden flex items-center">
          <div className="bg-amber-500 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-r-full shadow-lg z-10 flex-shrink-0 animate-pulse">
            <i className="fa-solid fa-bolt mr-2"></i>Flash News
          </div>
          <div className="flex-grow overflow-hidden whitespace-nowrap relative">
            <div className="inline-block animate-marquee hover:pause text-[11px] sm:text-xs font-bold text-amber-900">
              {flashNews.map((news, idx) => (
                <span key={idx} className="mx-12 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
                  {news}
                </span>
              ))}
              {/* Duplicate for seamless looping if short */}
              {flashNews.length < 3 && flashNews.map((news, idx) => (
                <span key={`dup-${idx}`} className="mx-12 flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> 
                  {news}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Header;
