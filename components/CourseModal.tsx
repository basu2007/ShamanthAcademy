import React, { useState } from 'react';
import { Course, User, Video } from '../types';
import * as db from '../services/db';
import { generateCourseRoadmap } from '../services/ai';

interface CourseModalProps {
  course: Course;
  user: User | null;
  onClose: () => void;
  onAuthRequired: () => void;
  onRefreshUser: () => void;
}

const CourseModal: React.FC<CourseModalProps> = ({ course, user, onClose, onAuthRequired, onRefreshUser }) => {
  const isUnlocked = course.isFree || (user && user.enrolledCourses.includes(course.id)) || user?.role === 'ADMIN';
  const isPending = user?.pendingUnlocks.includes(course.id);
  const [activeVideo, setActiveVideo] = useState<Video | null>(course.videos[0] || null);
  const [showScanner, setShowScanner] = useState(false);
  
  // AI State
  const [aiRoadmap, setAiRoadmap] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleRequestUnlock = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    db.requestUnlock(user.id, course.id);
    setShowScanner(false);
    onRefreshUser();
  };

  const handleGetAiRoadmap = async () => {
    setIsAiLoading(true);
    try {
      const roadmap = await generateCourseRoadmap(course.title, course.description);
      setAiRoadmap(roadmap);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 text-white hover:bg-black/50 transition-colors flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        {/* Video Player Section */}
        <div className="md:w-2/3 bg-black flex flex-col justify-center min-h-[300px] relative">
          {isUnlocked ? (
            activeVideo ? (
              <div className="w-full aspect-video">
                <video 
                  key={activeVideo.id}
                  src={activeVideo.url} 
                  controls 
                  className="w-full h-full"
                  autoPlay
                />
              </div>
            ) : (
              <div className="text-white text-center p-8">No videos in this course yet.</div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-white h-full">
              {showScanner ? (
                <div className="text-center animate-in slide-in-from-bottom duration-500">
                  <h3 className="text-2xl font-bold mb-4">Scan QR to Unlock Course</h3>
                  <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-2xl">
                    <div className="w-48 h-48 bg-gray-800 flex items-center justify-center text-white relative overflow-hidden rounded">
                       <i className="fa-solid fa-qrcode text-8xl opacity-20 absolute"></i>
                       <div className="relative z-10 flex flex-col items-center">
                          <span className="font-mono text-[10px]">PAYMENT_ID: {course.id}</span>
                          <div className="grid grid-cols-4 gap-1 p-2">
                             {Array.from({length: 16}).map((_,i) => (
                               <div key={i} className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mb-6 max-w-xs mx-auto">
                    Payment: <span className="text-white font-bold">${course.price}</span>. Admin will verify and unlock the course.
                  </p>
                  <button 
                    onClick={handleRequestUnlock}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg text-sm"
                  >
                    I Have Paid - Notify Admin
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-white/20">
                    <i className="fa-solid fa-lock text-2xl text-amber-400"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                  <p className="text-gray-400 mb-8 max-w-sm text-sm">
                    Unlock all {course.videos.length} videos in this course for a one-time payment of <span className="text-white font-bold">${course.price}</span>.
                  </p>
                  {isPending ? (
                    <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 p-4 rounded-xl flex items-center gap-3">
                      <i className="fa-solid fa-circle-info text-xl"></i>
                      <div className="text-left">
                        <div className="font-bold text-sm">Request Pending</div>
                        <div className="text-[10px]">Admin is verifying your payment.</div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full font-bold transition-all shadow-xl shadow-blue-900/40"
                    >
                      Unlock Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Playlist & AI Section */}
        <div className="md:w-1/3 flex flex-col h-full bg-white">
          <div className="p-6 border-b flex justify-between items-start gap-4">
            <div>
              <h2 className="font-black text-lg mb-1 line-clamp-2 leading-tight">{course.title}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                 <span className="text-indigo-600 uppercase tracking-wider">{course.instructor}</span>
                 <span>•</span>
                 <span>{course.videos.length} Lessons</span>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
            {aiRoadmap ? (
              <div className="animate-in slide-in-from-right duration-500">
                <div className="bg-indigo-700 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden mb-4">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fa-solid fa-sparkles text-4xl"></i>
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-4 text-indigo-200">AI Learning Strategy</h4>
                  <div className="text-xs leading-relaxed space-y-3 whitespace-pre-wrap font-medium">
                    {aiRoadmap}
                  </div>
                  <button 
                    onClick={() => setAiRoadmap(null)}
                    className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    View Lessons
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {course.videos.map((vid, idx) => {
                  const isActive = activeVideo?.id === vid.id;
                  return (
                    <button
                      key={vid.id}
                      disabled={!isUnlocked}
                      onClick={() => setActiveVideo(vid)}
                      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                        !isUnlocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white hover:shadow-md hover:border-indigo-100'
                      } ${isActive ? 'bg-white border-indigo-200 shadow-lg ring-1 ring-indigo-100' : 'bg-white/50 border-transparent'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isUnlocked ? (
                           isActive ? <i className="fa-solid fa-volume-high text-xs animate-pulse"></i> : <span className="text-xs font-black">{idx + 1}</span>
                        ) : (
                           <i className="fa-solid fa-lock text-[10px]"></i>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className={`text-xs font-bold truncate ${isActive ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {vid.title}
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{vid.duration}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="p-6 bg-white border-t space-y-4">
            {!aiRoadmap && (
              <button 
                onClick={handleGetAiRoadmap}
                disabled={isAiLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                ) : (
                  <>
                    <i className="fa-solid fa-sparkles text-amber-400"></i>
                    Get AI Roadmap
                  </>
                )}
              </button>
            )}
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              {course.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;