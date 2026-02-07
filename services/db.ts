
import { User, PlatformSettings, Course, Batch } from '../types';
import { ADMIN_CREDENTIALS, MOCK_COURSES } from '../constants';

/**
 * SHAMANTH ACADEMY: LIVE-CSV DISK ENGINE
 * This engine connects to the user's local file system.
 */

let directoryHandle: FileSystemDirectoryHandle | null = null;
let memory_users: User[] = [];
let memory_courses: Course[] = [...MOCK_COURSES];
let memory_batches: Batch[] = [];

// Helper: Convert Object Array to CSV String
const toCSV = (data: any[]) => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : JSON.stringify(val)
    ).join(',')
  );
  return [headers, ...rows].join('\n');
};

// Helper: Parse CSV String to Object Array
const fromCSV = (csv: string): any[] => {
  const lines = csv.split('\n').filter(l => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma not inside quotes
    const obj: any = {};
    headers.forEach((h, i) => {
      let val = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"');
      try {
        if (val && (val.startsWith('[') || val.startsWith('{'))) {
          obj[h] = JSON.parse(val);
        } else if (!isNaN(Number(val)) && val !== '') {
          obj[h] = Number(val);
        } else {
          obj[h] = val;
        }
      } catch (e) {
        obj[h] = val;
      }
    });
    return obj;
  });
};

// --- DISK IO OPERATIONS ---

const writeToDisk = async (fileName: string, content: string) => {
  if (!directoryHandle) return;
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    console.log(`💾 Disk Sync: ${fileName} updated.`);
  } catch (err) {
    console.error(`❌ Disk Sync Failure: ${fileName}`, err);
  }
};

export const mountDisk = async (): Promise<boolean> => {
  try {
    // @ts-ignore
    directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    if (!directoryHandle) return false;

    // Load initial data from disk if exists
    try {
      const uFile = await (await directoryHandle.getFileHandle('users.csv')).getFile();
      memory_users = fromCSV(await uFile.text());
      const cFile = await (await directoryHandle.getFileHandle('courses.csv')).getFile();
      memory_courses = fromCSV(await cFile.text());
      const bFile = await (await directoryHandle.getFileHandle('batches.csv')).getFile();
      memory_batches = fromCSV(await bFile.text());
    } catch (e) {
      console.log("Initializing new CSV files on mounted disk...");
      await syncAll();
    }
    return true;
  } catch (err) {
    console.error("Mount failed", err);
    return false;
  }
};

const syncAll = async () => {
  await Promise.all([
    writeToDisk('users.csv', toCSV(memory_users)),
    writeToDisk('courses.csv', toCSV(memory_courses)),
    writeToDisk('batches.csv', toCSV(memory_batches))
  ]);
};

// --- DATA ACCESSORS (In-Memory for Speed, Syncing to Disk for Safety) ---

export const getStoredUsers = async () => [...memory_users];
export const getCourses = async () => [...memory_courses];
export const getBatches = async () => [...memory_batches];
export const getPlatformSettings = async (): Promise<PlatformSettings> => ({
  paymentQrCode: null,
  upiId: 'shamanth@okaxis',
  contactNumber: '+91 9902122531',
  categories: ['React', 'Java', 'Python', 'AWS', 'Data Science'],
  flashNews: ['Live CSV Persistence Active', 'Zero Data Loss Mode Enabled']
});

// --- OPERATIONS ---

export const registerUser = async (email: string, pin: string) => {
  const cleanEmail = email.trim().toLowerCase();
  if (memory_users.some(u => u.email === cleanEmail)) return null;
  const newUser: User = {
    id: `u_${Date.now()}`, email: cleanEmail, pin: pin.trim(), role: 'USER',
    enrolledCourses: [], pendingUnlocks: []
  };
  memory_users.push(newUser);
  await writeToDisk('users.csv', toCSV(memory_users));
  return newUser;
};

export const loginUser = async (email: string, pin: string) => {
  if (email === ADMIN_CREDENTIALS.email && pin === ADMIN_CREDENTIALS.pin) {
    return { id: 'admin', email: ADMIN_CREDENTIALS.email, pin: ADMIN_CREDENTIALS.pin, role: 'ADMIN', enrolledCourses: [], pendingUnlocks: [] } as User;
  }
  return memory_users.find(u => u.email === email.trim().toLowerCase() && u.pin === pin.trim()) || null;
};

export const saveCourse = async (course: Course) => {
  const idx = memory_courses.findIndex(c => c.id === course.id);
  if (idx !== -1) memory_courses[idx] = course; else memory_courses.push(course);
  await writeToDisk('courses.csv', toCSV(memory_courses));
};

export const saveBatch = async (batch: Batch) => {
  const idx = memory_batches.findIndex(b => b.id === batch.id);
  if (idx !== -1) memory_batches[idx] = batch; else memory_batches.push(batch);
  await writeToDisk('batches.csv', toCSV(memory_batches));
};

export const approveUnlock = async (userId: string, courseId: string) => {
  memory_users = memory_users.map(u => u.id === userId ? {
    ...u,
    pendingUnlocks: (u.pendingUnlocks || []).filter(id => id !== courseId),
    enrolledCourses: [...new Set([...(u.enrolledCourses || []), courseId])]
  } : u);
  await writeToDisk('users.csv', toCSV(memory_users));
};

export const requestUnlock = async (userId: string, courseId: string) => {
  memory_users = memory_users.map(u => u.id === userId ? { ...u, pendingUnlocks: [...new Set([...(u.pendingUnlocks || []), courseId])] } : u);
  await writeToDisk('users.csv', toCSV(memory_users));
};

// Bulk overwrites for importing legacy data
export const bulkOverwriteUsers = async (users: User[]) => { memory_users = users; await syncAll(); };
export const bulkOverwriteCourses = async (courses: Course[]) => { memory_courses = courses; await syncAll(); };
export const bulkOverwriteBatches = async (batches: Batch[]) => { memory_batches = batches; await syncAll(); };
