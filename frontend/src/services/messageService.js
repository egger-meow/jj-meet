import api from './api';

const messageService = {
  async getMessages(matchId, limit = 50, offset = 0) {
    const response = await api.get(`/messages/${matchId}?limit=${limit}&offset=${offset}`);
    return response;
  },

  async sendMessage(matchId, messageData) {
    const response = await api.post(`/messages/${matchId}`, messageData);
    return response;
  }
};

export default messageService;
