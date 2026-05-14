import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { toast } from 'sonner'
import { GraduationCap, KeyRound, Eye, EyeOff, ArrowLeft, BookOpen, Sparkles } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type LoginData = z.infer<typeof loginSchema>
type SignupData = z.infer<typeof signupSchema>

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginData) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) toast.error(error.message)
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</label>
        <input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
          <button
            type="button"
            onClick={() => navigate('/reset-password')}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <input
          id="login-password"
          type="password"
          {...register('password')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SignupData>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data: SignupData) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) toast.error(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-primary text-xl">✓</span>
        </div>
        <p className="font-medium text-foreground">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link. Please check your inbox and click the link to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</label>
        <input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</label>
        <input
          id="signup-password"
          type="password"
          {...register('password')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="signup-confirm" className="text-sm font-medium text-foreground">Confirm Password</label>
        <input
          id="signup-confirm"
          type="password"
          {...register('confirmPassword')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}

function AccessKeyForm({ onBack }: { onBack: () => void }) {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) return

    if (!supabaseAdmin) {
      toast.error('Access key login is not available')
      return
    }

    setLoading(true)
    try {
      // Step 1: Resolve the user from the provided key
      const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(trimmed)
      if (userErr || !userData?.user?.email) {
        toast.error('Invalid access key')
        setLoading(false)
        return
      }

      // Step 2: Generate a one-time magic link for that user's email
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      })
      if (linkErr || !linkData?.properties?.hashed_token) {
        toast.error('Could not generate access token')
        setLoading(false)
        return
      }

      // Step 3: Verify the token to create a real session
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink',
      })
      if (verifyErr) {
        toast.error('Access key verification failed')
        setLoading(false)
        return
      }

      // Auth state listener in authStore will handle the rest
      toast.success('Access granted')
    } catch {
      toast.error('Invalid access key')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </button>

      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
        <KeyRound className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enter your access key to sign in instantly — no email or password needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Access Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Enter your access key"
              autoFocus
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !key.trim()}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'access-key'>('login')

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-primary/5 flex-col justify-center px-16 gap-6 border-r border-border">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">PrepTrack</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          Your exam preparation,<br />organized in one place.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Track your syllabus, plan daily study, log tests, manage notes,
          and get AI-assisted insights — built for serious exam preparation.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {['Syllabus Tracker', 'Spaced Repetition', 'Test Analytics', 'AI Assistant'].map(f => (
            <div key={f} className="bg-card border border-border rounded-lg p-3 text-sm font-medium text-foreground">
              {f}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-6">
          <Link
            to="/features"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Explore Features
          </Link>
          <span className="text-border">·</span>
          <Link
            to="/guide"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            <BookOpen className="h-4 w-4" />
            User Guide
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">

          {mode === 'access-key' ? (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-foreground">Access Key Login</h2>
                <p className="text-muted-foreground text-sm">Direct access without email or password</p>
              </div>
              <AccessKeyForm onBack={() => setMode('login')} />
            </>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mode === 'login' ? 'Sign in to continue your preparation' : 'Start tracking your preparation today'}
                </p>
              </div>

              {mode === 'login' ? <LoginForm /> : <SignupForm />}

              <p className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  className="text-primary hover:underline font-medium inline"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              {/* Access Key entry point — subtle, only on login tab */}
              {mode === 'login' && supabaseAdmin && (
                <div className="text-center">
                  <button
                    onClick={() => setMode('access-key')}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Use Access Key
                  </button>
                </div>
              )}
            </>
          )}

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-border">
            <Link
              to="/features"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explore Features
            </Link>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <Link
              to="/guide"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              User Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}