
import React, { useState } from 'react';
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
  flashNews?: string[]; 
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <div className="flex flex-col w-full sticky top-0 z-50 shadow-md">
      {/* Top Professional Bar - Minimized */}
      <div className="bg-[#1e1b4b] text-white text-[9px] sm:text-[10px] py-1 px-4 border-b border-white/5">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium opacity-80">
              <i className="fa-solid fa-phone text-amber-400"></i> +91 9902122531
            </span>
            <span className="hidden md:flex items-center gap-1.5 font-medium opacity-80">
              <i className="fa-solid fa-envelope text-amber-400"></i> support@shamanthacademy.com
            </span>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => onNavigate('course-schedule')}
                className="text-amber-400 font-black uppercase tracking-widest hover:text-amber-300"
             >
                Schedule
             </button>
          </div>
        </div>
      </div>

      {/* Main Branding & Navigation - Compact */}
      <header className="bg-white py-2 px-4 border-b border-gray-100">
        <div className="container mx-auto flex items-center justify-between gap-4 md:gap-6">
          <div onClick={onHomeClick} className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md group-hover:bg-indigo-800 transition-all relative">
              SA
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-base sm:text-lg font-black text-[#1e1b4b] tracking-tighter">SHAMANTH</span>
              <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">ACADEMY</span>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="flex-grow max-w-lg relative hidden md:block">
            <input 
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:border-indigo-600 outline-none transition-all"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-xs"
            >
              <i className={`fa-solid ${isMobileSearchOpen ? 'fa-xmark' : 'fa-magnifying-glass'}`}></i>
            </button>

            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                   {auth.user?.role === 'ADMIN' && (
                     <button onClick={onAdminClick} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors text-xs">
                       <i className="fa-solid fa-user-shield"></i>
                     </button>
                   )}
                   <button onClick={onLogout} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all text-xs">
                      <i className="fa-solid fa-power-off"></i>
                   </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 sm:px-5 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all whitespace-nowrap"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Search Bar Expandable */}
        {isMobileSearchOpen && (
          <div className="md:hidden mt-2 pb-2 px-2 animate-in slide-in-from-top-2">
            <div className="relative">
              <input 
                type="text"
                autoFocus
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-indigo-600 outline-none transition-all"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            </div>
          </div>
        )}
      </header>

      {/* Flash News Marquee - Minimalist */}
      {flashNews.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 py-1 overflow-hidden flex items-center">
          <div className="bg-amber-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-r-md z-10 flex-shrink-0">
            LATEST
          </div>
          <div className="flex-grow overflow-hidden whitespace-nowrap relative">
            <div className="inline-block animate-marquee hover:pause text-[10px] font-bold text-amber-900">
              {flashNews.map((news, idx) => (
                <span key={idx} className="mx-8 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 
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
          animation: marquee 40s linear infinite;
        }
        .pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Header;
