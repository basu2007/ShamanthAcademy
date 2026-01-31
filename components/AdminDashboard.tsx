
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Course, PlatformSettings } from '../types';
import * as db from '../services/db';
import { MOCK_COURSES } from '../constants';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'seekers' | 'reports' | 'settings'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportSearch, setReportSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    const userData = await db.getStoredUsers();
    const settingsData = await db.getPlatformSettings();
    setUsers(userData);
    setSettings(settingsData);
  };

  const handleApprove = async (userId: string, courseId: string) => {
    setIsLoading(true);
    await db.approveUnlock(userId, courseId);
    await refreshData();
    setIsLoading(false);
  };

  const handleLock = async (userId: string, courseId: string) => {
    if (window.confirm('Rollback Access: Are you sure you want to revoke this student\'s access to the course? they will need to pay again if they want it back.')) {
      await db.lockCourse(userId, courseId);
      await refreshData();
    }
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
        alert('Gateway configuration saved successfully!');
      } catch (err) {
        console.error("Save failure", err);
        alert('Failed to save settings.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const pendingRequests = users.flatMap(user => 
    user.pendingUnlocks.map(courseId => ({
      userId: user.id,
      userEmail: user.email,
      courseId,
      courseTitle: MOCK_COURSES.find(c => c.id === courseId)?.title || 'Unknown Course'
    }))
  );

  const enrollmentReport = useMemo(() => {
    const report: any[] = [];
    users.forEach(user => {
      user.enrolledCourses.forEach(courseId => {
        const course = MOCK_COURSES.find(c => c.id === courseId);
        report.push({
          userId: user.id,
          email: user.email,
          courseId,
          courseTitle: course?.title || 'Unknown Course',
          unlockedAt: user.enrollmentDates?.[courseId] || 'System Default/Free'
        });
      });
    });
    // Filter report by search
    return report.filter(r => 
      r.email.toLowerCase().includes(reportSearch.toLowerCase()) || 
      r.courseTitle.toLowerCase().includes(reportSearch.toLowerCase())
    ).sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
  }, [users, reportSearch]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.includes('Free')) return dateStr;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 mt-8">
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
          <p className="text-slate-500 font-medium mt-1">Review enrollments, revoke access, and manage platform settings.</p>
        </div>
        
        <nav className="flex bg-white p-1.5 rounded-[1.5rem] shadow-xl shadow-indigo-100/30 border border-slate-100 flex-wrap">
          {[
            { id: 'pending', label: 'Unlocks', icon: 'fa-unlock', count: pendingRequests.length },
            { id: 'reports', label: 'Reports', icon: 'fa-chart-pie' },
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
               <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">No pending student enrollment notifications found.</p>
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
                placeholder="Search report by student email or course name..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="flex-grow bg-transparent outline-none font-black text-slate-900 placeholder:text-slate-300"
              />
            </div>
            <div className="bg-indigo-50 px-6 py-3 rounded-2xl text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 shrink-0">
               <i className="fa-solid fa-chart-line"></i>
               Total Enrollments: {enrollmentReport.length}
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
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {enrollmentReport.length > 0 ? enrollmentReport.map((entry, idx) => (
                    <tr key={`${entry.userId}-${entry.courseId}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-900">{entry.email}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs font-black text-indigo-600">{entry.courseTitle}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-[10px] font-bold text-slate-400">{formatDate(entry.unlockedAt)}</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleLock(entry.userId, entry.courseId)}
                          className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Rollback Access
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">No enrollment data matching your search criteria.</td>
                    </tr>
                  )}
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
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">{user.email.charAt(0).toUpperCase()}</div>
                      <div>
                         <h3 className="font-black text-slate-900 truncate max-w-[150px] leading-tight">{user.email}</h3>
                         <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{user.role} • {user.enrolledCourses.length} Courses</span>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Current Curriculum</div>
                      <div className="flex flex-wrap gap-2">
                        {user.enrolledCourses.length > 0 ? user.enrolledCourses.map(id => (
                          <div key={id} className="bg-slate-50 text-slate-600 text-[9px] font-black px-3 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                            {MOCK_COURSES.find(c => c.id === id)?.title || 'Course'}
                            <button onClick={() => handleLock(user.id, id)} className="text-slate-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-rotate-left"></i></button>
                          </div>
                        )) : <div className="text-[10px] text-slate-400 font-bold italic">No premium access.</div>}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight flex items-center gap-3">
              <i className="fa-solid fa-gear text-indigo-600"></i> Academic Gateway
            </h2>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant UPI ID</label>
                  <input 
                    type="text" 
                    value={settings.upiId}
                    onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Academy Contact</label>
                  <input 
                    type="text" 
                    value={settings.contactNumber}
                    onChange={(e) => setSettings({...settings, contactNumber: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Payment QR Artifact</label>
                <div className="flex flex-col items-center gap-6 p-8 border-4 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                  {settings.paymentQrCode ? (
                    <div className="relative group">
                      <img src={settings.paymentQrCode} className="w-48 h-48 object-contain rounded-2xl shadow-lg bg-white p-2" alt="Payment QR" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                         <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button onClick={() => setSettings({...settings, paymentQrCode: null})} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-48 h-48 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 transition-all text-slate-400">
                      <i className="fa-solid fa-cloud-arrow-up text-3xl"></i>
                      <span className="text-[10px] font-black uppercase">Upload QR</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                  <p className="text-[11px] text-slate-400 text-center font-medium">Clear square image. Max 800KB.</p>
                </div>
              </div>

              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-5 rounded-2xl font-black shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? <><i className="fa-solid fa-circle-notch animate-spin"></i> Processing...</> : 'Apply Global Configuration'}
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Real-time Student Preview</h4>
               <div className="bg-[#1e1b4b] rounded-[3rem] p-12 text-center shadow-2xl">
                  <div className="bg-white p-6 rounded-[2rem] shadow-2xl inline-block mb-6">
                    <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                       {settings.paymentQrCode ? (
                         <img src={settings.paymentQrCode} className="w-full h-full object-contain" alt="Preview" />
                       ) : (
                         <i className="fa-solid fa-qrcode text-indigo-900 text-7xl opacity-10"></i>
                       )}
                    </div>
                    <div className="mt-4 text-indigo-900 font-black text-lg">Scan to Pay ₹4999</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Merchant: {settings.upiId}</div>
                  </div>
                  <p className="text-white/60 text-xs font-medium max-w-xs mx-auto">This simulation reflects the live gateway experience for all premium curriculum unlocks.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
