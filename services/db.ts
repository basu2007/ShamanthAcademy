import { User, PlatformSettings, Course } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v3'; 
const SETTINGS_KEY = 'shamanth_academy_settings_v2';
const COURSES_KEY = 'shamanth_academy_courses_v2';

/**
 * 💡 AWS DEPLOYMENT NOTE:
 * When deploying via Amplify, the 'amplify.yml' script automatically 
 * replaces the placeholder below with your $BACKEND_API_URL.
 */
const REMOTE_API_URL = "INSERT_AWS_API_URL_HERE";

const DEFAULT_SETTINGS: PlatformSettings = {
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science'],
  flashNews: [
    'Welcome to Shamanth Academy. Start your learning journey today!',
    'New Batch for Java Full Stack Development starting soon.',
    'AWS Certified Solutions Architect (SAA-C03) Batch open.'
  ]
};

const isCloudEnabled = () => {
  const enabled = REMOTE_API_URL && 
         REMOTE_API_URL.length > 20 &&
         !REMOTE_API_URL.includes("INSERT_AWS") && 
         REMOTE_API_URL.startsWith("http");
  
  if (enabled) {
    console.log("🌐 [System] AWS Cloud Persistence Active.");
  }
  return enabled;
};

async function cloudFetch(action: string, body: any = {}) {
  if (!isCloudEnabled()) return null;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); 

    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
      signal: controller.signal
    });
    
    clearTimeout(id);

    if (response.status === 409) {
      const err: any = new Error('Conflict');
      err.status = 409;
      throw err;
    }

    if (!response.ok) return null;
    return await response.json();
  } catch (error: any) {
    if (error.status === 409) throw error;
    console.warn(`🌐 Cloud link inactive (${action}). Operating locally.`);
    return null; 
  }
}

export const getStoredUsers = async (): Promise<User[]> => {
  const cloudData = await cloudFetch('getAllUsers');
  if (cloudData && Array.isArray(cloudData)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
    return cloudData;
  }
  const local = localStorage.getItem(USERS_KEY);
  try { return local ? JSON.parse(local) : []; } catch (e) { return []; }
};

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();
  const currentUsers = await getStoredUsers();
  if (currentUsers.some(u => u.email === cleanEmail)) return null;

  if (isCloudEnabled()) {
    try {
      const cloudUser = await cloudFetch('register', { email: cleanEmail, pin });
      if (cloudUser) {
        localStorage.removeItem(USERS_KEY);
        return cloudUser;
      }
    } catch (err: any) {
      if (err.status === 409) return null;
    }
  }
  
  const newUser: User = {
    id: `u_${Date.now()}`,
    email: cleanEmail,
    pin: pin.trim(),
    role: 'USER',
    enrolledCourses: [],
    pendingUnlocks: [],
    enrollmentDates: {},
    lastActive: new Date().toISOString()
  };
  
  const updatedUsers = [...currentUsers, newUser];
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  return newUser;
};

export const loginUser = async (email: string, pin: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPin = pin.trim();

  if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && cleanPin === ADMIN_CREDENTIALS.pin) {
    return {
      id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin,
      role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [], lastActive: new Date().toISOString()
    };
  }

  if (isCloudEnabled()) {
    const cloudUser = await cloudFetch('login', { email: cleanEmail, pin: cleanPin });
    if (cloudUser) return cloudUser;
  }

  const users = await getStoredUsers();
  return users.find(u => u.email === cleanEmail && u.pin === cleanPin) || null;
};

export const deleteUser = async (userId: string): Promise<void> => {
  const users = await getStoredUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
  if (isCloudEnabled()) await cloudFetch('deleteUser', { userId });
};

export const getCourses = async (): Promise<Course[]> => {
  const cloudCourses = await cloudFetch('getCourses');
  if (cloudCourses && Array.isArray(cloudCourses)) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(cloudCourses));
    return cloudCourses;
  }
  const local = localStorage.getItem(COURSES_KEY);
  return local ? JSON.parse(local) : MOCK_COURSES;
};

export const saveCourse = async (course: Course): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('saveCourse', { course });
  const courses = await getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index !== -1) courses[index] = course; else courses.push(course);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('deleteCourse', { courseId });
  const courses = await getCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== courseId)));
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const cloudData = await cloudFetch('getSettings');
  if (cloudData && typeof cloudData === 'object' && cloudData.upiId) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudData));
    return { ...DEFAULT_SETTINGS, ...cloudData };
  }
  const local = localStorage.getItem(SETTINGS_KEY);
  return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
};

export const savePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('saveSettings', { settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const requestUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('requestUnlock', { userId, courseId });
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...(u.pendingUnlocks || []), courseId])], lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const approveUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('approveUnlock', { userId, courseId });
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId), enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])], enrollmentDates: { ...(u.enrollmentDates || {}), [courseId]: new Date().toISOString() }, lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const lockCourse = async (userId: string, courseId: string): Promise<void> => {
  if (isCloudEnabled()) await cloudFetch('lockCourse', { userId, courseId });
  const users = await getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const dates = { ...(u.enrollmentDates || {}) }; delete dates[courseId];
      return { ...u, enrolledCourses: (u.enrolledCourses || []).filter(id => id !== courseId), enrollmentDates: dates, lastActive: new Date().toISOString() };
    }
    return u;
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};
