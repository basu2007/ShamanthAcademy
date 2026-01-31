
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  pin: string;
  role: UserRole;
  enrolledCourses: string[]; // IDs of unlocked courses
  pendingUnlocks: string[]; // IDs of courses where payment is scanned
  enrollmentDates?: Record<string, string>; // Maps courseId to ISO timestamp
  lastActive?: string; // ISO Timestamp
}

export interface PlatformSettings {
  paymentQrCode: string | null; // Base64 string of the QR code
  upiId: string;
  contactNumber: string;
  flashNews: string[]; // Manageable list of news strings
  categories: string[]; // Dynamically managed categories
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
