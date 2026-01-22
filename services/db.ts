import { User } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';

const USERS_KEY = 'shamanth_academy_users_v1';
/**
 * During AWS Amplify deployment, the build script will replace this placeholder 
 * with your actual API Gateway URL via the amplify.yml configuration.
 */
const REMOTE_API_URL = "INSERT_AWS_API_URL_HERE";

// Log connection status on load for developer transparency
if (!REMOTE_API_URL.includes("INSERT_AWS")) {
  console.log(`%c Shamanth Academy: Connected to Cloud Backend at ${REMOTE_API_URL} `, 'background: #4338ca; color: #fff; font-weight: bold; padding: 4px;');
} else {
  console.log("%c Shamanth Academy: Running in Local Fallback Mode (LocalStorage) ", 'background: #f59e0b; color: #000; font-weight: bold; padding: 4px;');
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Standardized fetch wrapper for AWS Lambda via API Gateway
 */
async function cloudFetch(action: string, body: any = {}) {
  if (!REMOTE_API_URL || REMOTE_API_URL.includes("INSERT_AWS")) {
    return null;
  }
  
  try {
    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body })
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AWS API Error: ${response.status} - ${errText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Cloud Sync Unavailable (using local fallback):", error);
    return null;
  }
}

export const getStoredUsers = async (): Promise<User[]> => {
  const cloudData = await cloudFetch('getAllUsers');
  if (cloudData && Array.isArray(cloudData)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(cloudData));
    return cloudData;
  }

  await delay(200);
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