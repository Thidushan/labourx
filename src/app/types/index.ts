export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  year: number;
  duration: string;
  value?: string;
  category: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  year: number;
  type: 'degree' | 'certification' | 'training';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  projectType: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  city: string;
  avatar?: string;
  role: 'technician';
  bio: string;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  skills: string[];
  certifications: string[];
  education: Education[];
  projects: Project[];
  reviews: Review[];
  availability: 'Available' | 'Busy' | 'Limited';
  hourlyRate?: string;
  completedProjects: number;
  joinedAt: string;
  isVerified: boolean;
  website?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar?: string;
  role: 'user';
  age?: number;
  joinedAt: string;
}

export interface Bid {
  id: string;
  technicianId: string;
  technicianName: string;
  technicianAvatar?: string;
  technicianSpecialty: string;
  technicianRating: number;
  description: string;
  budget: number;
  timeline: string;
  approach: string;
  submittedAt: string;
  isSelected?: boolean;
}

export interface WorkPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userCity: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  postedAt: string;
  status: 'open' | 'in-progress' | 'closed';
  bids: Bid[];
  images?: string[];
}

export const SPECIALTIES = [
  'Mason',
  'Electrician',
  'Plumber',
  'Interior Designer',
  'Architect',
  'Carpenter',
  'Painter',
  'HVAC Technician',
  'Roofer',
  'Welder',
  'Tiler',
  'Landscaper',
] as const;

export type Specialty = typeof SPECIALTIES[number];
