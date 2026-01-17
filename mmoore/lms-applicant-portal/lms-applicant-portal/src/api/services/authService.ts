import { apiClient, endpoints } from '../client';
import type { LoginRequest, LoginResponse, VerifyApplicantRequest } from '../../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(endpoints.login, credentials);
    return response.data;
  },

  async verifyApplicant(data: VerifyApplicantRequest): Promise<{ verified: boolean; applicantId?: string }> {
    const response = await apiClient.post(endpoints.verifyApplicant, data);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getUserData(): { userId: string; firstName: string; lastName: string } | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  },

  setUserData(data: { userId: string; firstName: string; lastName: string }): void {
    localStorage.setItem('user_data', JSON.stringify(data));
  },
};
