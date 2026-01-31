
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
    if (settingsData && settingsData.categories.length > 0 && !newCourse.category) {
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

  const handleSaveCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
      alert("Please fill in course title and description.");
      return;
    }

    let finalCategory = newCourse.category;

    // Handle new category creation
    if (isAddingNewCategory && newCategoryInput.trim()) {
      finalCategory = newCategoryInput.trim();
      if (settings && !settings.categories.includes(finalCategory)) {
        const updatedSettings = {
          ...settings,
          categories: [...settings.categories, finalCategory]
        };
        await db.savePlatformSettings(updatedSettings);
        setSettings(updatedSettings);
      }
    }

    if (!finalCategory) {
      alert("Please select or add a category.");
      return;
    }

    const courseToSave: Course = {
      ...newCourse as Course,
      category: finalCategory,
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
      flashNews: [...settings.flashNews, newNewsItem.trim()]
    });
    setNewNewsItem('');
  };

  const removeNewsItem = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      flashNews: settings.flashNews.filter((_, i) => i !== index)
    });
  };

  const pendingRequests = users.flatMap(user => 
    user.pendingUnlocks.map(courseId => ({
      userId: user.id,
      userEmail: user.email,
      courseId,
      courseTitle: courses.find(c => c.id === courseId)?.title || 'Unknown Course'
    }))
  );

  const enrollmentReport = useMemo(() => {
    const report: any[] = [];
    users.forEach(user => {
      user.enrolledCourses.forEach(courseId => {
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
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 mt-8 px-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-100">Management Dashboard</span>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-red-100">
                {pendingRequests.length} NEW PAYMENTS
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Academic Control</h1>
          <p className="text-slate-500 font-medium mt-1">Manage enrollments, curriculum, and gateway settings.</p>
        </div>
        
        <nav className="flex bg-white p-1.5 rounded-[1.5rem] shadow-xl shadow-indigo-100/30 border border-slate-100 flex-wrap">
          {[
            { id: 'pending', label: 'Unlocks', icon: 'fa-unlock', count: pendingRequests.length },
            { id: 'reports', label: 'Reports', icon: 'fa-chart-pie' },
            { id: 'courses', label: 'Courses', icon: 'fa-book' },
            { id: 'seekers', label: 'Students', icon: 'fa-users' },
            { id: 'settings', label: 'Settings', icon: 'fa-sliders' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
              {tab.count ? <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[8px]">{tab.count}</span> : null}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'courses' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum Catalog</h2>
            <button 
              onClick={() => {
                setNewCourse({
                  title: '',
                  description: '',
                  instructor: 'Shamanth S.',
                  category: settings?.categories[0] || '',
                  price: 4999,
                  isFree: false,
                  thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
                  videos: [{ id: 'v1', title: 'Introduction', url: '', duration: '10:00' }]
                });
                setShowCourseForm(true);
              }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-all"
            >
              <i className="fa-solid fa-plus"></i> Add New Course
            </button>
          </div>

          {showCourseForm && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl space-y-8 animate-in zoom-in duration-300">
               <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                 <h3 className="font-black text-xl text-slate-900">{newCourse.id ? 'Modify Existing Course' : 'Configure New Course'}</h3>
                 <button onClick={() => setShowCourseForm(false)} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course Title</label>
                    <input type="text" placeholder="e.g. Mastering Next.js" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                      <button 
                        onClick={() => setIsAddingNewCategory(!isAddingNewCategory)} 
                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                      >
                        {isAddingNewCategory ? 'Select Existing' : '+ Add New Category'}
                      </button>
                    </div>
                    {isAddingNewCategory ? (
                      <input 
                        type="text" 
                        placeholder="Type new category name..." 
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner"
                      />
                    ) : (
                      <select 
                        value={newCourse.category} 
                        onChange={e => setNewCourse({...newCourse, category: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner"
                      >
                        {settings?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                    <textarea rows={3} placeholder="Briefly describe the learning outcome..." value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner"></textarea>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price (INR)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        value={newCourse.price} 
                        onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value)})} 
                        disabled={newCourse.isFree}
                        className={`flex-grow p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner ${newCourse.isFree ? 'opacity-50 grayscale' : ''}`} 
                      />
                      <button 
                        onClick={() => setNewCourse({...newCourse, isFree: !newCourse.isFree})}
                        className={`px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${newCourse.isFree ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {newCourse.isFree ? 'Free Course' : 'Set as Paid'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thumbnail Image URL</label>
                    <input type="text" value={newCourse.thumbnail} onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600 shadow-inner" />
                  </div>
               </div>

               <div className="space-y-4 pt-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Curriculum Builder (YouTube Links)</label>
                    <button onClick={addVideoField} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                      <i className="fa-solid fa-plus mr-2"></i> Add Module
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {newCourse.videos?.map((vid, idx) => (
                      <div key={vid.id || idx} className="flex gap-4 items-end bg-slate-50/50 p-6 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">{idx + 1}</span>
                            <input type="text" placeholder="Module Title" value={vid.title} onChange={e => updateVideoField(idx, 'title', e.target.value)} className="flex-grow bg-transparent border-b border-slate-200 p-1 outline-none font-bold text-slate-800 focus:border-indigo-500" />
                          </div>
                          <div className="relative">
                            <i className="fa-brands fa-youtube absolute left-2 top-1/2 -translate-y-1/2 text-red-500"></i>
                            <input type="text" placeholder="YouTube Video URL" value={vid.url} onChange={e => updateVideoField(idx, 'url', e.target.value)} className="w-full bg-white/50 border border-slate-200 pl-8 pr-4 py-2 rounded-xl outline-none font-medium text-indigo-600 text-[11px] focus:ring-2 focus:ring-indigo-500/10" />
                          </div>
                        </div>
                        <div className="w-20">
                           <input type="text" placeholder="12:00" value={vid.duration} onChange={e => updateVideoField(idx, 'duration', e.target.value)} className="w-full bg-white/50 border border-slate-200 p-2 rounded-xl outline-none font-bold text-slate-400 text-[11px] text-center" />
                        </div>
                        <button onClick={() => setNewCourse({...newCourse, videos: newCourse.videos?.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-50">
                 <button 
                  onClick={handleSaveCourse} 
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.99]"
                 >
                   {newCourse.id ? 'Save Changes' : 'Publish to Academy'}
                 </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl group hover:shadow-2xl transition-all">
                 <div className="aspect-video relative overflow-hidden">
                    <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-xs text-indigo-600 shadow-xl border border-white/20">
                      {course.isFree ? 'FREE' : `₹${course.price}`}
                    </div>
                 </div>
                 <div className="p-8">
                    <h3 className="font-black text-slate-900 text-lg mb-2 truncate leading-tight">{course.title}</h3>
                    <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{course.category}</span>
                      <span>•</span>
                      <span>{course.videos.length} Modules</span>
                    </div>
                    <div className="flex gap-3">
                       <button 
                        onClick={() => {setNewCourse(course); setShowCourseForm(true); window.scrollTo({top: 0, behavior: 'smooth'});}} 
                        className="flex-grow py-3.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
                       >
                         Manage
                       </button>
                       <button onClick={() => handleDeleteCourse(course.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100/50"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 border border-slate-100 overflow-hidden">
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Course</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingRequests.map((req, idx) => (
                    <tr key={`${req.userId}-${req.courseId}`} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{req.userEmail}</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">ID: {req.userId}</div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-black text-[11px]">
                          <i className="fa-solid fa-graduation-cap"></i>
                          {req.courseTitle}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button 
                          disabled={isLoading}
                          onClick={() => handleApprove(req.userId, req.courseId)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-xl shadow-emerald-500/20 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                        >
                          {isLoading ? 'Verifying...' : 'Approve & Unlock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-32 text-center">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-clipboard-check text-4xl text-slate-200"></i>
               </div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Queue is Empty</h3>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4 flex-grow w-full">
              <i className="fa-solid fa-filter text-slate-300 ml-2"></i>
              <input 
                type="text" 
                placeholder="Search report..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="flex-grow bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/20 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Curriculum</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unlock Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {enrollmentReport.map((entry, idx) => (
                    <tr key={`${entry.userId}-${entry.courseId}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900">{entry.email}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs font-black text-indigo-600">{entry.courseTitle}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-[10px] font-bold text-slate-400">{entry.unlockedAt}</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleLock(entry.userId, entry.courseId)}
                          className="text-red-500 hover:bg-red-500 hover:text-white border border-red-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seekers' && (
        <div className="space-y-8">
           <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex items-center gap-4">
              <i className="fa-solid fa-magnifying-glass text-slate-300 ml-2"></i>
              <input 
                type="text" 
                placeholder="Find student by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300"
              />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl group">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">{user.email.charAt(0).toUpperCase()}</div>
                      <div>
                         <h3 className="font-black text-slate-900 truncate max-w-[150px] leading-tight">{user.email}</h3>
                         <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{user.role}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4">
          {/* General & Gateway */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-3">
              <i className="fa-solid fa-gear text-indigo-600"></i> Platform Config
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant UPI ID</label>
                <input 
                  type="text" 
                  value={settings.upiId}
                  onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Academy Contact</label>
                <input 
                  type="text" 
                  value={settings.contactNumber}
                  onChange={(e) => setSettings({...settings, contactNumber: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">QR Payment Artifact</label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                  {settings.paymentQrCode ? (
                    <div className="relative group">
                      <img src={settings.paymentQrCode} className="w-40 h-40 object-contain rounded-2xl shadow-lg bg-white p-2" alt="QR" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-2">
                         <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center"><i className="fa-solid fa-pencil text-xs"></i></button>
                         <button onClick={() => setSettings({...settings, paymentQrCode: null})} className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()} className="w-40 h-40 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-100 transition-all">
                      <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                      <span className="text-[10px] font-black uppercase">Upload QR</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                </div>
              </div>
            </div>

            <button 
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all"
            >
              {isSaving ? 'Processing...' : 'Apply Config'}
            </button>
          </div>

          {/* Flash News Management */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
             <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <i className="fa-solid fa-bolt text-amber-500"></i> Manage Flash News
            </h2>
            
            <div className="space-y-6">
               <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="Add latest news alert..."
                    value={newNewsItem}
                    onChange={(e) => setNewNewsItem(e.target.value)}
                    className="flex-grow p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-600"
                  />
                  <button 
                    onClick={addNewsItem}
                    className="bg-indigo-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100"
                  >
                    Add
                  </button>
               </div>

               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {settings.flashNews.map((news, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                      <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                      <p className="flex-grow text-[11px] font-bold text-slate-600 leading-tight">{news}</p>
                      <button 
                        onClick={() => removeNewsItem(idx)}
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                  {settings.flashNews.length === 0 && (
                    <p className="text-center text-slate-400 py-10 font-bold italic text-sm">No news alerts configured.</p>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
