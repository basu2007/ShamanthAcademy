
import { User, PlatformSettings, Course, Batch } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

/**
 * SHAMANTH ACADEMY: HYBRID DATABASE ENGINE
 * Seamlessly manages data across AWS Cloud (Global Sync) and Local CSV (Offline Cache).
 */

const CLOUD_API_URL = (process.env.BACKEND_URL || '').trim();

let rootHandle: FileSystemDirectoryHandle | null = null;
let memory_users: User[] = [];
let memory_courses: Course[] = [...MOCK_COURSES];
let memory_batches: Batch[] = [];
let memory_settings: PlatformSettings = {
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science', 'Navodaya', 'RMS', 'Sainik School'],
  flashNews: ['System: Cloud Sync Framework Ready']
};

// --- CLOUD API CORE ---

const cloudFetch = async (action: string, payload: any = {}) => {
  if (!CLOUD_API_URL) return null;
  try {
    const response = await fetch(CLOUD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    if (!response.ok) throw new Error(`Cloud API Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn(`[Sync Warning] Cloud action '${action}' failed. Operating in local mode.`);
    return null;
  }
};

// --- LOCAL PERSISTENCE ---

export const toCSV = (data: any[]) => {
  if (!data || data.length === 0) return '';
  const allKeys = new Set<string>();
  data.forEach(obj => Object.keys(obj).forEach(key => allKeys.add(key)));
  const headers = Array.from(allKeys);
  const rows = data.map(obj => 
    headers.map(header => {
      const val = obj[header];
      if (val === undefined || val === null) return '""';
      const stringified = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${stringified.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
};

export const fromCSV = (csv: string): any[] => {
  const lines = csv.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const obj: any = {};
    headers.forEach((h, i) => {
      let val = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"');
      try {
        if (val && (val.startsWith('[') || val.startsWith('{'))) {
          obj[h] = JSON.parse(val);
        } else if (!isNaN(Number(val)) && val !== '' && h !== 'pin' && !val.includes('-')) {
          obj[h] = Number(val);
        } else {
          obj[h] = val;
        }
      } catch (e) { obj[h] = val; }
    });
    return obj;
  });
};

const writeToDisk = async (fileName: string, content: string) => {
  try {
    if (!rootHandle) rootHandle = await navigator.storage.getDirectory();
    const fileHandle = await rootHandle.getFileHandle(fileName, { create: true });
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) { /* Silent fail if local storage is blocked */ }
};

export const syncFile = async (name: string) => {
  if (name === 'users.csv') await writeToDisk(name, toCSV(memory_users));
  if (name === 'courses.csv') await writeToDisk(name, toCSV(memory_courses));
  if (name === 'batches.csv') await writeToDisk(name, toCSV(memory_batches));
  if (name === 'settings.csv') await writeToDisk(name, toCSV([memory_settings]));
};

// --- GLOBAL SYNC ENGINE ---

export const initDatabase = async (): Promise<boolean> => {
  let cloudSucceeded = false;

  // 1. Attempt Global Cloud Sync
  if (CLOUD_API_URL) {
    try {
      const [c, s, b, u] = await Promise.all([
        cloudFetch('getCourses'),
        cloudFetch('getSettings'),
        cloudFetch('getBatches'),
        cloudFetch('getAllUsers')
      ]);

      if (c) { memory_courses = c; cloudSucceeded = true; }
      if (s) { memory_settings = s; cloudSucceeded = true; }
      if (b) { memory_batches = b; cloudSucceeded = true; }
      if (u) { memory_users = u; cloudSucceeded = true; }
      
      // If cloud worked, update local cache
      if (cloudSucceeded) {
        await Promise.all(['users.csv', 'courses.csv', 'batches.csv', 'settings.csv'].map(syncFile));
      }
    } catch (e) {
      console.error("Cloud Initialization Error:", e);
    }
  }

  // 2. Local Fallback (if cloud fails or is offline)
  if (!cloudSucceeded) {
    try {
      rootHandle = await navigator.storage.getDirectory();
      const files = ['users.csv', 'courses.csv', 'batches.csv', 'settings.csv'];
      for (const f of files) {
        try {
          const handle = await rootHandle.getFileHandle(f);
          const file = await handle.getFile();
          const text = await file.text();
          const data = fromCSV(text);
          if (f === 'users.csv') memory_users = data;
          if (f === 'courses.csv' && data.length > 0) memory_courses = data;
          if (f === 'batches.csv') memory_batches = data;
          if (f === 'settings.csv' && data.length > 0) memory_settings = data[0];
        } catch (e) {
          await syncFile(f);
        }
      }
    } catch (err) {
      console.warn("Local storage unavailable.");
    }
  }

  return true;
};

export const getStoredUsers = async () => [...memory_users];
export const getCourses = async () => [...memory_courses];
export const getBatches = async () => [...memory_batches];
export const getPlatformSettings = async () => ({ ...memory_settings });
export const isCloudEnabled = () => !!CLOUD_API_URL;

// --- AUTHENTICATION ---

export const registerUser = async (email: string, pin: string) => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (CLOUD_API_URL) {
    const cloudUser = await cloudFetch('register', { email: cleanEmail, pin });
    if (cloudUser) {
      if (!memory_users.some(u => u.id === cloudUser.id)) memory_users.push(cloudUser);
      await syncFile('users.csv');
      return cloudUser;
    }
  }

  if (memory_users.some(u => u.email === cleanEmail)) return null;
  const newUser: User = { id: `u_${Date.now()}`, email: cleanEmail, pin, role: 'USER', enrolledCourses: [], pendingUnlocks: [] };
  memory_users.push(newUser);
  await syncFile('users.csv');
  return newUser;
};

export const loginUser = async (email: string, pin: string) => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (cleanEmail === ADMIN_CREDENTIALS.email && pin === ADMIN_CREDENTIALS.pin) {
    return { id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin, role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [] } as User;
  }

  if (CLOUD_API_URL) {
    const cloudUser = await cloudFetch('login', { email: cleanEmail, pin });
    if (cloudUser) {
      // Refresh local cache with cloud user data
      const idx = memory_users.findIndex(u => u.id === cloudUser.id);
      if (idx !== -1) memory_users[idx] = cloudUser; else memory_users.push(cloudUser);
      await syncFile('users.csv');
      return cloudUser;
    }
  }

  return memory_users.find(u => u.email === cleanEmail && u.pin === pin) || null;
};

// --- DATA MANAGEMENT ---

export const saveCourse = async (course: Course) => {
  if (CLOUD_API_URL) await cloudFetch('saveCourse', { course });
  const idx = memory_courses.findIndex(c => c.id === course.id);
  if (idx !== -1) memory_courses[idx] = { ...memory_courses[idx], ...course };
  else memory_courses.push(course);
  await syncFile('courses.csv');
};

export const deleteCourse = async (id: string) => {
  if (CLOUD_API_URL) await cloudFetch('deleteCourse', { courseId: id });
  memory_courses = memory_courses.filter(c => c.id !== id);
  await syncFile('courses.csv');
};

export const saveBatch = async (batch: Batch) => {
  if (CLOUD_API_URL) await cloudFetch('saveBatch', { batch });
  const idx = memory_batches.findIndex(b => b.id === batch.id);
  if (idx !== -1) memory_batches[idx] = { ...memory_batches[idx], ...batch }; 
  else memory_batches.push(batch);
  await syncFile('batches.csv');
};

export const deleteBatch = async (id: string) => {
  if (CLOUD_API_URL) await cloudFetch('deleteBatch', { batchId: id });
  memory_batches = memory_batches.filter(b => b.id !== id);
  await syncFile('batches.csv');
};

export const saveSettings = async (s: PlatformSettings) => {
  if (CLOUD_API_URL) await cloudFetch('saveSettings', { settings: s });
  memory_settings = s;
  await syncFile('settings.csv');
};

export const approveUnlock = async (userId: string, courseId: string) => {
  if (CLOUD_API_URL) await cloudFetch('approveUnlock', { userId, courseId });
  memory_users = memory_users.map(u => u.id === userId ? {
    ...u,
    pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId),
    enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])]
  } : u);
  await syncFile('users.csv');
};

export const requestUnlock = async (userId: string, courseId: string) => {
  if (CLOUD_API_URL) await cloudFetch('requestUnlock', { userId, courseId });
  memory_users = memory_users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...(u.pendingUnlocks || []), courseId])] } : u);
  await syncFile('users.csv');
};
