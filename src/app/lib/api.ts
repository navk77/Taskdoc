// frontend/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: false, // true if using cookies
});

export default api;
