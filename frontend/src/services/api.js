import axios from 'axios';

// Create an Axios instance with base URL pointing to the FastAPI backend
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 
             (window.location.hostname.includes('vercel.app') 
                 ? `${window.location.origin}/api` 
                 : 'http://localhost:5000/api'),
});

// Interceptor to add auth token to requests automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('agri_assist_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
