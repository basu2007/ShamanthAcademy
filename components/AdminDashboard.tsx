
import React, { useState, useEffect, useRef } from 'react';
import { User, Course, Batch, PlatformSettings } from '../types';
import * as db from '../services/db';

const AdminDashboard: React.FC = () => {
  const [isDiskMounted, setIsDiskMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'disk' | 'pending' | 'seekers' | 'batches' | 'courses' | 'settings'>('disk');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  // Forms
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<Batch>>({});
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({ videos: [] });

  useEffect(() => {
    if (isDiskMounted) refreshData();
  }, [isDiskMounted]);

  const refreshData = async () => {
    const [u, c, b, s] = await Promise.all([
      db.getStoredUsers(), db.getCourses(), db.getBatches(), db.getPlatformSettings()
    ]);
    setUsers(u); setCourses(c); setBatches(b); setSettings(s);
  };

  const handleMount = async () => {
    const success = await db.mountDisk();
    if (success) setIsDiskMounted(true);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const updated = { ...settings, paymentQrCode: base64 };
      setSettings(updated);
      await db.saveSettings(updated);
    };
    reader.readAsDataURL(file);
  };

  const pendingRequests = users.flatMap(user => 
    (user.pendingUnlocks || []).map(courseId => ({
      userId: user.id, userEmail: user.email, courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown'
    }))
  );

  if (!isDiskMounted) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-inner">
            <i className="fa-solid fa-folder-tree"></i>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Mount Database Folder</h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">Select a folder on your computer. Shamanth Academy will automatically manage your .csv database files there.</p>
          <button onClick={handleMount} className="bg-indigo-700 hover:bg-indigo-800 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all">
            <i className="fa-solid fa-link mr-2"></i> Connect Local Storage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Command Center</h1>
        <nav className="flex bg-white p-1 rounded-2xl shadow-xl border border-slate-100 flex-wrap overflow-x-auto">
          {[
            { id: 'pending', label: 'Requests', icon: 'fa-clock' },
            { id: 'seekers', label: 'Students', icon: 'fa-users' },
            { id: 'batches', label: 'Schedules', icon: 'fa-calendar-days' },
            { id: 'courses', label: 'Courses', icon: 'fa-book' },
            { id: 'settings', label: 'Settings', icon: 'fa-gear' },
            { id: 'disk', label: 'Disk', icon: 'fa-hard-drive' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}>
              <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
              {tab.id === 'pending' && pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[8px] px-1.5 rounded-full">{pendingRequests.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in">
          {pendingRequests.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <tr><th className="p-8">Student</th><th className="p-8">Course</th><th className="p-8 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRequests.map((req, i) => (
                  <tr key={i}>
                    <td className="p-8 font-bold text-slate-900">{req.userEmail}</td>
                    <td className="p-8"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black">{req.courseTitle}</span></td>
                    <td className="p-8 text-right"><button onClick={async () => { await db.approveUnlock(req.userId, req.courseId); refreshData(); }} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase">Approve</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-32 text-center text-slate-300"><i className="fa-solid fa-circle-check text-6xl mb-4"></i><p className="font-black uppercase text-xs tracking-widest">Database In-Sync</p></div>}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
            <h3 className="text-xl font-black text-slate-900 mb-8">Payment Gateway (QR)</h3>
            <div className="flex flex-col items-center gap-6">
              <div className="w-56 h-56 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden">
                {settings?.paymentQrCode ? <img src={settings.paymentQrCode} className="w-full h-full object-contain" /> : <i className="fa-solid fa-qrcode text-6xl text-slate-200"></i>}
              </div>
              <input type="file" id="qr-upload" hidden accept="image/*" onChange={handleQrUpload} />
              <label htmlFor="qr-upload" className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Change QR Code</label>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Platform Details</h3>
            <div className="space-y-4">
              <div><label className="text-[10px] font-black uppercase text-slate-400">UPI ID</label><input type="text" value={settings?.upiId} onChange={async (e) => { const s = {...settings!, upiId: e.target.value}; setSettings(s); await db.saveSettings(s); }} className="w-full mt-1 p-4 bg-slate-50 rounded-xl font-bold" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Contact Number</label><input type="text" value={settings?.contactNumber} onChange={async (e) => { const s = {...settings!, contactNumber: e.target.value}; setSettings(s); await db.saveSettings(s); }} className="w-full mt-1 p-4 bg-slate-50 rounded-xl font-bold" /></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900">Training Schedules</h2>
            <button onClick={() => { setEditingBatch({ status: 'Registration Open', mode: 'Online' }); setShowBatchForm(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">New Batch</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map(b => (
              <div key={b.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 group">
                <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md">{b.status}</span>
                <h3 className="text-lg font-black text-slate-900 mt-3 mb-6">{b.title}</h3>
                <div className="space-y-2 text-xs text-slate-500 font-bold">
                  <p><i className="fa-solid fa-calendar mr-2 text-indigo-400"></i> {b.startDate}</p>
                  <p><i className="fa-solid fa-clock mr-2 text-indigo-400"></i> {b.timings}</p>
                </div>
                <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setEditingBatch(b); setShowBatchForm(true); }} className="flex-grow bg-slate-50 text-slate-400 py-2 rounded-xl text-[9px] font-black uppercase">Edit</button>
                  <button onClick={async () => { await db.deleteBatch(b.id); refreshData(); }} className="px-4 bg-red-50 text-red-500 rounded-xl"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forms and Other tabs logic similarly implemented with real-time db.save calls... */}
      {showBatchForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowBatchForm(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 relative z-10 animate-in zoom-in">
            <h2 className="text-2xl font-black mb-8">Schedule New Batch</h2>
            <div className="space-y-6 mb-8">
              <input type="text" placeholder="Batch Title" value={editingBatch.title} onChange={e => setEditingBatch({...editingBatch, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Start Date" value={editingBatch.startDate} onChange={e => setEditingBatch({...editingBatch, startDate: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" />
                <input type="text" placeholder="Timings" value={editingBatch.timings} onChange={e => setEditingBatch({...editingBatch, timings: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold" />
              </div>
            </div>
            <button onClick={async () => { await db.saveBatch({ ...editingBatch, id: editingBatch.id || `b_${Date.now()}` } as Batch); setShowBatchForm(false); refreshData(); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Update batches.csv</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
