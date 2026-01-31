
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Course, PlatformSettings, Video } from '../types';
import * as db from '../services/db';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'seekers' | 'reports' | 'courses' | 'settings'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Course Form State
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    instructor: 'Shamanth S.',
    category: '',
    price: 4999,
    isFree: false,
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    videos: [{ id: 'v1', title: 'Introduction', url: '', duration: '10:00' }]
  });

  // News State
  const [newNewsItem, setNewNewsItem] = useState('');

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    const userData = await db.getStoredUsers();
    const settingsData = await db.getPlatformSettings();
    const courseData = await db.getCourses();
    setUsers(userData);
    setSettings(settingsData);
    setCourses(courseData);
    
    // Set first category as default if none selected
    if (settingsData && settingsData.categories?.length > 0 && !newCourse.category) {
      setNewCourse(prev => ({ ...prev, category: settingsData.categories[0] }));
    }
  };

  const handleApprove = async (userId: string, courseId: string) => {
    setIsLoading(true);
    await db.approveUnlock(userId, courseId);
    await refreshData();
    setIsLoading(false);
  };

  const handleLock = async (userId: string, courseId: string) => {
    if (window.confirm('Rollback Access: Are you sure you want to revoke this student\'s access to the course?')) {
      await db.lockCourse(userId, courseId);
      await refreshData();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'admin') {
      alert("Root administrator cannot be deleted.");
      return;
    }
    if (window.confirm('PERMANENT ACTION: Are you sure you want to delete this student record from the academy database?')) {
      setIsLoading(true);
      await db.deleteUser(userId);
      await refreshData();
      setIsLoading(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      alert("Please fill in course title and description.");
      return;
    }

    let finalCategory = newCourse.category;

    // Handle new category creation
    if (isAddingNewCategory && newCategoryInput.trim()) {
      finalCategory = newCategoryInput.trim();
      if (settings && !settings.categories?.includes(finalCategory)) {
        const updatedSettings = {
          ...settings,
          categories: [...(settings.categories || []), finalCategory]
        };
        await db.savePlatformSettings(updatedSettings);
        setSettings(updatedSettings);
      }
    }

    if (!finalCategory && !settings?.categories?.length) {
       alert("No categories available. Please add a new category first.");
       return;
    }

    const courseToSave: Course = {
      ...newCourse as Course,
      category: finalCategory || settings?.categories?.[0] || 'Uncategorized',
      id: newCourse.id || Math.random().toString(36).substr(2, 9),
      price: Number(newCourse.price) || 0
    };

    await db.saveCourse(courseToSave);
    setShowCourseForm(false);
    setIsAddingNewCategory(false);
    setNewCategoryInput('');
    refreshData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course from the catalog?')) {
      await db.deleteCourse(id);
      refreshData();
    }
  };

  const addVideoField = () => {
    const nextId = `v${Date.now()}`;
    setNewCourse({
      ...newCourse,
      videos: [...(newCourse.videos || []), { id: nextId, title: '', url: '', duration: '10:00' }]
    });
  };

  const updateVideoField = (index: number, field: keyof Video, value: string) => {
    const updatedVideos = [...(newCourse.videos || [])];
    updatedVideos[index] = { ...updatedVideos[index], [field]: value };
    setNewCourse({ ...newCourse, videos: updatedVideos });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && settings) {
      if (file.size > 800 * 1024) { 
        alert("Image is too large. Please use a compressed image below 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, paymentQrCode: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (settings) {
      setIsSaving(true);
      try {
        await db.savePlatformSettings(settings);
        const fresh = await db.getPlatformSettings();
        setSettings(fresh);
        alert('Global configuration saved successfully!');
      } catch (err) {
        console.error("Save failure", err);
        alert('Failed to save settings.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const addNewsItem = () => {
    if (!newNewsItem.trim() || !settings) return;
    setSettings({
      ...settings,
      flashNews: [...(settings.flashNews || []), newNewsItem.trim()]
    });
    setNewNewsItem('');
  };

  const removeNewsItem = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      flashNews: (settings.flashNews || []).filter((_, i) => i !== index)
    });
  };

  const pendingRequests = users.flatMap(user => 
    (user.pendingUnlocks || []).map(courseId => ({
      userId: user.id,
      userEmail: user.email,
      courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown Course'
    }))
  );

  const enrollmentReport = useMemo(() => {
    const report: any[] = [];
    users.forEach(user => {
      (user.enrolledCourses || []).forEach(courseId => {
        const course = courses.find(c => c.id === courseId);
        report.push({
          userId: user.id,
          email: user.email,
          courseId,
          courseTitle: course?.title || 'Unknown Course',
          unlockedAt: user.enrollmentDates?.[courseId] || 'System Default/Free'
        });
      });
    });
    return report.filter(r => 
      r.email.toLowerCase().includes(reportSearch.toLowerCase()) || 
      r.courseTitle.toLowerCase().includes(reportSearch.toLowerCase())
    ).sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
  }, [users, courses, reportSearch]);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 mt-4 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">Academy Control</span>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {pendingRequests.length} ALERTS
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
        </div>
        
        <nav className="flex bg-white p-1 rounded-2xl shadow-lg border border-slate-100 flex-wrap">
          {[
            { id: 'pending', label: 'Unlocks', icon: 'fa-unlock' },
            { id: 'reports', label: 'Reports', icon: 'fa-chart-pie' },
            { id: 'courses', label: 'Catalog', icon: 'fa-book' },
            { id: 'seekers', label: 'Students', icon: 'fa-users' },
            { id: 'settings', label: 'Settings', icon: 'fa-sliders' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'courses' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Curriculum</h2>
            <button 
              onClick={() => {
                setNewCourse({
                  title: '',
                  description: '',
                  instructor: 'Shamanth S.',
                  category: settings?.categories?.[0] || '',
                  price: 4999,
                  isFree: false,
                  thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
                  videos: [{ id: 'v1', title: 'Introduction', url: '', duration: '10:00' }]
                });
                setShowCourseForm(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1 shadow-md hover:bg-indigo-700 transition-all"
            >
              <i className="fa-solid fa-plus"></i> New Course
            </button>
          </div>

          {showCourseForm && (
            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl space-y-6 animate-in zoom-in duration-200">
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <h3 className="font-black text-lg text-slate-900">Course Builder</h3>
                 <button onClick={() => setShowCourseForm(false)} className="text-slate-400 hover:text-red-500"><i className="fa-solid fa-xmark"></i></button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400">Title</label>
                    <input type="text" placeholder="e.g. Mastering Next.js" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase text-slate-400">Category</label>
                      <button onClick={() => setIsAddingNewCategory(!isAddingNewCategory)} className="text-[8px] font-black text-indigo-600 uppercase">Edit</button>
                    </div>
                    {isAddingNewCategory ? (
                      <input type="text" placeholder="Category name..." value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs outline-none" />
                    ) : (
                      <select value={newCourse.category} onChange={e => setNewCourse({...newCourse, category: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none">
                        {settings?.categories?.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-slate-400">Description</label>
                    <textarea rows={2} value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400">Pricing (INR)</label>
                    <input type="number" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400">Thumbnail URL</label>
                    <input type="text" value={newCourse.thumbnail} onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none" />
                  </div>
               </div>

               <button onClick={handleSaveCourse} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg transition-all">Publish Content</button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md group">
                 <div className="aspect-video relative overflow-hidden">
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-lg font-black text-[9px] text-indigo-600 shadow">
                      {course.isFree ? 'FREE' : `₹${course.price}`}
                    </div>
                 </div>
                 <div className="p-5">
                    <h3 className="font-black text-slate-900 text-sm mb-1 truncate">{course.title}</h3>
                    <div className="flex gap-2 mb-4">
                       <button onClick={() => {setNewCourse(course); setShowCourseForm(true);}} className="flex-grow py-2 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600">Edit</button>
                       <button onClick={() => handleDeleteCourse(course.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><i className="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'seekers' && (
        <div className="space-y-6">
           <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex items-center gap-3">
              <i className="fa-solid fa-magnifying-glass text-slate-300"></i>
              <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-grow bg-transparent outline-none font-bold text-xs" />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                <div key={user.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs">{user.email.charAt(0).toUpperCase()}</div>
                      <div>
                         <h3 className="font-black text-slate-900 text-xs truncate max-w-[120px]">{user.email}</h3>
                         <span className="text-[8px] font-black uppercase text-indigo-400">{user.role}</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                   >
                     <i className="fa-solid fa-trash-can text-xs"></i>
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Course</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingRequests.map((req) => (
                    <tr key={`${req.userId}-${req.courseId}`} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-xs">{req.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-indigo-600">{req.courseTitle}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleApprove(req.userId, req.courseId)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase shadow-sm">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
               <i className="fa-solid fa-check-double text-3xl text-slate-100 mb-4"></i>
               <h3 className="text-sm font-black text-slate-300 uppercase">All clear</h3>
            </div>
          )}
        </div>
      )}

      {/* Other tabs follow same minimized pattern */}
      {activeTab === 'settings' && settings && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
            <h2 className="font-black text-slate-900 flex items-center gap-2">Config</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">UPI ID</label>
                <input type="text" value={settings.upiId} onChange={(e) => setSettings({...settings, upiId: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400">Phone</label>
                <input type="text" value={settings.contactNumber} onChange={(e) => setSettings({...settings, contactNumber: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl font-bold text-xs" />
              </div>
            </div>
            <button onClick={saveSettings} disabled={isSaving} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[9px] uppercase shadow-md">{isSaving ? '...' : 'Save Settings'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
