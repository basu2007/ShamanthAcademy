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
}

const Header: React.FC<HeaderProps> = ({ 
  auth, 
  onLoginClick, 
  onLogout, 
  onAdminClick, 
  onHomeClick,
  onNavigate,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="flex flex-col w-full sticky top-0 z-50">
      {/* Top Contact Bar (DurgaSoft Style) - Slimmed */}
      <div className="bg-indigo-900 text-white text-[10px] sm:text-[11px] py-1 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-phone text-amber-400 text-[10px]"></i> +91 999 000 1234
            </span>
            <span className="hidden sm:flex items-center gap-1.5 border-l border-indigo-700 pl-4">
              <i className="fa-solid fa-envelope text-amber-400 text-[10px]"></i> contact@shamanthacademy.com
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('course-schedule')}
              className="hover:text-amber-400 transition-colors bg-transparent border-none p-0 cursor-pointer text-[10px] uppercase font-bold tracking-tight"
            >
              Schedules
            </button>
            <button 
              onClick={() => onNavigate('new-batches')}
              className="hover:text-amber-400 transition-colors bg-transparent border-none p-0 cursor-pointer text-[10px] uppercase font-bold tracking-tight"
            >
              New Batches
            </button>
            <div className="flex gap-2 ml-2">
              <i className="fa-brands fa-facebook hover:text-blue-400 cursor-pointer text-[10px]"></i>
              <i className="fa-brands fa-twitter hover:text-sky-400 cursor-pointer text-[10px]"></i>
              <i className="fa-brands fa-youtube hover:text-red-500 cursor-pointer text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Slimmed height */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div 
            onClick={onHomeClick}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-base group-hover:bg-indigo-800 transition-all shadow-md shadow-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-2 bg-amber-400 rounded-bl-full"></div>
              SA
            </div>
            
            <div className="flex flex-col -space-y-1">
              <span className="text-sm sm:text-lg font-black text-gray-900 tracking-tighter leading-none">Shamanth</span>
              <span className="text-[9px] sm:text-xs font-bold text-indigo-600 tracking-tight">Academy</span>
            </div>
          </div>

          {/* Search (Desktop Only) - Slimmed */}
          <div className="flex-grow max-w-lg relative hidden md:block">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input 
              type="text"
              placeholder="Search curriculum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {auth.isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {auth.user?.role === 'ADMIN' && (
                  <button 
                    onClick={onAdminClick}
                    className="text-amber-600 font-bold hover:text-amber-700 hidden lg:block text-[9px] uppercase tracking-wider"
                  >
                    Admin
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-inner text-[10px] sm:text-xs">
                    {auth.user?.email.charAt(0).toUpperCase()}
                  </div>
                  <button 
                    onClick={onLogout}
                    className="text-gray-400 hover:text-red-500 font-bold transition-colors p-1"
                  >
                    <i className="fa-solid fa-power-off text-xs sm:text-sm"></i>
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="bg-indigo-700 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black hover:bg-indigo-800 transition-all shadow-md shadow-indigo-100 text-[10px] sm:text-xs tracking-tight"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Bar - Slimmed */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-1.5">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input 
            type="text"
            placeholder="Search curriculum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 pl-9 pr-4 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* News Marquee (DurgaSoft Style) - Compact */}
      <div className="bg-amber-50 border-b border-amber-100 py-1 overflow-hidden">
        <div className="container mx-auto flex items-center">
          <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded ml-4 z-10 flex-shrink-0">News</span>
          <div className="flex-grow overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-marquee hover:pause whitespace-nowrap text-[10px] sm:text-[11px] font-bold text-amber-900">
              <span className="mx-8">🚀 New React 19 Mastery Course Launching Next Week!</span>
              <span className="mx-8">🔥 Java Full Stack Developer Batch starting from 25th July.</span>
              <span className="mx-8">💎 Special Discount for Early Enrollment.</span>
              <span className="mx-8">📢 Offline training batches now available at Mathikere Branch.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Header;