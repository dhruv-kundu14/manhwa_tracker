import api from '../lib/axios.js'

export const manhwaApi = {
  getAll:   (params) => api.get('/manhwa', { params }),       // ?search=&genre=&page=
  getById:  (id)     => api.get(`/manhwa/${id}`),
  create:   (data)   => api.post('/manhwa', data),
}
