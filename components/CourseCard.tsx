import React from 'react';
import { Course, User } from '../types';

interface CourseCardProps {
  course: Course;
  user: User | null;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, user, onClick }) => {
  const isUnlocked = course.isFree || (user && user.enrolledCourses.includes(course.id)) || user?.role === 'ADMIN';
  const isPending = user?.pendingUnlocks.includes(course.id);

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
           <span className="text-white text-xs font-bold flex items-center gap-2">
             <i className="fa-solid fa-circle-play text-amber-400"></i> Click to preview
           </span>
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isUnlocked ? (
            <span className="bg-emerald-500/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400/50">
              <i className="fa-solid fa-check-circle mr-1"></i> Enrolled
            </span>
          ) : isPending ? (
            <span className="bg-blue-500/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-blue-400/50 animate-pulse">
              <i className="fa-solid fa-clock mr-1"></i> Pending
            </span>
          ) : (
            <span className="bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg border border-amber-400/50">
              <i className="fa-solid fa-lock mr-1"></i> Premium
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {course.category}
          </span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">
            {course.videos.length} Modules
          </span>
        </div>
        
        <h3 className="font-black text-xl text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium">
          {course.description}
        </p>
        
        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-700 text-xs font-black">
              {course.instructor.charAt(0)}
            </div>
            <span className="text-xs font-bold text-gray-700">{course.instructor}</span>
          </div>
          <div className="text-right">
            {course.isFree ? (
              <span className="text-emerald-600 font-black text-lg tracking-tighter italic">FREE</span>
            ) : (
              <span className="text-indigo-900 font-black text-lg tracking-tighter">₹{course.price}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;