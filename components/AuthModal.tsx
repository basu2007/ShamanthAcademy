
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      const user = await db.registerUser(email, pin);
      if (user) {
        onLogin(user);
      } else {
        setError('User already exists');
      }
    } else {
      const user = await db.loginUser(email, pin);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-700 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-5 h-5 bg-amber-400 rounded-bl-full"></div>
            SA
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
            {isRegister ? 'Join Our Academy' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            {isRegister ? 'Start your journey with Shamanth Academy' : 'Resume your professional growth'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-black text-gray-700 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="email" 
                required
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                placeholder="yours@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-black text-gray-700 uppercase tracking-widest px-1">Access PIN</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input 
                type="password" 
                required
                maxLength={4}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium tracking-widest"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm font-bold bg-red-50 py-3 px-4 rounded-xl text-center animate-pulse border border-red-100">{error}</div>}

          <button 
            type="submit"
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-200 transform active:scale-[0.98] mt-2"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-500 font-medium">
            {isRegister ? 'Already an academic?' : "New to Shamanth Academy?"}
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-indigo-600 font-black ml-2 hover:underline tracking-tight"
            >
              {isRegister ? 'Log In' : 'Sign Up Now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
