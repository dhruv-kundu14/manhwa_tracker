import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { manhwaApi } from '../api/manhwa.api.js'

export function useManhwaList(params) {
  return useQuery({
    queryKey: ['manhwa', params],
    queryFn:  () => manhwaApi.getAll(params).then((r) => r.data),
    keepPreviousData: true,
  })
}

export function useManhwaDetail(id) {
  return useQuery({
    queryKey: ['manhwa', id],
    queryFn:  () => manhwaApi.getById(id).then((r) => r.data),
    enabled:  !!id,
  })
}

export function useCreateManhwa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => manhwaApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manhwa'] })
      toast.success('Manhwa added to database!')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add manhwa'),
  })
}
