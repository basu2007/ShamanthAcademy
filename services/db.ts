
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
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Cloud Sync Error (${action}):`, error);
    return null;
  }
}

export const getCourses = async (): Promise<Course[]> => {
  if (isCloudConnected()) {
    const cloudCourses = await cloudFetch('getCourses');
    if (cloudCourses && Array.isArray(cloudCourses)) {
      localStorage.setItem(COURSES_KEY, JSON.stringify(cloudCourses));
      return cloudCourses;
    }
  }
  const local = localStorage.getItem(COURSES_KEY);
  if (!local) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(MOCK_COURSES));
    return MOCK_COURSES;
  }
  return JSON.parse(local);
};

export const saveCourse = async (course: Course): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('saveCourse', { course });
  const courses = await getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index !== -1) courses[index] = course;
  else courses.push(course);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('deleteCourse', { courseId });
  const courses = await getCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== courseId)));
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  let localSettings: Partial<PlatformSettings> | null = null;
  const local = localStorage.getItem(SETTINGS_KEY);
  if (local) try { localSettings = JSON.parse(local); } catch (e) {}
  const mergedSettings: PlatformSettings = { ...DEFAULT_SETTINGS, ...localSettings };
  if (isCloudConnected()) {
    const cloudData = await cloudFetch('getSettings');
    if (cloudData && typeof cloudData === 'object' && cloudData.upiId) {
      const finalSettings = { ...mergedSettings, ...cloudData };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings));
      return finalSettings;
    }
  }
  return mergedSettings;
};

export const savePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  if (isCloudConnected()) await cloudFetch('saveSettings', { settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getStoredUsers = async (): Promise<User[]> => {
  if (isCloudConnected()) {
    const cloudData = await cloudFetch('getAllUsers');
    if (cloudData && Array.isArray(cloudData)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
      return cloudData;
    }
  }
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const admin: User = {
      id: 'admin',
      email: ADMIN_CREDENTIALS.email,
      pin: ADMIN_CREDENTIALS.pin,
      role: 'ADMIN',
      enrolledCourses: [],
      pendingUnlocks: [],
      lastActive: new Date().toISOString()
    };
    const initial = [admin];
    localStorage.setItem(USERS_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(users);
};

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  if (isCloudConnected()) return await cloudFetch('register', { email, pin });
  const users = await getStoredUsers();
  if (users.find(u => u.email === email)) return null;
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    email, pin, role: 'USER', enrolledCourses: [], pendingUnlocks: [], enrollmentDates: {}, lastActive: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const loginUser = async (email: string, pin: string): Promise<User | null> => {
  // Master Admin Check - Explicitly check static credentials first
  if (email.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && pin.trim() === ADMIN_CREDENTIALS.pin) {
    return {
      id: 'admin',
      email: ADMIN_CREDENTIALS.email,
      pin: ADMIN_CREDENTIALS.pin,
      role: 'ADMIN',
      enrolledCourses: [],
      pendingUnlocks: [],
      lastActive: new Date().toISOString()
    };
  }

  if (isCloudConnected()) return await cloudFetch('login', { email, pin });
  const users = await getStoredUsers();
  const user = users.find(u => u.email === email && u.pin === pin);
  if (user) {
    user.lastActive = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return user;
  }
  return null;
};

export const deleteUser = async (userId: string): Promise<void> => {
  if (isCloudConnected()) {
    await cloudFetch('deleteUser', { userId });
  }
  const users = await getStoredUsers();
  const updated = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
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
