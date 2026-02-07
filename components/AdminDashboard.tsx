
import React, { useState, useEffect } from 'react';
import { User, Course, Batch } from '../types';
import * as db from '../services/db';

const AdminDashboard: React.FC = () => {
  const [isDiskMounted, setIsDiskMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeTab, setActiveTab] = useState<'disk' | 'pending' | 'seekers' | 'batches'>('disk');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDiskMounted) refreshData();
  }, [isDiskMounted]);

  const refreshData = async () => {
    const [u, c, b] = await Promise.all([db.getStoredUsers(), db.getCourses(), db.getBatches()]);
    setUsers(u); setCourses(c); setBatches(b);
  };

  const handleMount = async () => {
    const success = await db.mountDisk();
    if (success) {
      setIsDiskMounted(true);
      setActiveTab('pending');
    }
  };

  const pendingRequests = users.flatMap(user => 
    (user.pendingUnlocks || []).map(courseId => ({
      userId: user.id, userEmail: user.email, courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown'
    }))
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg ${isDiskMounted ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>
               {isDiskMounted ? 'Database: LIVE-CSV DISK MOUNTED' : 'Database: DISCONNECTED'}
             </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h1>
        </div>
        
        {isDiskMounted && (
          <nav className="flex bg-white p-1 rounded-2xl shadow-lg border border-slate-100 flex-wrap">
            {[
              { id: 'pending', label: 'Unlock Requests', icon: 'fa-clock' },
              { id: 'seekers', label: 'Students', icon: 'fa-users' },
              { id: 'batches', label: 'Batches', icon: 'fa-layer-group' },
              { id: 'disk', label: 'Disk Settings', icon: 'fa-hard-drive' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'
                }`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {!isDiskMounted ? (
        <div className="bg-white p-12 md:p-24 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center space-y-8 animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-inner">
             <i className="fa-solid fa-folder-open"></i>
           </div>
           <div className="max-w-md mx-auto">
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Mount Database Folder</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-10">
               Connect Shamanth Academy to a folder on your computer. All registrations, batches, and course data will be saved directly into `.csv` files within that folder.
             </p>
             <button 
               onClick={handleMount}
               className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-4"
             >
               <i className="fa-solid fa-link"></i> Select Folder & Start Database
             </button>
           </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
           {activeTab === 'pending' && (
             <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
                {pendingRequests.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                      <tr><th className="p-8">Student Email</th><th className="p-8">Requested Course</th><th className="p-8 text-right">Operation</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pendingRequests.map((req, i) => (
                        <tr key={i}>
                          <td className="p-8 font-bold text-sm text-slate-900">{req.userEmail}</td>
                          <td className="p-8"><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl">{req.courseTitle}</span></td>
                          <td className="p-8 text-right">
                            <button 
                              onClick={async () => { await db.approveUnlock(req.userId, req.courseId); refreshData(); }}
                              className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              Approve & Update CSV
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-32 text-center text-slate-300">
                    <i className="fa-solid fa-circle-check text-6xl mb-6"></i>
                    <p className="font-black text-xs uppercase tracking-widest">CSV Files are In-Sync</p>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'seekers' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                  <div key={u.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                    <h4 className="font-black text-slate-900 mb-1">{u.email}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">Saved in users.csv</p>
                    <div className="flex flex-wrap gap-2">
                       {u.enrolledCourses?.map(id => (
                         <span key={id} className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-md">Enrolled</span>
                       ))}
                    </div>
                  </div>
                ))}
             </div>
           )}

           {activeTab === 'disk' && (
             <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-white">
                <h3 className="text-2xl font-black mb-6">Disk Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="text-emerald-400 text-2xl font-black mb-2">{users.length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Records in users.csv</div>
                   </div>
                   <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="text-indigo-400 text-2xl font-black mb-2">{courses.length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Records in courses.csv</div>
                   </div>
                   <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                      <div className="text-amber-400 text-2xl font-black mb-2">{batches.length}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Records in batches.csv</div>
                   </div>
                </div>
                <button 
                  onClick={() => setIsDiskMounted(false)}
                  className="mt-12 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
                >
                  Disconnect Folder (Safety Eject)
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
