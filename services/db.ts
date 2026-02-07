
import { User, PlatformSettings, Course, Batch } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

let directoryHandle: FileSystemDirectoryHandle | null = null;
let memory_users: User[] = [];
let memory_courses: Course[] = [...MOCK_COURSES];
let memory_batches: Batch[] = [];
let memory_settings: PlatformSettings = {
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science'],
  flashNews: ['System Active: Local CSV Database Engaged']
};

// Helper: Object Array to CSV
const toCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => {
      const stringified = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${stringified.replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

// Helper: CSV to Object Array
const fromCSV = (csv: string): any[] => {
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
        } else if (!isNaN(Number(val)) && val !== '' && h !== 'pin') {
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
  if (!directoryHandle) return;
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) { console.error(`Disk Error: ${fileName}`, err); }
};

export const mountDisk = async (): Promise<boolean> => {
  try {
    // @ts-ignore
    directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    if (!directoryHandle) return false;

    const files = ['users.csv', 'courses.csv', 'batches.csv', 'settings.csv'];
    for (const f of files) {
      try {
        const handle = await directoryHandle.getFileHandle(f);
        const file = await handle.getFile();
        const text = await file.text();
        const data = fromCSV(text);
        if (f === 'users.csv') memory_users = data;
        if (f === 'courses.csv') memory_courses = data.length ? data : MOCK_COURSES;
        if (f === 'batches.csv') memory_batches = data;
        if (f === 'settings.csv') memory_settings = data[0] || memory_settings;
      } catch (e) {
        console.log(`Creating ${f}...`);
        await syncFile(f);
      }
    }
    return true;
  } catch (err) { return false; }
};

const syncFile = async (name: string) => {
  if (name === 'users.csv') await writeToDisk(name, toCSV(memory_users));
  if (name === 'courses.csv') await writeToDisk(name, toCSV(memory_courses));
  if (name === 'batches.csv') await writeToDisk(name, toCSV(memory_batches));
  if (name === 'settings.csv') await writeToDisk(name, toCSV([memory_settings]));
};

export const getStoredUsers = async () => [...memory_users];
export const getCourses = async () => [...memory_courses];
export const getBatches = async () => [...memory_batches];
export const getPlatformSettings = async () => ({ ...memory_settings });

export const registerUser = async (email: string, pin: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (memory_users.some(u => u.email === cleanEmail)) return null;
  const newUser: User = { id: `u_${Date.now()}`, email: cleanEmail, pin, role: 'USER', enrolledCourses: [], pendingUnlocks: [] };
  memory_users.push(newUser);
  await syncFile('users.csv');
  return newUser;
};

export const loginUser = async (email: string, pin: string) => {
  if (email === ADMIN_CREDENTIALS.email && pin === ADMIN_CREDENTIALS.pin) {
    return { id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin, role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [] } as User;
  }
  return memory_users.find(u => u.email === email.trim().toLowerCase() && u.pin === pin) || null;
};

export const saveCourse = async (course: Course) => {
  const idx = memory_courses.findIndex(c => c.id === course.id);
  if (idx !== -1) memory_courses[idx] = course; else memory_courses.push(course);
  await syncFile('courses.csv');
};

export const deleteCourse = async (id: string) => {
  memory_courses = memory_courses.filter(c => c.id !== id);
  await syncFile('courses.csv');
};

export const saveBatch = async (batch: Batch) => {
  const idx = memory_batches.findIndex(b => b.id === batch.id);
  if (idx !== -1) memory_batches[idx] = batch; else memory_batches.push(batch);
  await syncFile('batches.csv');
};

export const deleteBatch = async (id: string) => {
  memory_batches = memory_batches.filter(b => b.id !== id);
  await syncFile('batches.csv');
};

export const saveSettings = async (s: PlatformSettings) => {
  memory_settings = s;
  await syncFile('settings.csv');
};

export const approveUnlock = async (userId: string, courseId: string) => {
  memory_users = memory_users.map(u => u.id === userId ? {
    ...u,
    pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId),
    enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])]
  } : u);
  await syncFile('users.csv');
};

export const requestUnlock = async (userId: string, courseId: string) => {
  memory_users = memory_users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...(u.pendingUnlocks || []), courseId])] } : u);
  await syncFile('users.csv');
};
