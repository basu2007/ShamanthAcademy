
import { User, PlatformSettings, Course, Batch } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v3'; 
const SETTINGS_KEY = 'shamanth_academy_settings_v2';
const COURSES_KEY = 'shamanth_academy_courses_v2';
const BATCHES_KEY = 'shamanth_academy_batches_v1';

const DEFAULT_SETTINGS: PlatformSettings = {
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science'],
  flashNews: [
    'Welcome to Shamanth Academy. CSV Database active.',
    'New Batch for Java Full Stack Development starting soon.',
    'Manage your data via the Admin CSV Engine.'
  ]
};

// --- DATA ACCESSORS ---

export const getStoredUsers = async (): Promise<User[]> => {
  const local = localStorage.getItem(USERS_KEY);
  try { return local ? JSON.parse(local) : []; } catch (e) { return []; }
};

export const getCourses = async (): Promise<Course[]> => {
  const local = localStorage.getItem(COURSES_KEY);
  return local ? JSON.parse(local) : MOCK_COURSES;
};

export const getBatches = async (): Promise<Batch[]> => {
  const local = localStorage.getItem(BATCHES_KEY);
  return local ? JSON.parse(local) : [];
};

export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const local = localStorage.getItem(SETTINGS_KEY);
  return local ? { ...DEFAULT_SETTINGS, ...JSON.parse(local) } : DEFAULT_SETTINGS;
};

// --- CSV BULK INJECTION ---

export const bulkOverwriteUsers = async (users: User[]): Promise<void> => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const bulkOverwriteCourses = async (courses: Course[]): Promise<void> => {
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const bulkOverwriteBatches = async (batches: Batch[]): Promise<void> => {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
};

// --- TRANSACTIONAL ACTIONS ---

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  const cleanEmail = email.trim().toLowerCase();
  const currentUsers = await getStoredUsers();
  if (currentUsers.some(u => u.email === cleanEmail)) return null;

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

  const users = await getStoredUsers();
  return users.find(u => u.email === cleanEmail && u.pin === cleanPin) || null;
};

export const saveCourse = async (course: Course): Promise<void> => {
  const courses = await getCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index !== -1) courses[index] = course; else courses.push(course);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
};

export const saveBatch = async (batch: Batch): Promise<void> => {
  const batches = await getBatches();
  const index = batches.findIndex(b => b.id === batch.id);
  if (index !== -1) batches[index] = batch; else batches.push(batch);
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
};

export const deleteBatch = async (batchId: string): Promise<void> => {
  const batches = await getBatches();
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches.filter(b => b.id !== batchId)));
};

export const deleteUser = async (userId: string): Promise<void> => {
  const users = await getStoredUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify(users.filter(u => u.id !== userId)));
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const courses = await getCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== courseId)));
};

export const savePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const requestUnlock = async (userId: string, courseId: string): Promise<void> => {
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...(u.pendingUnlocks || []), courseId])], lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const approveUnlock = async (userId: string, courseId: string): Promise<void> => {
  const users = await getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId), enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])], enrollmentDates: { ...(u.enrollmentDates || {}), [courseId]: new Date().toISOString() }, lastActive: new Date().toISOString() } : u);
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
};

export const lockCourse = async (userId: string, courseId: string): Promise<void> => {
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
