
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
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const user = await db.registerUser(email, pin);
        if (user) onLogin(user);
        else setError('User already exists');
      } else {
        const user = await db.loginUser(email, pin);
        if (user) onLogin(user);
        else setError('Invalid email or PIN');
      }
    } catch (err) {
      setError('Connection failure. Try again.');
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
      
      <div className="bg-white rounded-[2rem] w-full max-w-md p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
        {/* Close Button - Added */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-all border border-slate-100"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-xl">
            SA
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {isRegister ? 'New Student' : 'Student Portal'}
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-medium">
            {isRegister ? 'Join our global academy today' : 'Continue your technical journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="email" 
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-all font-medium text-sm"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Access PIN (4-Digit)</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="password" 
                required
                maxLength={4}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none transition-all font-medium text-sm tracking-[0.5em]"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-[10px] font-black bg-red-50 py-2.5 px-4 rounded-lg text-center border border-red-100 uppercase tracking-wider">{error}</div>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
          >
            {isLoading ? 'Verifying...' : (isRegister ? 'Create Account' : 'Authenticate')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-slate-400 text-xs font-bold">
            {isRegister ? 'Member already?' : "Not enrolled yet?"}
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-indigo-600 font-black ml-2 hover:underline"
            >
              {isRegister ? 'Log In' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
