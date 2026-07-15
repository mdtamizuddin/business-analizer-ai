import { api } from './api';

export interface SocialResult {
  profiles: {
    platform: string;
    url: string;
    found: boolean;
    followerText?: string;
    postCount?: number;
    bioPresent: boolean;
    issues: string[];
  }[];
  consistencyScore: number;
  presenceScore: number;
  summary: string;
}

export const socialApi = {
  analyze: (profiles: { platform: string; url: string }[], companyId?: string) =>
    api.post<SocialResult>('/social/analyze', { profiles, companyId }),
};
