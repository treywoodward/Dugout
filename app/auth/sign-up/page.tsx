'use client'

import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/auth/sign-up-success')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-5xl">⚾</div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dugout</h1>
          <p className="text-slate-400 text-sm">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-green-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="confirm">
              Confirm Password
            </label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-green-500"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 text-white font-bold text-base rounded-xl transition-all"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
