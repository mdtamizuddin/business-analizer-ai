import { api } from './api';

export interface Company {
  _id: string;
  name: string;
  website: string;
  industry?: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  website: string;
  industry?: string;
  description?: string;
}

export const companiesApi = {
  list: () => api.get<Company[]>('/companies'),
  get: (id: string) => api.get<Company>(`/companies/${id}`),
  create: (data: CreateCompanyInput) => api.post<Company>('/companies', data),
};
