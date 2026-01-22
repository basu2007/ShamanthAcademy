
import React, { useState, useEffect } from 'react';
import { User, Course } from '../types';
import * as db from '../services/db';
import { MOCK_COURSES } from '../constants';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'seekers' | 'insights'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [grantingForUser, setGrantingForUser] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Auto-refresh user list every 10s
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    const data = await db.getStoredUsers();
    setUsers(data);
  };

  const handleApprove = async (userId: string, courseId: string) => {
    await db.approveUnlock(userId, courseId);
    await refreshData();
  };

  const handleLock = async (userId: string, courseId: string) => {
    if (window.confirm('Revoke access to this course?')) {
      await db.lockCourse(userId, courseId);
      await refreshData();
    }
  };

  const handleGrantAccess = async (userId: string, courseId: string) => {
    await db.approveUnlock(userId, courseId);
    setGrantingForUser(null);
    await refreshData();
  };

  const pendingRequests = users.flatMap(user => 
    user.pendingUnlocks.map(courseId => ({
      userId: user.id,
      userEmail: user.email,
      courseId,
      courseTitle: MOCK_COURSES.find(c => c.id === courseId)?.title || 'Unknown Course'
    }))
  );

  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-indigo-600 font-black tracking-widest uppercase text-xs mb-2 block">Central Command</span>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Dharma Registry</h1>
          <p className="text-gray-500 font-medium mt-2">Monitoring seeker progress and knowledge gates.</p>
        </div>
        
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Requests {pendingRequests.length > 0 && <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{pendingRequests.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('seekers')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider ${
              activeTab === 'seekers' ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Seeker Cards
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider ${
              activeTab === 'insights' ? 'bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Live Insights
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-indigo-50 border border-gray-100 overflow-hidden">
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Seeker</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Course Requested</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingRequests.map((req, idx) => (
                    <tr key={`${req.userId}-${req.courseId}-${idx}`} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-gray-900">{req.userEmail}</div>
                        <div className="text-[10px] text-indigo-400 font-black tracking-widest uppercase mt-0.5">ID: {req.userId}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-indigo-700">{req.courseTitle}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleApprove(req.userId, req.courseId)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-green-100 transition-all transform active:scale-95"
                        >
                          Approve Unlock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-32 text-center">
               <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
                  <i className="fa-solid fa-bell-slash text-3xl text-gray-200"></i>
               </div>
               <h3 className="text-2xl font-black text-gray-900">Quiet Ashram</h3>
               <p className="text-gray-500 max-w-xs mx-auto mt-2">No pending course unlock requests at this time.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'seekers' && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-50 hover:shadow-indigo-100 transition-all group relative overflow-hidden">
                {user.role === 'ADMIN' && <div className="absolute top-0 right-0 p-4 opacity-5"><i className="fa-solid fa-shield-halved text-6xl"></i></div>}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xl shadow-inner border border-indigo-100">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 leading-tight truncate max-w-[150px]">{user.email}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest mt-1 inline-block ${
                        user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <button 
                      onClick={() => setGrantingForUser(grantingForUser === user.id ? null : user.id)}
                      className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                    >
                      <i className={`fa-solid ${grantingForUser === user.id ? 'fa-xmark' : 'fa-plus'}`}></i>
                    </button>
                  )}
                </div>
                
                {grantingForUser === user.id && (
                  <div className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in zoom-in duration-300">
                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Grant Access Manually</div>
                    <div className="space-y-2">
                      {MOCK_COURSES.filter(c => !user.enrolledCourses.includes(c.id)).map(course => (
                        <button
                          key={course.id}
                          onClick={() => handleGrantAccess(user.id, course.id)}
                          className="w-full text-left px-4 py-3 bg-white rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex justify-between items-center group/btn"
                        >
                          {course.title}
                          <i className="fa-solid fa-arrow-right opacity-0 group-hover/btn:opacity-100"></i>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Unlocked ({user.enrolledCourses.length})</span>
                    <span className="text-indigo-400">Seen: {formatLastSeen(user.lastActive)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.enrolledCourses.length > 0 ? (
                      user.enrolledCourses.map(id => {
                        const course = MOCK_COURSES.find(c => c.id === id);
                        return (
                          <div key={id} className="group/tag flex items-center gap-2 text-[10px] bg-green-50 text-green-700 border border-green-100 pl-2.5 pr-1.5 py-1.5 rounded-lg font-black transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-100">
                            {course?.title || 'Unknown'}
                            {user.role !== 'ADMIN' && (
                              <button onClick={() => handleLock(user.id, id)} className="w-4 h-4 rounded bg-green-200/50 hover:bg-red-600 hover:text-white flex items-center justify-center">
                                <i className="fa-solid fa-lock text-[7px]"></i>
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center w-full bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 text-[10px] text-gray-400 font-bold">No premium content.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-50 border border-gray-100 overflow-hidden">
          <div className="p-10 border-b border-gray-50 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black text-gray-900">Live Activity Monitor</h3>
                <p className="text-sm text-gray-500 font-medium">Tracking seeker presence in the digital ashram.</p>
             </div>
             <div className="flex gap-10">
                <div className="text-center">
                   <div className="text-2xl font-black text-indigo-600">{users.length}</div>
                   <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Seekers</div>
                </div>
                <div className="text-center">
                   <div className="text-2xl font-black text-green-500">
                      {users.filter(u => u.lastActive && (new Date().getTime() - new Date(u.lastActive).getTime() < 300000)).length}
                   </div>
                   <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active (5m)</div>
                </div>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Seeker Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Active</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Knowledge Depth</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.sort((a,b) => new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime()).map(user => {
                  const isOnline = user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime() < 600000);
                  return (
                    <tr key={user.id} className="hover:bg-indigo-50/20 transition-all">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full shadow-lg ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-200'}`}></div>
                          <div>
                            <div className="font-bold text-gray-900">{user.email}</div>
                            <div className="text-[10px] text-gray-400 font-medium">Session ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-bold text-gray-600">{formatLastSeen(user.lastActive)}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full transition-all duration-1000" 
                                style={{ width: `${Math.min((user.enrolledCourses.length / MOCK_COURSES.length) * 100, 100)}%` }}
                              ></div>
                           </div>
                           <span className="text-xs font-black text-indigo-700">{user.enrolledCourses.length} paths</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                           user.role === 'ADMIN' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                         }`}>
                           {user.role}
                         </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
