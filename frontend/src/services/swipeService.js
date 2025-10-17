import api from './api';

const swipeService = {
  async swipe(userId, direction) {
    const response = await api.post('/swipes', {
      swiped_id: userId,
      direction
    });
    return response;
  },

  async getHistory() {
    const response = await api.get('/swipes/history');
    return response;
  },

  async getLikes() {
    const response = await api.get('/swipes/likes');
    return response;
  }
};

export default swipeService;
