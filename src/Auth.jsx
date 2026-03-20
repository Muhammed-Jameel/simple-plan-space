import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

export function AuthProvider({ children, onUserChange }) {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null
      setUser(u)
      onUserChange(u?.id || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null
      setUser(u)
      onUserChange(u?.id || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setShowAuth(false)
      }
    } catch (err) { setError(err.message) }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    onUserChange(null)
  }

  const handleGoogleSignIn = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) setError(error.message)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#13110F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6A6258', fontFamily: 'Outfit' }}>Loading...</div>

  return (
    <div>
      {/* Auth bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 16px', background: '#0F0E0C', borderBottom: '1px solid #1A1816', gap: 8 }}>
        {!isSupabaseConfigured() ? (
          <span style={{ fontSize: 11, color: '#4A4540', fontFamily: 'Outfit' }}>Local mode (no account)</span>
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#6A6258', fontFamily: 'Outfit' }}>{user.email}</span>
            <span style={{ fontSize: 9, color: '#4A6B3E', background: '#1A2A18', padding: '2px 6px', borderRadius: 3, fontFamily: 'Outfit' }}>synced</span>
            <button onClick={handleSignOut} style={{ fontSize: 11, color: '#8B5A5A', background: 'transparent', border: '1px solid #3A2020', padding: '3px 10px', borderRadius: 3, cursor: 'pointer', fontFamily: 'Outfit' }}>Sign Out</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#4A4540', fontFamily: 'Outfit' }}>Guest mode</span>
            <button onClick={() => setShowAuth(true)} style={{ fontSize: 11, color: '#C8A951', background: 'transparent', border: '1px solid #C8A951', padding: '3px 12px', borderRadius: 3, cursor: 'pointer', fontFamily: 'Outfit' }}>Sign In to sync</button>
          </div>
        )}
      </div>

      {/* Auth modal */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAuth(false)}>
          <div style={{ background: '#1C1916', border: '1px solid #2A2520', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#FDF8F0', marginBottom: 4, fontWeight: 400 }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p style={{ fontSize: 12, color: '#6A6258', marginBottom: 20 }}>{isSignUp ? 'Sign up to sync your plans across devices' : 'Sign in to access your saved plans'}</p>

            {error && <div style={{ background: '#3A2020', color: '#F0C0C0', padding: '8px 12px', borderRadius: 4, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            {message && <div style={{ background: '#1A2A18', color: '#8BC08A', padding: '8px 12px', borderRadius: 4, fontSize: 12, marginBottom: 12 }}>{message}</div>}

            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6A6258', marginBottom: 4 }}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#2A2520', border: '1px solid #3A3530', borderRadius: 4, color: '#FDF8F0', fontFamily: 'Outfit', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6A6258', marginBottom: 4 }}>Password</label>
                <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#2A2520', border: '1px solid #3A3530', borderRadius: 4, color: '#FDF8F0', fontFamily: 'Outfit', fontSize: 14, outline: 'none' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#C8A951', color: '#13110F', border: 'none', borderRadius: 4, fontFamily: 'Outfit', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #3A3530', color: '#A09888', borderRadius: 4, fontFamily: 'Outfit', fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
              Continue with Google
            </button>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }} style={{ background: 'none', border: 'none', color: '#C8A951', fontFamily: 'Outfit', fontSize: 12, cursor: 'pointer' }}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#6A6258', fontSize: 18, cursor: 'pointer' }}>x</button>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
