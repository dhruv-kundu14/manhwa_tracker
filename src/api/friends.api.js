import api from '../lib/axios.js'

export const friendsApi = {
  getAll:         ()         => api.get('/friends'),
  getRequests:    ()         => api.get('/friends/requests'),
  search:         (q)        => api.get('/friends/search', { params: { q } }),
  sendRequest:    (userId)   => api.post(`/friends/request/${userId}`),
  respondRequest: (userId, action) => api.patch(`/friends/request/${userId}`, { action }), // accept | reject
  remove:         (userId)   => api.delete(`/friends/${userId}`),
  getFriendLib:   (userId, params) => api.get(`/friends/${userId}/library`, { params }),
}
