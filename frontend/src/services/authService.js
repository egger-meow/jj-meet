import api from './api';

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response;
  },

  async updateProfile(updates) {
    const response = await api.patch('/auth/profile', updates);
    return response;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;
