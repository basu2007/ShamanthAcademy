
import { User, PlatformSettings, Course } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v1';
const SETTINGS_KEY = 'shamanth_academy_settings_v1';
const COURSES_KEY = 'shamanth_academy_courses_v1';

const REMOTE_API_URL = "INSERT_AWS_API_URL_HERE";

const DEFAULT_SETTINGS: PlatformSettings = {
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science'],
  flashNews: [
    'New Batch for Java Full Stack Development starting from July 25th, 2024.',
    'React 19 & Next.js 15 Masterclass is now live!',
    'AWS Certified Solutions Architect (SAA-C03) Batch open.'
  ]
};

const isCloudConnected = () => {
  return REMOTE_API_URL && 
         !REMOTE_API_URL.includes("INSERT_AWS") && 
         REMOTE_API_URL.startsWith("http");
};

async function cloudFetch(action: string, body: any = {}) {
  if (!isCloudConnected()) return null;
  try {
    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    });
    
    const data = await response.json();
    if (!response.ok) {
      // Create a specialized error object
      const err: any = new Error(data.error || 'Server error');
      err.status = response.status;
      throw err;
    }
    return data;
  } catch (error: any) {
    console.error(`❌ Cloud Sync Error (${action}):`, error);
    throw error; // Rethrow to let the caller handle UI messaging
  }
}

// Course Catalog Logic
export const getCourses = async (): Promise<Course[]> => {
  if (isCloudConnected()) {
    try {
      const cloudCourses = await cloudFetch('getCourses');
      if (cloudCourses && Array.isArray(cloudCourses)) {
        localStorage.setItem(COURSES_KEY, JSON.stringify(cloudCourses));
        return cloudCourses;
      }
    } catch (e) {}
  }
  const local = localStorage.getItem(COURSES_KEY);
  return local ? JSON.parse(local) : MOCK_COURSES;
};

export const saveCourse = async (course: Course): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('saveCourse', { course });
  const courses = await getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index !== -1) courses[index] = course; else courses.push(course);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('deleteCourse', { courseId });
  const courses = await getCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== courseId)));
};

// Settings Logic
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  if (isCloudConnected()) {
    try {
      const cloudData = await cloudFetch('getSettings');
      if (cloudData && typeof cloudData === 'object' && cloudData.upiId) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudData));
        return { ...DEFAULT_SETTINGS, ...cloudData };
      }
    } catch (e) {}
  }
  const local = localStorage.getItem(SETTINGS_KEY);
  return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
};

export const savePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('saveSettings', { settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// User Logic
export const getStoredUsers = async (): Promise<User[]> => {
  if (isCloudConnected()) {
    try {
      const cloudData = await cloudFetch('getAllUsers');
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (e) {}
  }
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  if (isCloudConnected()) {
    try {
      const user = await cloudFetch('register', { email, pin });
      // Invalidate local cache to force a refresh on next read
      localStorage.removeItem(USERS_KEY);
      return user;
    } catch (err: any) {
      if (err.status === 409) return null; // Signal that user exists
      throw err;
    }
  }
  
  const users = await getStoredUsers();
  if (users.find(u => u.email === email)) return null;
  const newUser: User = {
    id: Date.now().toString(), email, pin, role: 'USER', enrolledCourses: [], pendingUnlocks: [], enrollmentDates: {}, lastActive: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const loginUser = async (email: string, pin: string): Promise<User | null> => {
  // 1. MASTER ADMIN CHECK (Always works, bypasses cloud if needed)
  if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && pin.trim() === ADMIN_CREDENTIALS.pin) {
    return {
      id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin,
      role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [], lastActive: new Date().toISOString()
    };
  }

  // 2. CLOUD LOGIN
  if (isCloudConnected()) {
    try {
      return await cloudFetch('login', { email, pin });
    } catch (e) {
      // Fallback only if server is unreachable
    }
  }

  // 3. LOCAL FALLBACK
  const users = await getStoredUsers();
  return users.find(u => u.email === email && u.pin === pin) || null;
};

export const deleteUser = async (userId: string): Promise<void> => {
  if (isCloudConnected()) {
    await cloudFetch('deleteUser', { userId });
  }
  const users = await getStoredUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify(users.filter(u => u.id !== userId)));
};

export const requestUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudConnected()) { await cloudFetch('requestUnlock', { userId, courseId }); return; }
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...u.pendingUnlocks, courseId])], lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const approveUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudConnected()) { await cloudFetch('approveUnlock', { userId, courseId }); return; }
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: u.pendingUnlocks.filter(id => id !== courseId), enrolledCourses: [...new Set([...u.enrolledCourses, courseId])], enrollmentDates: { ...u.enrollmentDates, [courseId]: new Date().toISOString() }, lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const lockCourse = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudConnected()) { await cloudFetch('lockCourse', { userId, courseId }); return; }
  const users = await getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const dates = { ...u.enrollmentDates }; delete dates[courseId];
      return { ...u, enrolledCourses: u.enrolledCourses.filter(id => id !== courseId), enrollmentDates: dates, lastActive: new Date().toISOString() };
    }
    return u;
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};
