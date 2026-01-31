
import { User, PlatformSettings } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v1';
const SETTINGS_KEY = 'shamanth_academy_settings_v1';

const REMOTE_API_URL = "INSERT_AWS_API_URL_HERE";

const isCloudConnected = () => {
  return REMOTE_API_URL && 
         !REMOTE_API_URL.includes("INSERT_AWS") && 
         REMOTE_API_URL.startsWith("http");
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Settings Logic
export const getPlatformSettings = async (): Promise<PlatformSettings> => {
  const local = localStorage.getItem(SETTINGS_KEY);
  let settings: PlatformSettings | null = null;
  
  if (local) {
    try {
      settings = JSON.parse(local);
    } catch (e) {
      console.error("Local settings corrupt", e);
    }
  }

  if (isCloudConnected()) {
    const cloudData = await cloudFetch('getSettings');
    if (cloudData && typeof cloudData === 'object' && cloudData.upiId) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudData));
      return cloudData;
    }
  }
  
  return settings || {
    paymentQrCode: null,
    upiId: 'shamanth@okaxis',
    contactNumber: '+91 9902122531'
  };
};

export const savePlatformSettings = async (settings: PlatformSettings): Promise<void> => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (isCloudConnected()) {
      await cloudFetch('saveSettings', { settings });
    }
  } catch (err) {
    console.error("❌ Failed to save settings:", err);
    throw err;
  }
};

export const getStoredUsers = async (): Promise<User[]> => {
  const cloudData = await cloudFetch('getAllUsers');
  if (cloudData && Array.isArray(cloudData)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
    return cloudData;
  }
  await delay(50);
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

export const saveUsers = async (users: User[]): Promise<void> => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = async (email: string, pin: string): Promise<User | null> => {
  const cloudUser = await cloudFetch('register', { email, pin });
  if (cloudUser) return cloudUser;
  const users = await getStoredUsers();
  if (users.find(u => u.email === email)) return null;
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    pin,
    role: 'USER',
    enrolledCourses: [],
    pendingUnlocks: [],
    enrollmentDates: {},
    lastActive: new Date().toISOString()
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
};

export const loginUser = async (email: string, pin: string): Promise<User | null> => {
  const cloudUser = await cloudFetch('login', { email, pin });
  if (cloudUser) return cloudUser;
  const users = await getStoredUsers();
  const userIndex = users.findIndex(u => u.email === email && u.pin === pin);
  if (userIndex !== -1) {
    users[userIndex].lastActive = new Date().toISOString();
    await saveUsers(users);
    return users[userIndex];
  }
  return null;
};

export const requestUnlock = async (userId: string, courseId: string): Promise<void> => {
  const cloudResult = await cloudFetch('requestUnlock', { userId, courseId });
  if (cloudResult) return;
  const users = await getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      if (!u.pendingUnlocks.includes(courseId)) {
        return { ...u, pendingUnlocks: [...u.pendingUnlocks, courseId], lastActive: new Date().toISOString() };
      }
    }
    return u;
  });
  await saveUsers(updated);
};

export const approveUnlock = async (userId: string, courseId: string): Promise<void> => {
  const cloudResult = await cloudFetch('approveUnlock', { userId, courseId });
  if (cloudResult) return;
  const users = await getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const now = new Date().toISOString();
      return {
        ...u,
        pendingUnlocks: u.pendingUnlocks.filter(id => id !== courseId),
        enrolledCourses: [...new Set([...u.enrolledCourses, courseId])],
        enrollmentDates: { ...u.enrollmentDates, [courseId]: now },
        lastActive: now
      };
    }
    return u;
  });
  await saveUsers(updated);
};

export const lockCourse = async (userId: string, courseId: string): Promise<void> => {
  const cloudResult = await cloudFetch('lockCourse', { userId, courseId });
  if (cloudResult) return;
  const users = await getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const newDates = { ...u.enrollmentDates };
      delete newDates[courseId];
      return {
        ...u,
        enrolledCourses: u.enrolledCourses.filter(id => id !== courseId),
        enrollmentDates: newDates,
        lastActive: new Date().toISOString()
      };
    }
    return u;
  });
  await saveUsers(updated);
};
