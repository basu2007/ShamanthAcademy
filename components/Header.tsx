
import React from 'react';
import { AuthState } from '../types';

interface HeaderProps {
  auth: AuthState;
  onLoginClick: () => void;
  onLogout: () => void;
  onAdminClick: () => void;
  onHomeClick: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  auth, 
  onLoginClick, 
  onLogout, 
  onAdminClick, 
  onHomeClick,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 bg-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-full"></div>
            SA
          </div>
          <div className="flex flex-col -space-y-1 hidden sm:flex">
            <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">Shamanth</span>
            <span className="text-sm font-bold text-indigo-600 tracking-tight">Academy</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-grow max-w-xl relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text"
            placeholder="Search our curriculum..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          {auth.isAuthenticated ? (
            <div className="flex items-center gap-5">
              {auth.user?.role === 'ADMIN' && (
                <button 
                  onClick={onAdminClick}
                  className="text-amber-600 font-bold hover:text-amber-700 hidden lg:block text-sm uppercase tracking-wider"
                >
                  Admin Console
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black shadow-inner">
                  {auth.user?.email.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={onLogout}
                  className="text-gray-400 hover:text-red-500 font-bold transition-colors"
                >
                  <i className="fa-solid fa-power-off"></i>
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 text-sm tracking-tight"
            >
              Join Academy
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
