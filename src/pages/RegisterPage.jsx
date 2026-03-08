import React from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '../hooks/useAuth.js'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

const schema = z.object({
  username:        z.string().min(3, 'Min 3 characters').max(20, 'Max 20 characters').regex(/^\w+$/, 'Letters, numbers, underscores only'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

export default function RegisterPage() {
  const { mutate: register, isPending } = useRegister()
  const { register: reg, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">M</div>
          <div className="logo-text">MAN<span style={{ color: 'var(--accent)' }}>HWA</span></div>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start tracking your manhwa library today.</p>

        <form className="auth-form" onSubmit={handleSubmit((d) => register(d))}>
          <Input label="Username"         placeholder="shadowreader"     error={errors.username?.message}        {...reg('username')} />
          <Input label="Email"            type="email" placeholder="you@example.com" error={errors.email?.message} {...reg('email')} />
          <Input label="Password"         type="password" placeholder="••••••••"   error={errors.password?.message} {...reg('password')} />
          <Input label="Confirm Password" type="password" placeholder="••••••••"   error={errors.confirmPassword?.message} {...reg('confirmPassword')} />

          <Button style={{ width: '100%', marginTop: 4 }} loading={isPending} type="submit">Create Account</Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
