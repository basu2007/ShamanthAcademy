
import React, { useState, useEffect } from 'react';
import { Batch, Course } from '../types';
import * as db from '../services/db';

export type InfoTopic = 
  | 'vedic-math' | 'react-flux' | 'aws-dharma' | 'ds-guru'
  | 'mission' | 'support' | 'privacy' | 'terms'
  | 'ashram' | 'contact' | 'course-schedule' | 'new-batches';

interface InfoViewProps {
  topic: InfoTopic;
  onBack: () => void;
}

const InfoView: React.FC<InfoViewProps> = ({ topic, onBack }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const load = async () => {
      const [b, c] = await Promise.all([db.getBatches(), db.getCourses()]);
      setBatches(b);
      setCourses(c);
    };
    load();
  }, [topic]);

  const renderSchedule = () => (
    <div className="space-y-8">
      <p className="text-gray-600">Plan your learning journey with our upcoming sessions. Manageable via Admin CSV Engine.</p>
      <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-indigo-900 text-white">
            <tr>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Batch Name</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Start Date</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Timings</th>
              <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {batches.length > 0 ? batches.map((batch, i) => (
              <tr key={i} className="hover:bg-indigo-50/50 transition-colors">
                <td className="px-6 py-5 font-black text-gray-900">{batch.title}</td>
                <td className="px-6 py-5 text-gray-600 font-bold">{batch.startDate}</td>
                <td className="px-6 py-5 text-indigo-600 font-black">{batch.timings}</td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-[9px] uppercase tracking-widest">{batch.mode}</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic text-xs">No active schedules found in database</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNewBatches = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      {batches.filter(b => b.status !== 'Completed').map((batch, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><i className="fa-solid fa-layer-group text-5xl"></i></div>
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">{batch.status}</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{batch.title}</h3>
          <div className="space-y-3 mb-8">
             <div className="flex items-center gap-3 text-xs text-gray-500 font-bold"><i className="fa-solid fa-calendar-check text-indigo-500"></i> {batch.startDate}</div>
             <div className="flex items-center gap-3 text-xs text-gray-500 font-bold"><i className="fa-solid fa-clock text-indigo-500"></i> {batch.timings}</div>
          </div>
          <button className="w-full py-4 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-900 transition-all">Enroll in Batch</button>
        </div>
      ))}
    </div>
  );

  const CONTENT_MAP: Record<InfoTopic, { title: string; icon: string; body: React.ReactNode }> = {
    'course-schedule': { title: 'Academic Timelines', icon: 'fa-calendar-days', body: renderSchedule() },
    'new-batches': { title: 'Open Enrollments', icon: 'fa-layer-group', body: renderNewBatches() },
    'vedic-math': { title: 'Logical Agility', icon: 'fa-calculator', body: <div className="space-y-4"><p>Sharpen your mental processing speed with our logic-driven mathematics modules.</p></div> },
    'react-flux': { title: 'React Mastery', icon: 'fa-atom', body: <p>Comprehensive training in modern React and Next.js architecture.</p> },
    'aws-dharma': { title: 'Cloud Infrastructure', icon: 'fa-cloud', body: <p>Master the cloud with AWS Solutions Architect training.</p> },
    'ds-guru': { title: 'Data Intelligence', icon: 'fa-brain', body: <p>Expert-led training in Python, ML, and Data Engineering.</p> },
    'mission': { title: 'Our Mission', icon: 'fa-bullseye', body: <p>Bridging the gap between theory and industry expertise.</p> },
    'support': { title: 'Student Support', icon: 'fa-headset', body: <p>24/7 dedicated support for all academy members.</p> },
    'privacy': { title: 'Privacy Policy', icon: 'fa-user-lock', body: <p>Your data is portable and secure.</p> },
    'terms': { title: 'Terms of Service', icon: 'fa-handshake', body: <p>Fair usage policy for academy resources.</p> },
    'ashram': { title: 'The Hub', icon: 'fa-map-location-dot', body: <p>Visit us in Mathikere, Bengaluru.</p> },
    'contact': { title: 'Get in Touch', icon: 'fa-paper-plane', body: <p>shamanth.infotech@gmail.com</p> }
  };

  const content = CONTENT_MAP[topic];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="mb-10 flex items-center gap-2 text-indigo-600 font-black hover:gap-4 transition-all uppercase text-[10px] tracking-widest"><i className="fa-solid fa-arrow-left"></i> Home</button>
      <div className="bg-white rounded-[3.5rem] p-10 md:p-20 shadow-2xl border border-slate-50 relative overflow-hidden">
        <div className="w-24 h-24 bg-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl mb-10 shadow-2xl shadow-indigo-200"><i className={`fa-solid ${content.icon}`}></i></div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-12 tracking-tighter leading-tight">{content.title}</h1>
        <div className="prose prose-indigo max-w-none">{content.body}</div>
      </div>
    </div>
  );
};

export default InfoView;
