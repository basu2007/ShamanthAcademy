
import React, { useState } from 'react';
import { Course, User, Video } from '../types';
import * as db from '../services/db';

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

  const handleRequestUnlock = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    db.requestUnlock(user.id, course.id);
    setShowScanner(false);
    onRefreshUser();
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
        <div className="md:w-2/3 bg-black flex flex-col justify-center min-h-[300px]">
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
                    {/* Simulated QR Code */}
                    <div className="w-48 h-48 bg-gray-800 flex items-center justify-center text-white relative overflow-hidden rounded">
                       <i className="fa-solid fa-qrcode text-8xl opacity-20 absolute"></i>
                       <div className="relative z-10 flex flex-col items-center">
                          <span className="font-mono text-xs">PAYMENT_ID: {course.id}</span>
                          <div className="grid grid-cols-4 gap-1 p-2">
                             {Array.from({length: 16}).map((_,i) => (
                               <div key={i} className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                    Once you make the payment of <span className="text-white font-bold">${course.price}</span>, click the button below. Admin will verify and unlock the course for you.
                  </p>
                  <button 
                    onClick={handleRequestUnlock}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg"
                  >
                    I Have Paid - Notify Admin
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-white/20">
                    <i className="fa-solid fa-lock text-3xl text-amber-400"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                  <p className="text-gray-400 mb-8 max-w-sm">
                    Unlock all {course.videos.length} videos in "{course.title}" for a one-time payment of <span className="text-white font-bold">${course.price}</span>.
                  </p>
                  {isPending ? (
                    <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 p-4 rounded-xl flex items-center gap-3">
                      <i className="fa-solid fa-circle-info text-xl"></i>
                      <div className="text-left">
                        <div className="font-bold">Unlock Request Pending</div>
                        <div className="text-xs">Admin is verifying your payment. Please wait.</div>
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

        {/* Playlist Section */}
        <div className="md:w-1/3 flex flex-col h-full bg-white">
          <div className="p-6 border-b">
            <h2 className="font-bold text-xl mb-1 line-clamp-2">{course.title}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
               <span className="font-semibold text-blue-600">{course.instructor}</span>
               <span>•</span>
               <span>{course.videos.length} Lessons</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            <div className="space-y-3">
              {course.videos.map((vid, idx) => {
                const isActive = activeVideo?.id === vid.id;
                return (
                  <button
                    key={vid.id}
                    disabled={!isUnlocked}
                    onClick={() => setActiveVideo(vid)}
                    className={`w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all border ${
                      !isUnlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-200'
                    } ${isActive ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-gray-50 border-transparent'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isUnlocked ? (
                         isActive ? <i className="fa-solid fa-volume-high animate-pulse"></i> : <span className="font-bold">{idx + 1}</span>
                      ) : (
                         <i className="fa-solid fa-lock text-sm"></i>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                        {vid.title}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">{vid.duration}</div>
                    </div>
                    {isUnlocked && isActive && <i className="fa-solid fa-circle-play text-blue-600"></i>}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-6 bg-gray-50 border-t">
            <div className="text-sm font-semibold text-gray-700 mb-2">About this course</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {course.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
