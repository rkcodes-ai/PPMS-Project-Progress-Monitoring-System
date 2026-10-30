import { apiClient } from './client';
import type { TokenResponse, UserProfile, RoleEnum } from '../types';

export const authApi = {
  login: async (username_or_email: string, password: string): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', {
      username_or_email,
      password,
    });
    return res.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/me');
    return res.data;
  },

  switchRole: async (target_role: RoleEnum): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/switch-role', {
      target_role,
    });
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },

  changePassword: async (current_password: string, new_password: string, confirm_new_password: string): Promise<{ message: string; access_token?: string }> => {
    const res = await apiClient.post<{ message: string; access_token?: string }>('/auth/change-password', {
      current_password,
      new_password,
      confirm_new_password,
    });
    if (res.data.access_token) {
      localStorage.setItem('ppms_token', res.data.access_token);
    }
    return res.data;
  },
};
