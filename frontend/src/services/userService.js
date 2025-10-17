import api from './api';

const userService = {
  async getNearbyUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/users/nearby?${params}`);
    return response;
  },

  async updateLocation(latitude, longitude) {
    const response = await api.post('/users/location', { latitude, longitude });
    return response;
  },

  async getUserById(userId) {
    const response = await api.get(`/users/${userId}`);
    return response;
  }
};

export default userService;
