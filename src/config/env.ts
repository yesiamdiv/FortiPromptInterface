export const env = {
  apiUrl:    process.env.REACT_APP_API_URL    ?? 'http://localhost:8000/api/v1',
  socketUrl: process.env.REACT_APP_SOCKET_URL ?? 'http://localhost:8000',
} as const;
