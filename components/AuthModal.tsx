
import React, { useState } from 'react';
import { User } from '../types';
import * as db from '../services/db';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('PIN must be 4 digits.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        // --- REGISTRATION LOGIC ---
        const user = await db.registerUser(email, pin);
        if (user) {
          onLogin(user);
        } else {
          setError('This email is already in our records. Please try logging in instead.');
        }
      } else {
        // --- LOGIN LOGIC ---
        const user = await db.loginUser(email, pin);
        if (user) {
          onLogin(user);
        } else {
          setError('The email or PIN entered is incorrect. Please verify and try again.');
        }
      }
    } catch (err: any) {
      console.warn("Auth system warning:", err);
      // This block only triggers if the browser throws a technical error
      setError('System busy. Switching to secure local mode...');
      
      // Attempt manual local lookup as ultimate safety
      setTimeout(async () => {
        try {
          const users = await db.getStoredUsers();
          const localUser = users.find(u => u.email === email.trim().toLowerCase() && u.pin === pin.trim());
          if (localUser) onLogin(localUser);
        } catch (e) {}
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300 border border-white/20">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all border border-slate-100 group z-20"
        >
          <i className="fa-solid fa-xmark text-lg group-hover:scale-110"></i>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-xl shadow-indigo-200">
            SA
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {isRegister ? 'Join the Academy' : 'Student Access'}
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-bold uppercase tracking-widest">
            {isRegister ? 'Start your tech journey' : 'Resume your learning path'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email ID</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-all font-bold text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secure 4-Digit PIN</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="password" 
                required
                maxLength={4}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-all font-bold text-sm tracking-[0.6em]"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-[9px] font-black bg-red-50 py-3 px-4 rounded-xl text-center border border-red-100 uppercase tracking-wider flex items-center justify-center gap-2 leading-tight">
              <i className="fa-solid fa-circle-exclamation text-xs"></i>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin"></i> Initializing...
              </span>
            ) : (isRegister ? 'Register Now' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
            {isRegister ? 'Already a student?' : "First time here?"}
            <button 
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-indigo-600 font-black ml-2 hover:underline"
            >
              {isRegister ? 'Go to Login' : 'Create Profile'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
