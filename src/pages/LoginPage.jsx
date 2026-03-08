import React from 'react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '../hooks/useAuth.js'
import { useAuthStore } from '../store/authStore.js'
import { authApi } from '../api/auth.api.js'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import '../components/layout/layout.css'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Min 6 characters'),
})

export default function LoginPage() {
  const navigate   = useNavigate()
  const token      = useAuthStore((s) => s.accessToken)
  const setAuth    = useAuthStore((s) => s.setAuth)
  const { mutate: login, isPending } = useLogin()

  // Try silent refresh on mount (user returning after tab close)
  useEffect(() => {
    if (token) { navigate('/dashboard'); return }
    authApi.refresh()
      .then(({ data }) => { setAuth(data.user, data.accessToken); navigate('/dashboard') })
      .catch(() => { /* no cookie – stay on login */ })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">M</div>
          <div className="logo-text">MAN<span style={{ color: 'var(--accent)' }}>HWA</span></div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue your reading journey.</p>

        <form className="auth-form" onSubmit={handleSubmit((d) => login(d))}>
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />

          <Button style={{ width: '100%', marginTop: 4 }} loading={isPending} type="submit">Sign In</Button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
        </div>
      </div>
    </div>
  )
}
