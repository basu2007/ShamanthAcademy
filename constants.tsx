
import { Course } from './types';

export const CATEGORIES = ['All', 'React', 'Java', 'Python', 'AWS', 'Data Science'];

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Mastering React 18 for Professionals',
    description: 'Deep dive into React 18 hooks, suspense, and server components.',
    instructor: 'Shamanth S.',
    thumbnail: 'https://picsum.photos/seed/react/600/400',
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
    thumbnail: 'https://picsum.photos/seed/java/600/400',
    category: 'Java',
    price: 49.99,
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
    thumbnail: 'https://picsum.photos/seed/aws/600/400',
    category: 'AWS',
    price: 99.00,
    isFree: false,
    videos: [
      { id: 'v5', title: 'EC2 & VPC Fundamentals', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '35:00' }
    ]
  },
  {
    id: '4',
    title: 'Python for Data Analysis',
    description: 'Learn Pandas, Numpy and Matplotlib from scratch.',
    instructor: 'Data Lead',
    thumbnail: 'https://picsum.photos/seed/python/600/400',
    category: 'Python',
    price: 0,
    isFree: true,
    videos: [
      { id: 'v6', title: 'Python Basics', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10:15' }
    ]
  },
  {
    id: '5',
    title: 'Deep Learning with TensorFlow',
    description: 'Neural networks, CNNs, and LSTMs for industrial AI.',
    instructor: 'AI Scientist',
    thumbnail: 'https://picsum.photos/seed/ai/600/400',
    category: 'Data Science',
    price: 75.00,
    isFree: false,
    videos: [
      { id: 'v7', title: 'Intro to Deep Learning', url: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '20:10' }
    ]
  }
];

export const ADMIN_CREDENTIALS = {
  email: 'admin@shamanth.com',
  pin: '1234'
};
