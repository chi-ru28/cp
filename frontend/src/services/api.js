import axios from 'axios';

// Create an Axios instance with base URL pointing to the FastAPI backend
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api',
});

// Interceptor to add auth token to requests automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Auth API methods
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);

// Chat API methods
export const sendMessage = (payload) => api.post('/chat', payload);
export const getChatDashboard = () => api.get('/chat/sessions');
export const getChatHistory = (sessionId) => api.get(`/chat/history/${sessionId}`);
export const deleteChatSession = (sessionId) => api.delete(`/chat/history/${sessionId}`);

// Comparison/Analysis API methods
export const getAnalysisReports = () => api.get('/analysis');
export const deleteAnalysisReport = (id) => api.delete(`/analysis/${id}`);

// Weather API methods
export const getWeather = (city) => api.get(`/weather?city=${city}`);

export default api;
