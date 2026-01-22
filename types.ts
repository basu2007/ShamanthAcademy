
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  pin: string;
  role: UserRole;
  enrolledCourses: string[]; // IDs of unlocked courses
  pendingUnlocks: string[]; // IDs of courses where payment is scanned
  lastActive?: string; // ISO Timestamp
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
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};
