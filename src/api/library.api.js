import api from '../lib/axios.js'

export const libraryApi = {
  getAll:   (params) => api.get('/library', { params }),      // ?status=READING
  add:      (data)   => api.post('/library', data),           // { manhwaId, readingStatus, currentChapter }
  update:   (manhwaId, data) => api.patch(`/library/${manhwaId}`, data),
  remove:   (manhwaId)       => api.delete(`/library/${manhwaId}`),
}
