import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api/auth.api.js'
import { useAuthStore } from '../store/authStore.js'
import { queryClient } from '../lib/queryClient.js'

export function useLogin() {
  const setAuth    = useAuthStore((s) => s.setAuth)
  const navigate   = useNavigate()

  return useMutation({
    mutationFn: (data) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken)
      toast.success(`Welcome back, ${data.user.username}!`)
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed'),
  })
}

export function useRegister() {
  const setAuth  = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: ({ data }) => {
      setAuth(data.user, data.accessToken)
      toast.success('Account created!')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed'),
  })
}

export function useLogout() {
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout()
      queryClient.clear()
      navigate('/login')
    },
  })
}
