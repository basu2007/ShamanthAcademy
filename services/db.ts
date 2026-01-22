
import { User } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';

const USERS_KEY = 'vidyaflow_users_v2';
// In AWS, you would set this via Amplify Environment Variables
const REMOTE_API_URL = (window as any).process?.env?.AWS_API_URL || null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Standardized fetch wrapper for AWS Lambda
 */
async function cloudFetch(action: string, body: any = {}) {
  if (!REMOTE_API_URL) return null;
  
  try {
    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    });
    return await response.json();
  } catch (error) {
    console.error("AWS Cloud Error:", error);
    return null;
  }
}

export const getStoredUsers = async (): Promise<User[]> => {
  const cloudData = await cloudFetch('getAllUsers');
  if (cloudData) return cloudData;

  // Fallback to LocalStorage
  await delay(300);
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
  const success = await cloudFetch('batchUpdateUsers', { users });
  if (success) return;

  // Fallback to LocalStorage
  await delay(200);
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
      return {
        ...u,
        pendingUnlocks: u.pendingUnlocks.filter(id => id !== courseId),
        enrolledCourses: [...new Set([...u.enrolledCourses, courseId])],
        lastActive: new Date().toISOString()
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
      return {
        ...u,
        enrolledCourses: u.enrolledCourses.filter(id => id !== courseId),
        lastActive: new Date().toISOString()
      };
    }
    return u;
  });
  await saveUsers(updated);
};
