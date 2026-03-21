import axios, { AxiosInstance, AxiosError } from 'axios';
import { BackendConfig } from '../types';

let apiClient: AxiosInstance;

export const initHttpService = (config: BackendConfig) => {
  apiClient = axios.create({
    baseURL: config.url,
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'X-API-Key': config.apiKey }),
    },
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Here you can implement generic error handling, e.g., toast notifications
      console.error('API Error:', error.message);
      // You might want to throw the error to be handled by the specific API call
      return Promise.reject(error);
    }
  );
};

export const httpService = () => {
  if (!apiClient) {
    throw new Error('HTTP Service not initialized. Call initHttpService first.');
  }
  return apiClient;
};
