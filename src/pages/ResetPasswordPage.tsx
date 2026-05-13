import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { GraduationCap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const requestSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'request' | 'sent' | 'reset'>('request')

  if (mode === 'sent') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">PrepTrack</span>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-primary text-xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We've sent a password reset link. Please check your inbox and follow the instructions.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="text-primary hover:underline text-sm font-medium"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return <ResetForm onDone={() => navigate('/auth')} />
  }

  return <RequestForm onSent={() => setMode('sent')} />
}

function RequestForm({ onSent }: { onSent: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(requestSchema)
  })

  const onSubmit = async (data: { email: string }) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      onSent()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">PrepTrack</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reset-email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email && <p className="text-xs text-destructive">{String(errors.email.message)}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <button onClick={() => window.history.back()} className="text-primary hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}

function ResetForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema)
  })

  const onSubmit = async (data: { password: string }) => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      onDone()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</label>
            <input
              id="new-password"
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.password && <p className="text-xs text-destructive">{String(errors.password.message)}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">Confirm Password</label>
            <input
              id="confirm-new-password"
              type="password"
              {...register('confirmPassword')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.confirmPassword && <p className="text-xs text-destructive">{String(errors.confirmPassword.message)}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}