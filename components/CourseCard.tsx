
import React from 'react';
import { Course, User } from '../types';

interface CourseCardProps {
  course: Course;
  user: User | null;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, user, onClick }) => {
  const isUnlocked = course.isFree || (user && user.enrolledCourses.includes(course.id)) || user?.role === 'ADMIN';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          {isUnlocked ? (
            <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <i className="fa-solid fa-play"></i> Enrolled
            </span>
          ) : (
            <span className="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <i className="fa-solid fa-lock"></i> Locked
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {course.category}
          </span>
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <i className="fa-solid fa-clock"></i> {course.videos.length} Videos
          </span>
        </div>
        <h3 className="font-bold text-lg text-gray-800 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">
          {course.description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-medium">Instructor</span>
            <span className="text-sm font-semibold text-gray-700">{course.instructor}</span>
          </div>
          <div className="text-right">
            {course.isFree ? (
              <span className="text-green-600 font-bold text-lg">FREE</span>
            ) : (
              <span className="text-blue-700 font-bold text-lg">${course.price}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
