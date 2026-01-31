
import { User, PlatformSettings, Course } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v2'; // Bumped version for fresh state
const SETTINGS_KEY = 'shamanth_academy_settings_v1';
const COURSES_KEY = 'shamanth_academy_courses_v1';

// This URL is injected during build. If not set, app runs in local mode.
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

/**
 * cloudFetch handles all API communication. 
 * It is designed to NEVER throw a fetch error to the UI.
 */
async function cloudFetch(action: string, body: any = {}) {
  if (!isCloudConnected()) return null;
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
      signal: controller.signal
    });
    
    clearTimeout(id);

    // Specific Conflict check for registration
    if (response.status === 409) {
      const err: any = new Error('User exists');
      err.status = 409;
      throw err;
    }

    if (!response.ok) return null;
    return await response.json();
  } catch (error: any) {
    // If it's an intentional 'User Exists' error, pass it through
    if (error.status === 409) throw error;
    
    // Otherwise, log and return null to trigger local fallback
    console.warn(`⚠️ Network unreachable for action: ${action}. Falling back to Local Storage.`);
    return null; 
  }
}

// --- COURSE CATALOG ---
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
  await cloudFetch('saveCourse', { course });
  const courses = await getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index !== -1) courses[index] = course; else courses.push(course);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await cloudFetch('deleteCourse', { courseId });
  const courses = await getCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== courseId)));
};

// --- SETTINGS ---
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
  await cloudFetch('saveSettings', { settings });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// --- USERS & AUTH ---
export const getStoredUsers = async (): Promise<User[]> => {
  const cloudData = await cloudFetch('getAllUsers');
  if (cloudData && Array.isArray(cloudData)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
    return cloudData;
  }
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Initial check of current memory/local state
  const currentUsers = await getStoredUsers();
  if (currentUsers.some(u => u.email === cleanEmail)) {
    console.log("Local check: User already exists.");
    return null;
  }

  // 2. Try Cloud
  try {
    const cloudUser = await cloudFetch('register', { email: cleanEmail, pin });
    if (cloudUser) {
      localStorage.removeItem(USERS_KEY); // Invalidate cache
      return cloudUser;
    }
  } catch (err: any) {
    if (err.status === 409) return null; // Email taken in cloud
  }
  
  // 3. Final Local Persistence (Double check again)
  const users = await getStoredUsers();
  if (users.find(u => u.email === cleanEmail)) return null;
  
  const newUser: User = {
    id: `u_${Date.now()}`,
    email: cleanEmail,
    pin,
    role: 'USER',
    enrolledCourses: [],
    pendingUnlocks: [],
    enrollmentDates: {},
    lastActive: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
};

export const loginUser = async (email: string, pin: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();

  // Admin Master Override
  if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && pin.trim() === ADMIN_CREDENTIALS.pin) {
    return {
      id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin,
      role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [], lastActive: new Date().toISOString()
    };
  }

  // Cloud Login
  const cloudUser = await cloudFetch('login', { email: cleanEmail, pin });
  if (cloudUser) return cloudUser;

  // Local Login
  const users = await getStoredUsers();
  return users.find(u => u.email === cleanEmail && u.pin === pin) || null;
};

export const deleteUser = async (userId: string): Promise<void> => {
  // FORCE Local Delete First to prevent "Already Exists" ghosting
  const users = await getStoredUsers();
  const updated = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));

  // Then attempt cloud delete in background
  await cloudFetch('deleteUser', { userId });
};

export const requestUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (await cloudFetch('requestUnlock', { userId, courseId })) return;
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...u.pendingUnlocks, courseId])], lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const approveUnlock = async (userId: string, courseId: string): Promise<void> => {
  if (await cloudFetch('approveUnlock', { userId, courseId })) return;
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId), enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])], enrollmentDates: { ...(u.enrollmentDates || {}), [courseId]: new Date().toISOString() }, lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const lockCourse = async (userId: string, courseId: string): Promise<void> => {
  if (await cloudFetch('lockCourse', { userId, courseId })) return;
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
