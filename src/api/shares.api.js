import api from '../lib/axios.js'

export const sharesApi = {
  getInbox:  ()          => api.get('/shares/inbox'),
  getSent:   ()          => api.get('/shares/sent'),
  send:      (data)      => api.post('/shares', data),        // { manhwaId, sharedToId, message }
  markSeen:  (shareId)   => api.patch(`/shares/${shareId}/seen`),
  remove:    (shareId)   => api.delete(`/shares/${shareId}`),
}
