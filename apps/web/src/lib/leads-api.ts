import { api } from './api';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'won'
  | 'lost';

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: 'audit' | 'manual' | 'referral' | 'outbound';
  companyId?: string;
  auditId?: string;
  organizationId: string;
  assignedTo?: string;
  notes: { note: string; createdAt: string }[];
  nextFollowUp?: string;
  estimatedValue?: number;
  proposalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  source?: 'audit' | 'manual' | 'referral' | 'outbound';
  companyId?: string;
  auditId?: string;
  assignedTo?: string;
  estimatedValue?: number;
}

export const leadsApi = {
  list: () => api.get<Lead[]>('/leads'),
  get: (id: string) => api.get<Lead>(`/leads/${id}`),
  create: (data: CreateLeadInput) => api.post<Lead>('/leads', data),
  update: (id: string, data: Partial<CreateLeadInput> & { nextFollowUp?: string; proposalUrl?: string; status?: LeadStatus }) =>
    api.put<Lead>(`/leads/${id}`, data),
  addNote: (id: string, note: string) => api.post<Lead>(`/leads/${id}/notes`, { note }),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/leads/${id}`),
};
