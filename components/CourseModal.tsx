
import React, { useState, useEffect } from 'react';
import { Course, User, Video, PlatformSettings } from '../types';
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
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  
  const [aiRoadmap, setAiRoadmap] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsSettingsLoading(true);
      try {
        const data = await db.getPlatformSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings in modal", err);
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleRequestUnlock = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    await db.requestUnlock(user.id, course.id);
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

  const renderVideoPlayer = () => {
    if (!activeVideo) return <div className="flex items-center justify-center h-full text-gray-500 font-bold">No Media Found</div>;

    const isYouTube = activeVideo.url.includes('youtube.com') || activeVideo.url.includes('youtu.be');

    if (isYouTube) {
      let videoId = '';
      if (activeVideo.url.includes('v=')) {
        videoId = activeVideo.url.split('v=')[1].split('&')[0];
      } else if (activeVideo.url.includes('youtu.be/')) {
        videoId = activeVideo.url.split('youtu.be/')[1].split('?')[0];
      } else if (activeVideo.url.includes('embed/')) {
        videoId = activeVideo.url.split('embed/')[1].split('?')[0];
      }

      return (
        <iframe 
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
          className="w-full h-full" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      );
    }

    return (
      <video key={activeVideo.id} src={activeVideo.url} controls className="w-full h-full" autoPlay />
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/30 backdrop-blur-md transition-colors flex items-center justify-center border border-white/20"
          title="Close Modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Player Section */}
        <div className="md:w-2/3 bg-slate-950 flex flex-col justify-center min-h-[400px] relative">
          {isUnlocked ? (
            <div className="w-full aspect-video bg-black">
              {renderVideoPlayer()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-white h-full bg-gradient-to-b from-indigo-950 to-slate-950 overflow-y-auto">
              {showScanner ? (
                <div className="text-center space-y-6 w-full max-w-sm animate-in slide-in-from-bottom-4 relative py-12">
                  <button 
                    onClick={() => setShowScanner(false)} 
                    className="absolute -top-4 -right-4 md:-right-8 w-12 h-12 bg-white/5 hover:bg-white/20 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
                    title="Cancel Payment"
                  >
                    <i className="fa-solid fa-chevron-left text-sm mr-1"></i>
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl inline-block relative min-w-[240px] w-full">
                    {isSettingsLoading ? (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-indigo-900 gap-3 mx-auto">
                        <i className="fa-solid fa-circle-notch animate-spin text-3xl"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Verifying Gateway...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full aspect-square bg-slate-50 rounded-3xl flex items-center justify-center relative overflow-hidden border border-slate-100">
                          {settings?.paymentQrCode ? (
                            <img src={settings.paymentQrCode} className="w-full h-full object-contain animate-in fade-in duration-700 p-2" alt="Payment QR" />
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <i className="fa-solid fa-qrcode text-indigo-900 text-[10rem] opacity-5 absolute"></i>
                              <div className="relative z-10 grid grid-cols-4 gap-3 p-6">
                                {Array.from({length: 16}).map((_, i) => (
                                  <div key={i} className={`w-8 h-8 rounded-md ${Math.random() > 0.4 ? 'bg-indigo-900' : 'bg-slate-200'}`}></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 text-indigo-950 font-black text-2xl tracking-tight italic">Scan to Pay ₹{course.price}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 mb-2">Merchant: {settings?.upiId || 'shamanth@okaxis'}</div>
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleRequestUnlock}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                        I Have Paid - Notify Admin
                      </button>
                      <button 
                        onClick={() => setShowScanner(false)} 
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all"
                      >
                        <i className="fa-solid fa-arrow-left mr-2"></i>
                        Cancel & Go Back
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-sm">
                  <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-indigo-500/20 shadow-inner">
                    <i className="fa-solid fa-lock text-4xl text-amber-400"></i>
                  </div>
                  <h3 className="text-4xl font-black mb-3 tracking-tighter">Premium Content</h3>
                  <p className="text-indigo-200/60 mb-10 font-medium leading-relaxed">
                    Unlock this full curriculum for <span className="text-white font-black">₹{course.price}</span>.
                  </p>
                  {isPending ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[2.5rem] text-amber-200 flex items-center gap-6 text-left animate-pulse shadow-2xl">
                      <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        <i className="fa-solid fa-hourglass-half"></i>
                      </div>
                      <div>
                        <div className="font-black text-xs uppercase tracking-widest">Verification Pending</div>
                        <div className="text-[10px] font-medium opacity-70 mt-1 italic leading-tight">Access will be granted once admin verifies payment.</div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="w-full bg-white text-indigo-950 py-5 rounded-[1.5rem] font-black shadow-2xl transition-all hover:-translate-y-1 active:scale-95 text-lg"
                    >
                      Unlock Full Access
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Playlist & Details */}
        <div className="md:w-1/3 flex flex-col h-full bg-white border-l border-slate-100">
          <div className="p-8 border-b border-slate-50">
            <h2 className="font-black text-xl text-slate-900 leading-tight mb-2">{course.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{course.instructor}</span>
              <span className="text-[10px] text-slate-300">•</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{course.videos.length} Modules</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-3 bg-slate-50/30">
            {aiRoadmap ? (
              <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden animate-in slide-in-from-right">
                <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-sparkles text-4xl"></i></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-300">AI Learning Strategy</h4>
                <div className="text-xs leading-relaxed font-medium space-y-3 whitespace-pre-wrap">{aiRoadmap}</div>
                <button onClick={() => setAiRoadmap(null)} className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase border border-white/10 transition-all">Show Playlist</button>
              </div>
            ) : (
              course.videos.map((vid, idx) => (
                <button
                  key={vid.id}
                  disabled={!isUnlocked}
                  onClick={() => setActiveVideo(vid)}
                  className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 border transition-all ${
                    !isUnlocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-white hover:shadow-lg'
                  } ${activeVideo?.id === vid.id ? 'bg-white border-indigo-200 shadow-xl ring-2 ring-indigo-50' : 'bg-transparent border-transparent'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${activeVideo?.id === vid.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {isUnlocked ? (activeVideo?.id === vid.id ? <i className="fa-solid fa-play text-[10px] animate-pulse"></i> : idx + 1) : <i className="fa-solid fa-lock text-[10px]"></i>}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className={`text-xs font-bold truncate ${activeVideo?.id === vid.id ? 'text-indigo-900' : 'text-slate-700'}`}>{vid.title}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase mt-0.5">{vid.duration}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-8 bg-white border-t border-slate-50">
            <button 
              onClick={handleGetAiRoadmap} 
              disabled={isAiLoading}
              className="w-full bg-slate-900 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAiLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <><i className="fa-solid fa-sparkles text-amber-400"></i> Get AI Roadmap</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
