import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { register, login } from '../lib/auth'
import { useAuth } from '../lib/AuthContext'

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const [mode, setMode] = useState(location.state?.mode || 'login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setShowPassword(false)
    setShowConfirm(false)
  }

  const handleSubmit = async () => {
    setError('')

    if (mode === 'register') {
      if (!form.name.trim()) return setError('Please enter your name')
      if (!form.email.trim()) return setError('Please enter your email')
      if (form.password.length < 6) return setError('Password must be at least 6 characters')
      if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    } else {
      if (!form.email.trim()) return setError('Please enter your email')
      if (!form.password) return setError('Please enter your password')
    }

    setLoading(true)
    try {
      const data = mode === 'register'
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password)

      setUser(data.user)
      const redirect = location.state?.redirect || '/dashboard'
      navigate(redirect)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px'
    }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(0,126,167,0.12) 0%, transparent 70%)', top: -200, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(60px)', background: 'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 70%)', bottom: -100, left: -50 }} />
      </div>

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 40, textAlign: 'center' }}>
        <div onClick={() => navigate('/')} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white' }}>G</div>
          <span style={{ fontFamily: 'Melodrama, serif', fontSize: 22, color: 'var(--text)' }}>GradelyAI</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
        </p>
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <div className="card" style={{ padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)' }}>

          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 32,
            background: 'var(--bg-elevated)', borderRadius: 12, padding: 4,
            position: 'relative'
          }}>
            {[
              { key: 'login', label: 'Sign In' },
              { key: 'register', label: 'Create Account' }
            ].map(t => (
              <button key={t.key} onClick={() => switchMode(t.key)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  fontFamily: 'Geist, sans-serif',
                  background: mode === t.key ? 'var(--bg-card)' : 'transparent',
                  color: mode === t.key ? 'var(--accent)' : 'var(--text-muted)',
                  boxShadow: mode === t.key ? 'var(--shadow)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {mode === 'register' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <label className="label">Full Name</label>
                <input className="input" placeholder="e.g. Chidi Okonkwo"
                  value={form.name} onChange={e => update('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="yourname@email.com"
                value={form.email} onChange={e => update('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                  value={form.password} onChange={e => update('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ paddingRight: 44 }} />
                <button onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                    padding: 4, borderRadius: 4, transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <label className="label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowConfirm(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                      padding: 4, borderRadius: 4, transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(217,79,79,0.08)', border: '1px solid rgba(217,79,79,0.2)',
              color: 'var(--danger)', fontSize: 14, fontFamily: 'Geist, sans-serif'
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '14px', fontSize: 15 }}>
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In →' : 'Create Account →')
            }
          </button>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>
              Forgot your password?{' '}
              <a href="mailto:hello@gradely.ai" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                Contact support
              </a>
            </p>
          )}

          {mode === 'register' && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, fontFamily: 'Geist, sans-serif' }}>
              By creating an account you agree to our{' '}
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          )}

        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            ← Back to home
          </span>
        </p>
      </div>
    </div>
  )
}