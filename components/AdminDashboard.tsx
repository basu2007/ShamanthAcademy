
import React, { useState, useEffect } from 'react';
import { User, Course, Batch, PlatformSettings, Video } from '../types';
import * as db from '../services/db';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'seekers' | 'batches' | 'courses' | 'settings'>('pending');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Forms
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<Batch>>({});
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({ videos: [] });
  const [isEditMode, setIsEditMode] = useState(false);

  // Module addition state
  const [newVideo, setNewVideo] = useState<Partial<Video>>({ title: '', url: '', duration: '10:00' });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const startup = async () => {
      await db.initDatabase();
      await refreshData();
      setIsInitializing(false);
    };
    startup();
  }, []);

  const refreshData = async () => {
    const [u, c, b, s] = await Promise.all([
      db.getStoredUsers(), db.getCourses(), db.getBatches(), db.getPlatformSettings()
    ]);
    setUsers(u); setCourses(c); setBatches(b); setSettings(s);
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

  const addVideoModule = () => {
    if (!newVideo.title || !newVideo.url) return;
    const videoObj: Video = {
      id: `v_${Date.now()}`,
      title: newVideo.title,
      url: newVideo.url,
      duration: newVideo.duration || '10:00'
    };
    setEditingCourse(prev => ({
      ...prev,
      videos: [...(prev.videos || []), videoObj]
    }));
    setNewVideo({ title: '', url: '', duration: '10:00' });
  };

  const removeVideoModule = (id: string) => {
    setEditingCourse(prev => ({
      ...prev,
      videos: (prev.videos || []).filter(v => v.id !== id)
    }));
  };

  const handleSaveCourse = async () => {
    if (!editingCourse.title) {
        alert("Course Title is mandatory");
        return;
    }
    
    const finalPrice = editingCourse.price !== undefined ? Number(editingCourse.price) : 0;
    
    const courseToSave: Course = {
      id: editingCourse.id || `c_${Date.now()}`,
      title: editingCourse.title,
      description: editingCourse.description || 'Expert training module at Shamanth Academy.',
      instructor: editingCourse.instructor || 'Shamanth Academy Team',
      category: editingCourse.category || 'General',
      thumbnail: editingCourse.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
      price: finalPrice,
      isFree: finalPrice === 0,
      videos: editingCourse.videos || [],
      youtubeChannel: editingCourse.youtubeChannel || ''
    };
    
    await db.saveCourse(courseToSave);
    setShowCourseForm(false);
    refreshData();
  };

  const openCourseEdit = (course: Course) => {
    setEditingCourse({ ...course });
    setIsEditMode(true);
    setShowCourseForm(true);
  };

  const openCourseCreate = () => {
    setEditingCourse({ videos: [], price: 4999, category: settings?.categories[0] || 'General' });
    setIsEditMode(false);
    setShowCourseForm(true);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !settings) return;
    if (settings.categories.includes(newCategory.trim())) {
      alert("Category already exists.");
      return;
    }
    const updated = { ...settings, categories: [...settings.categories, newCategory.trim()] };
    setSettings(updated);
    await db.saveSettings(updated);
    setNewCategory('');
  };

  const handleRemoveCategory = async (cat: string) => {
    if (!settings || !window.confirm(`Delete category "${cat}"? Courses in this category will still exist but will be filtered under "All".`)) return;
    const updated = { ...settings, categories: settings.categories.filter(c => c !== cat) };
    setSettings(updated);
    await db.saveSettings(updated);
  };

  const exportCourses = () => {
    const csv = db.toCSV(courses);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses_backup.csv';
    a.click();
  };

  const handleImportCourses = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const data = db.fromCSV(text);
      if (data.length > 0) {
        if (confirm(`Import ${data.length} courses? This will merge with existing ones.`)) {
          for (const c of data) {
            await db.saveCourse(c as Course);
          }
          refreshData();
        }
      }
    };
    reader.readAsText(file);
  };

  const pendingRequests = users.flatMap(user => 
    (user.pendingUnlocks || []).map(courseId => ({
      userId: user.id, userEmail: user.email, courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown'
    }))
  );

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-indigo-600 animate-pulse">
        <i className="fa-solid fa-folder-tree text-6xl mb-4"></i>
        <h2 className="text-xl font-black uppercase tracking-widest">Waking Database...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Command Center</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {db.isCloudEnabled() ? '✅ Cloud Sync Active' : 'Application Private Folder Synchronized'}
          </p>
        </div>
        
        <nav className="flex bg-white p-1 rounded-2xl shadow-xl border border-slate-100 flex-wrap">
          {[
            { id: 'pending', label: 'Unlock Requests', icon: 'fa-clock' },
            { id: 'seekers', label: 'Student Base', icon: 'fa-users' },
            { id: 'batches', label: 'Training Batch', icon: 'fa-calendar-days' },
            { id: 'courses', label: 'Curriculum', icon: 'fa-book' },
            { id: 'settings', label: 'Settings', icon: 'fa-gear' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
            >
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
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr><th className="p-8">Student Contact</th><th className="p-8">Desired Module</th><th className="p-8 text-right">Verification</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingRequests.map((req, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 font-bold text-slate-900">{req.userEmail}</td>
                    <td className="p-8"><span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black">{req.courseTitle}</span></td>
                    <td className="p-8 text-right">
                      <button onClick={async () => { await db.approveUnlock(req.userId, req.courseId); refreshData(); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all">Approve Access</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-32 text-center text-slate-300"><i className="fa-solid fa-circle-check text-6xl mb-4"></i><p className="font-black uppercase text-xs tracking-widest">Queue Clear</p></div>}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <i className="fa-solid fa-qrcode text-indigo-600"></i>
                  Payment QR Gateway
                </h3>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${db.isCloudEnabled() ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {db.isCloudEnabled() ? 'Cloud Linked' : 'Local Mode'}
                </div>
              </div>
              <div className="flex flex-col items-center gap-6">
                <div className="w-64 h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-inner">
                  {settings?.paymentQrCode ? <img src={settings.paymentQrCode} className="w-full h-full object-contain" /> : <i className="fa-solid fa-camera text-6xl text-slate-200"></i>}
                </div>
                <input type="file" id="qr-upload" hidden accept="image/*" onChange={handleQrUpload} />
                <label htmlFor="qr-upload" className="cursor-pointer bg-slate-900 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl">
                  Upload New QR Code
                </label>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <i className="fa-solid fa-file-export text-indigo-600"></i>
                Data Portability
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">Sync your data manually if Cloud is not active.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={exportCourses} className="flex-1 bg-white border border-indigo-600 text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all">Export CSV</button>
                <label className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                  Import CSV
                  <input type="file" hidden accept=".csv" onChange={handleImportCourses} />
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8 flex flex-col">
            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <i className="fa-solid fa-building text-indigo-600"></i>
                Merchant Details
                </h3>
                <div className="space-y-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business UPI ID</label><input type="text" value={settings?.upiId} onChange={async (e) => { if(!settings) return; const s = {...settings, upiId: e.target.value}; setSettings(s); await db.saveSettings(s); }} className="w-full mt-1 p-4 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Contact</label><input type="text" value={settings?.contactNumber} onChange={async (e) => { if(!settings) return; const s = {...settings, contactNumber: e.target.value}; setSettings(s); await db.saveSettings(s); }} className="w-full mt-1 p-4 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20" /></div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <i className="fa-solid fa-tags text-indigo-600"></i>
                Manage Categories
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="e.g. Navodaya" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                            className="flex-grow p-4 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500/20 text-sm"
                        />
                        <button 
                            onClick={handleAddCategory}
                            className="bg-indigo-600 text-white px-6 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                        {settings?.categories.map(cat => (
                            <div key={cat} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-3 shadow-sm group">
                                <span className="text-xs font-bold text-slate-600">{cat}</span>
                                <button 
                                    onClick={() => handleRemoveCategory(cat)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <i className="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Training Schedules</h2>
            <button onClick={() => { setEditingBatch({ status: 'Registration Open', mode: 'Online' }); setShowBatchForm(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Add New Schedule</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map(b => (
              <div key={b.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 group hover:border-indigo-100 transition-all">
                <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md">{b.status}</span>
                <h3 className="text-lg font-black text-slate-900 mt-3 mb-6 leading-tight">{b.title}</h3>
                <div className="space-y-2 text-xs text-slate-500 font-bold">
                  <p><i className="fa-solid fa-calendar mr-2 text-indigo-400"></i> {b.startDate}</p>
                  <p><i className="fa-solid fa-clock mr-2 text-indigo-400"></i> {b.timings}</p>
                </div>
                <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setEditingBatch(b); setShowBatchForm(true); }} className="flex-grow bg-slate-50 text-slate-400 py-2.5 rounded-xl text-[9px] font-black uppercase">Edit</button>
                  <button onClick={async () => { await db.deleteBatch(b.id); refreshData(); }} className="px-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-8 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Master Curriculum</h2>
            <button onClick={openCourseCreate} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Push Course</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courses.map(c => (
              <div key={c.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-md group">
                <img src={c.thumbnail} className="w-full h-32 object-cover" />
                <div className="p-5">
                   <h3 className="font-black text-slate-900 text-sm mb-4 truncate">{c.title}</h3>
                   <div className="flex gap-2">
                     <button onClick={() => openCourseEdit(c)} className="flex-grow bg-slate-50 text-slate-400 py-2 rounded-xl text-[9px] font-black uppercase">Modify</button>
                     <button onClick={async () => { await db.deleteCourse(c.id); refreshData(); }} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"><i className="fa-solid fa-trash"></i></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'seekers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {users.map(u => (
            <div key={u.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="font-black text-slate-900 mb-1">{u.email}</h4>
                <div className="flex flex-wrap gap-2 mt-4">
                  {u.enrolledCourses?.length > 0 ? u.enrolledCourses.map(cid => (
                    <span key={cid} className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-md border border-emerald-100">
                      {courses.find(c => c.id === cid)?.title || 'Course Access'}
                    </span>
                  )) : <span className="text-[9px] text-slate-300 font-bold uppercase">No Module Access</span>}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <span>Memory Student</span>
                <i className="fa-solid fa-user-graduate text-indigo-100 text-lg"></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowCourseForm(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-10 relative z-10 animate-in zoom-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{isEditMode ? 'Update Existing Course' : 'Push New Course'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {db.isCloudEnabled() ? 'Syncing with DynamoDB' : 'Syncing with courses.csv'}
                </p>
              </div>
              <button onClick={() => setShowCourseForm(false)} className="text-slate-300 hover:text-red-500"><i className="fa-solid fa-circle-xmark text-2xl"></i></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Title</label>
                <input type="text" placeholder="e.g. React Mastery" value={editingCourse.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Instructor</label>
                <input type="text" placeholder="e.g. Shamanth" value={editingCourse.instructor || ''} onChange={e => setEditingCourse({...editingCourse, instructor: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Price (INR)</label>
                <input type="number" placeholder="4999" value={editingCourse.price || 0} onChange={e => setEditingCourse({...editingCourse, price: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Category</label>
                <select value={editingCourse.category || ''} onChange={e => setEditingCourse({...editingCourse, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none">
                  {settings?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Description</label>
                <textarea placeholder="Tell students about this course..." value={editingCourse.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none h-24" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Thumbnail URL</label>
                <input type="text" placeholder="https://image-url.com" value={editingCourse.thumbnail || ''} onChange={e => setEditingCourse({...editingCourse, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Youtube Channel Path</label>
                <input type="text" placeholder="Official Channel Link/Name" value={editingCourse.youtubeChannel || ''} onChange={e => setEditingCourse({...editingCourse, youtubeChannel: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
            </div>

            {/* Video Modules Management */}
            <div className="mb-10">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Manage Video Modules ({editingCourse.videos?.length || 0})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input type="text" placeholder="Module Title" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} className="p-3 bg-white rounded-xl text-xs font-bold" />
                <input type="text" placeholder="Video URL (YouTube/MP4)" value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} className="p-3 bg-white rounded-xl text-xs font-bold" />
                <button onClick={addVideoModule} className="bg-indigo-600 text-white p-3 rounded-xl text-[10px] font-black uppercase">Add Module</button>
              </div>

              <div className="space-y-2">
                {(editingCourse.videos || []).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-300">#{i+1}</span>
                      <span className="text-xs font-bold text-slate-700">{v.title}</span>
                      <span className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{v.url}</span>
                    </div>
                    <button onClick={() => removeVideoModule(v.id)} className="text-red-300 hover:text-red-600 text-xs px-2 opacity-0 group-hover:opacity-100 transition-all"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveCourse} className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">
               {isEditMode ? 'Commit Changes' : 'Publish to Academy'}
            </button>
          </div>
        </div>
      )}

      {/* Batch Form Modal */}
      {showBatchForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowBatchForm(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 relative z-10 animate-in zoom-in">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-black text-slate-900">Schedule Batch</h2>
              <button onClick={() => setShowBatchForm(false)} className="text-slate-300 hover:text-red-500 transition-all"><i className="fa-solid fa-circle-xmark text-2xl"></i></button>
            </div>
            <div className="space-y-4 mb-8">
              <input type="text" placeholder="Batch Title" value={editingBatch.title} onChange={e => setEditingBatch({...editingBatch, title: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Start Date" value={editingBatch.startDate} onChange={e => setEditingBatch({...editingBatch, startDate: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
                <input type="text" placeholder="Timings" value={editingBatch.timings} onChange={e => setEditingBatch({...editingBatch, timings: e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
            </div>
            <button onClick={async () => { await db.saveBatch({ ...editingBatch, id: editingBatch.id || `b_${Date.now()}` } as Batch); setShowBatchForm(false); refreshData(); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm Schedule</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
