
import axios from 'axios';

const resolveApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Client-side: fall back to current origin to avoid localhost defaults in production
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/api`;
    }

    // Server-side fallback (build time)
    if (process.env.BACKEND_URL) {
        return `${process.env.BACKEND_URL}/api`;
    }

    return 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    // Client-side only - read token from zustand persist storage
    if (typeof window !== 'undefined') {
        // Zustand persist stores data under 'auth-storage' key with nested structure
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                const token = parsed?.state?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (e) {
                console.error('Failed to parse auth storage:', e);
            }
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 globally if needed
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                // localStorage.removeItem('token');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
