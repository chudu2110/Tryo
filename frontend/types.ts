export interface ProjectPost {
  id: string;
  founderName: string;
  projectName: string;
  postedDate: string;
  deadline: string;
  description: string;
  imageUrl: string;
  field: ProjectField;
  stage: ProjectStage;
  compensation: string;
  roles: string[];
}

export enum ProjectField {
  AI = 'Artificial Intelligence',
  FINTECH = 'Fintech',
  EDTECH = 'EdTech',
  HEALTH = 'HealthTech',
  SOCIAL = 'Social',
  CRYPTO = 'Web3 / Crypto',
  CONSUMER = 'Consumer App',
  OTHER = 'Other'
}

export enum ProjectStage {
  IDEA = 'Idea Phase',
  MVP = 'MVP Ready',
  EARLY_USERS = 'Early Users',
  REVENUE = 'Generating Revenue',
  SCALING = 'Scaling'
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
}

export type AuthProvider = 'google' | 'facebook';

export interface UserAuthProfile {
  id: string;
  name: string;
  provider: AuthProvider;
  providerId?: string;
  dateOfBirth?: string;
  bio?: string;
  links?: (string | { title?: string; url: string })[];
  contactEmail?: string;
  contactFacebookUrl?: string;
  phoneNumber?: string;
  cvFilePath?: string;
  portfolioFilePath?: string;
}

export interface VerifiedUser {
  provider: AuthProvider;
  providerId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}
