import api from './api';

const matchService = {
  async getMatches() {
    const response = await api.get('/matches');
    return response;
  },

  async unmatch(matchId) {
    const response = await api.delete(`/matches/${matchId}`);
    return response;
  }
};

export default matchService;
