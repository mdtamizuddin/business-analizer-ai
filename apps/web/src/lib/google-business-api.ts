import { api } from './api';

export interface GoogleBusinessResult {
  found: boolean;
  name?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  categories?: string[];
  hasWebsite: boolean;
  sentiment: 'positive' | 'mixed' | 'negative' | 'unknown';
  topComplaints: string[];
  topPraises: string[];
  issues: string[];
  summary: string;
}

export const googleBusinessApi = {
  analyze: (profileUrl: string) => api.post<GoogleBusinessResult>('/google-business/analyze', { profileUrl }),
};
