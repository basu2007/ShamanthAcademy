
import React, { useState, useEffect, useRef } from 'react';
import { User, Course, Batch, PlatformSettings } from '../types';
import * as db from '../services/db';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'seekers' | 'courses' | 'batches' | 'csv' | 'settings'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File Refs for CSV
  const csvUserRef = useRef<HTMLInputElement>(null);
  const csvCourseRef = useRef<HTMLInputElement>(null);
  const csvBatchRef = useRef<HTMLInputElement>(null);

  // Form States
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '', price: 4999, instructor: 'Shamanth S.', category: 'Java', videos: []
  });
  const [newBatch, setNewBatch] = useState<Partial<Batch>>({
    title: '', startDate: '', timings: '', mode: 'Online', status: 'Registration Open'
  });

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    const [u, c, b, s] = await Promise.all([
      db.getStoredUsers(), db.getCourses(), db.getBatches(), db.getPlatformSettings()
    ]);
    setUsers(u); setCourses(c); setBatches(b); setSettings(s);
  };

  // --- CSV ENGINE ---

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const exportAllToCSV = () => {
    // 1. Export Users
    const uHeaders = ['ID', 'Email', 'PIN', 'Role', 'Enrolled', 'Pending'];
    const uRows = users.map(u => [u.id, u.email, u.pin, u.role, u.enrolledCourses.join('|'), u.pendingUnlocks.join('|')]);
    downloadCSV([uHeaders, ...uRows].map(e => e.join(",")).join("\n"), `DB_USERS_${Date.now()}.csv`);

    // 2. Export Courses
    const cHeaders = ['ID', 'Title', 'Category', 'Price', 'Instructor'];
    const cRows = courses.map(c => [c.id, c.title.replace(/,/g, ''), c.category, c.price, c.instructor]);
    downloadCSV([cHeaders, ...cRows].map(e => e.join(",")).join("\n"), `DB_COURSES_${Date.now()}.csv`);

    // 3. Export Batches
    const bHeaders = ['ID', 'CourseID', 'Title', 'StartDate', 'Timings', 'Mode', 'Status'];
    const bRows = batches.map(b => [b.id, b.courseId, b.title.replace(/,/g, ''), b.startDate, b.timings, b.mode, b.status]);
    downloadCSV([bHeaders, ...bRows].map(e => e.join(",")).join("\n"), `DB_BATCHES_${Date.now()}.csv`);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>, type: 'users' | 'courses' | 'batches') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '').slice(1);
      
      if (type === 'users') {
        const imported: User[] = lines.map(l => {
          const c = l.split(',');
          return { id: c[0], email: c[1], pin: c[2], role: c[3] as any, enrolledCourses: c[4]?.split('|') || [], pendingUnlocks: c[5]?.split('|') || [] };
        });
        await db.bulkOverwriteUsers(imported);
      } else if (type === 'courses') {
        const imported: Course[] = lines.map(l => {
          const c = l.split(',');
          return { id: c[0], title: c[1], category: c[2], price: Number(c[3]), instructor: c[4], description: '', thumbnail: '', isFree: false, videos: [] };
        });
        await db.bulkOverwriteCourses(imported);
      } else {
        const imported: Batch[] = lines.map(l => {
          const c = l.split(',');
          return { id: c[0], courseId: c[1], title: c[2], startDate: c[3], timings: c[4], mode: c[5] as any, status: c[6] as any };
        });
        await db.bulkOverwriteBatches(imported);
      }
      refreshData();
      alert(`Database successfully updated from CSV.`);
    };
    reader.readAsText(file);
  };

  // --- ACTIONS ---

  const handleApprove = async (userId: string, courseId: string) => {
    setIsLoading(true);
    await db.approveUnlock(userId, courseId);
    await refreshData();
    setIsLoading(false);
  };

  const handleSaveBatch = async () => {
    if (!newBatch.title) return;
    const batch: Batch = {
      ...newBatch as Batch,
      id: newBatch.id || `b_${Date.now()}`,
      courseId: newBatch.courseId || courses[0]?.id || 'unknown'
    };
    await db.saveBatch(batch);
    setShowBatchForm(false);
    refreshData();
  };

  const pendingRequests = users.flatMap(user => 
    (user.pendingUnlocks || []).map(courseId => ({
      userId: user.id, userEmail: user.email, courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown'
    }))
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 mt-4 px-4">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Portable CSV DB Enabled</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Command Center</h1>
        </div>
        
        <nav className="flex bg-white p-1 rounded-2xl shadow-lg border border-slate-100 flex-wrap">
          {[
            { id: 'pending', label: 'Requests', icon: 'fa-clock' },
            { id: 'seekers', label: 'Students', icon: 'fa-users' },
            { id: 'batches', label: 'Batches', icon: 'fa-layer-group' },
            { id: 'courses', label: 'Curriculum', icon: 'fa-book' },
            { id: 'csv', label: 'CSV Engine', icon: 'fa-database' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
              {tab.id === 'pending' && pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[8px] px-1.5 rounded-full">{pendingRequests.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {pendingRequests.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                <tr><th className="p-6">Student</th><th className="p-6">Course</th><th className="p-6 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRequests.map((req, i) => (
                  <tr key={i}>
                    <td className="p-6 font-bold text-sm text-slate-900">{req.userEmail}</td>
                    <td className="p-6"><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{req.courseTitle}</span></td>
                    <td className="p-6 text-right"><button onClick={() => handleApprove(req.userId, req.courseId)} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Approve</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-24 text-center text-slate-300"><i className="fa-solid fa-circle-check text-5xl mb-4"></i><p className="font-black text-xs uppercase tracking-widest">All caught up</p></div>
          )}
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900">Live Training Schedule</h2>
            <button onClick={() => {setNewBatch({}); setShowBatchForm(true)}} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Create New Batch</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => (
              <div key={batch.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><i className="fa-solid fa-layer-group text-4xl"></i></div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{batch.status}</span>
                 <h3 className="text-lg font-black text-slate-900 mt-2 mb-4 leading-tight">{batch.title}</h3>
                 <div className="space-y-2 mb-6">
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold"><i className="fa-solid fa-calendar text-indigo-400"></i> Starts: {batch.startDate}</div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold"><i className="fa-solid fa-clock text-indigo-400"></i> {batch.timings}</div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-bold"><i className="fa-solid fa-location-dot text-indigo-400"></i> Mode: {batch.mode}</div>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => {setNewBatch(batch); setShowBatchForm(true)}} className="flex-grow py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-50">Modify</button>
                   <button onClick={() => db.deleteBatch(batch.id).then(refreshData)} className="w-10 h-10 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white"><i className="fa-solid fa-trash"></i></button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Engine Tab */}
      {activeTab === 'csv' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white space-y-6">
             <h3 className="text-xl font-black tracking-tight">Full Platform Export</h3>
             <p className="text-xs text-slate-400 font-medium leading-relaxed">Download your entire platform state into CSV. Use these files as backups or to edit data in Excel.</p>
             <button onClick={exportAllToCSV} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"><i className="fa-solid fa-file-export"></i> Download Master CSV Pack</button>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
             <h3 className="text-xl font-black text-slate-900 tracking-tight">CSV Bulk Ingestion</h3>
             <p className="text-xs text-slate-400 font-medium">Update the website by uploading your modified CSV files.</p>
             <div className="space-y-3">
               <button onClick={() => csvUserRef.current?.click()} className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-black text-[10px] uppercase">Inject Student Database <i className="fa-solid fa-upload"></i></button>
               <input type="file" ref={csvUserRef} className="hidden" accept=".csv" onChange={e => handleImportCSV(e, 'users')} />
               
               <button onClick={() => csvCourseRef.current?.click()} className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-black text-[10px] uppercase">Inject Curriculum (Courses) <i className="fa-solid fa-upload"></i></button>
               <input type="file" ref={csvCourseRef} className="hidden" accept=".csv" onChange={e => handleImportCSV(e, 'courses')} />

               <button onClick={() => csvBatchRef.current?.click()} className="w-full flex items-center justify-between p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl font-black text-[10px] uppercase">Inject Batch Schedule <i className="fa-solid fa-upload"></i></button>
               <input type="file" ref={csvBatchRef} className="hidden" accept=".csv" onChange={e => handleImportCSV(e, 'batches')} />
             </div>
          </div>
        </div>
      )}

      {/* Batch Form Modal */}
      {showBatchForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowBatchForm(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl relative z-10">
            <h2 className="text-2xl font-black text-slate-900 mb-8">Scheduling Hub</h2>
            <div className="space-y-6 mb-8">
              <input type="text" placeholder="Batch Title (e.g., Java Evening Batch)" value={newBatch.title} onChange={e => setNewBatch({...newBatch, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Start Date" value={newBatch.startDate} onChange={e => setNewBatch({...newBatch, startDate: e.target.value})} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" />
                <input type="text" placeholder="Timings" value={newBatch.timings} onChange={e => setNewBatch({...newBatch, timings: e.target.value})} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" />
              </div>
              <select value={newBatch.mode} onChange={e => setNewBatch({...newBatch, mode: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm">
                <option value="Online">Online Only</option>
                <option value="Offline">Offline (Mathikere Hub)</option>
                <option value="Hybrid">Hybrid Mode</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveBatch} className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Apply to Schedule</button>
              <button onClick={() => setShowBatchForm(false)} className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
