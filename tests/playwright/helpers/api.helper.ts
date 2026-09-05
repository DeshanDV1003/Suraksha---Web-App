import { APIRequestContext, expect } from '@playwright/test';
import { getAuthToken, Role } from './auth.helper';

export async function apiGet(request: APIRequestContext, url: string, role: Role | null = null) {
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };
  
  if (role) {
    const token = await getAuthToken(role);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await request.get(url, { headers });
  return response;
}

export async function apiPost(request: APIRequestContext, url: string, data: any, role: Role | null = null) {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  if (role) {
    const token = await getAuthToken(role);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await request.post(url, {
    headers,
    data
  });
  return response;
}
