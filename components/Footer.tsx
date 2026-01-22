
import React from 'react';
import { InfoTopic } from './InfoView';

interface FooterProps {
  onNavigate: (topic: InfoTopic) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rounded-bl-full"></div>
                SA
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">Shamanth</span>
                <span className="text-sm font-bold text-indigo-600 tracking-tight">Academy</span>
              </div>
            </div>
            <p className="text-gray-500 leading-relaxed mb-8 font-medium">
              Empowering developers with structured, expert-led technical education. Accelerate your career with our specialized academy paths.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:text-white transition-all shadow-sm">
                <i className="fa-brands fa-github"></i>
              </a>
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:text-white transition-all shadow-sm">
                <i className="fa-brands fa-youtube"></i>
              </a>
              <a href="#" className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-indigo-700 hover:text-white transition-all shadow-sm">
                <i className="fa-brands fa-linkedin"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-8 uppercase text-xs tracking-[0.2em]">Learning Paths</h4>
            <ul className="space-y-5">
              <li><button onClick={() => onNavigate('react-flux')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">React Mastery</button></li>
              <li><button onClick={() => onNavigate('aws-dharma')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">AWS Essentials</button></li>
              <li><button onClick={() => onNavigate('ds-guru')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">Data Science</button></li>
              <li><button onClick={() => onNavigate('vedic-math')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">Logic & Math</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-8 uppercase text-xs tracking-[0.2em]">Platform</h4>
            <ul className="space-y-5">
              <li><button onClick={() => onNavigate('mission')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">About Us</button></li>
              <li><button onClick={() => onNavigate('support')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">Support</button></li>
              <li><button onClick={() => onNavigate('privacy')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('terms')} className="text-gray-500 hover:text-indigo-600 font-semibold transition-colors">Terms of Service</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-gray-900 mb-8 uppercase text-xs tracking-[0.2em]">Contact</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 cursor-pointer group" onClick={() => onNavigate('ashram')}>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-map-pin"></i>
                </div>
                <span className="text-gray-500 font-medium pt-2 group-hover:text-indigo-600 transition-colors">Mathikere, Bengaluru</span>
              </li>
              <li className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('contact')}>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <span className="text-gray-500 font-medium group-hover:text-indigo-600 transition-colors truncate">shamanth.infotech@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Shamanth Academy. Excellence in Learning.
          </p>
          <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6" alt="Visa" />
            <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6" alt="Mastercard" />
            <img src="https://img.icons8.com/color/48/000000/paypal.png" className="h-6" alt="Paypal" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
