
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  pin: string;
  role: UserRole;
  enrolledCourses: string[]; 
  pendingUnlocks: string[]; 
  enrollmentDates?: Record<string, string>; 
  lastActive?: string; 
}

export interface PlatformSettings {
  paymentQrCode: string | null;
  upiId: string;
  contactNumber: string;
  flashNews: string[];
  categories: string[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  category: string;
  price: number;
  isFree: boolean;
  videos: Video[];
  youtubeChannel?: string;
}

export interface Batch {
  id: string;
  courseId: string;
  title: string;
  startDate: string;
  timings: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  status: 'Registration Open' | 'Starting Soon' | 'Ongoing' | 'Completed';
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};
