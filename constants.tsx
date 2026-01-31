
import { Course } from './types';

export const CATEGORIES = ['All', 'React', 'Java', 'Python', 'AWS', 'Data Science'];

/**
 * ADMIN ACCESS CREDENTIALS
 * Email: admin@shamanth.com
 * PIN: 1234
 */
export const ADMIN_CREDENTIALS = {
  email: 'admin@shamanth.com',
  pin: '1234'
};

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Mastering React 18 for Professionals',
    description: 'Deep dive into React 18 hooks, suspense, and server components.',
    instructor: 'Shamanth S.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    category: 'React',
    price: 0,
    isFree: true,
    videos: [
      { id: 'v1', title: 'Introduction to React', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '12:05' },
      { id: 'v2', title: 'Functional Components', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '18:30' }
    ]
  },
  {
    id: '2',
    title: 'Advanced Java Spring Boot Microservices',
    description: 'Build scalable microservices with Java Spring Boot and Kafka.',
    instructor: 'Shamanth S.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    category: 'Java',
    price: 4999,
    isFree: false,
    videos: [
      { id: 'v3', title: 'Setting up Environment', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15:20' },
      { id: 'v4', title: 'Database Connectivity', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '22:45' }
    ]
  },
  {
    id: '3',
    title: 'AWS Certified Solutions Architect',
    description: 'Get certified with this comprehensive guide to AWS services.',
    instructor: 'Cloud Lead',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    category: 'AWS',
    price: 9900,
    isFree: false,
    videos: [
      { id: 'v5', title: 'EC2 & VPC Fundamentals', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '35:00' }
    ]
  }
];
