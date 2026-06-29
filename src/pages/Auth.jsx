import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { register, login } from '../lib/auth'
import { useAuth } from '../lib/AuthContext'
import logoStacked from '../assets/secondary-logo.png';

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

  // Touched flags
  const [emailTouched, setEmailTouched] = useState(false)
  const [setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmFocused, setConfirmFocused] = useState(false)
  const [passwordEverFocused, setPasswordEverFocused] = useState(false)

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
    setEmailTouched(false)
    setPasswordTouched(false)
    setConfirmTouched(false)
    setPasswordEverFocused(false)
  }

  // ---------- Validation helpers (computed on render) ----------
  const getEmailError = (email) => {
    if (!email) return ''
    const parts = email.split('@')
    if (parts.length !== 2) return 'Invalid email format'
    const domain = parts[1]
    if (!domain.includes('.') || domain.split('.').pop().length < 2) {
      return 'Please include a valid domain (e.g., .com, .ng)'
    }
    return ''
  }

  const getPasswordRules = (password) => {
    const rules = [
      { id: 'length', label: 'At least 6 characters', test: p => p.length >= 6 },
      { id: 'special', label: 'At least 1 special character (!@#$%^&*)', test: p => /[!@#$%^&*]/.test(p) },
      { id: 'uppercase', label: 'At least 1 uppercase letter', test: p => /[A-Z]/.test(p) },
      { id: 'lowercase', label: 'At least 1 lowercase letter', test: p => /[a-z]/.test(p) },
    ]
    return rules.map(rule => ({ ...rule, satisfied: rule.test(password) }))
  }

  const getConfirmError = (confirm, password) => {
    if (!confirm) return ''
    if (confirm !== password) return 'Passwords do not match'
    return ''
  }

  const emailError = getEmailError(form.email)
  const confirmError = getConfirmError(form.confirmPassword, form.password)
  const passwordRules = getPasswordRules(form.password)
  const allPasswordRulesSatisfied = passwordRules.every(r => r.satisfied)

  const isFormValid = () => {
    if (mode === 'login') {
      return form.email && !getEmailError(form.email) && form.password
    } else {
      if (!form.name.trim()) return false
      if (getEmailError(form.email)) return false
      if (!allPasswordRulesSatisfied) return false
      if (getConfirmError(form.confirmPassword, form.password)) return false
      return true
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (mode === 'register') {
      if (!form.name.trim()) return setError('Please enter your name')
      if (!form.email.trim()) return setError('Please enter your email')
      if (emailError) return setError('Please fix the email address')
      if (!allPasswordRulesSatisfied) return setError('Please meet all password requirements')
      if (confirmError) return setError('Passwords do not match')
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

      // ---------- REDIRECT FIX ----------
      let redirectTo = location.state?.redirect
      if (!redirectTo) {
        if (mode === 'register') {
          // New users go to onboarding (which is at /start)
          redirectTo = '/start'
        } else {
          redirectTo = '/dashboard'
        }
      }
      navigate(redirectTo)
      // --------------------------------
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const actualShowPassword = confirmFocused ? false : showPassword

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px'
    }}>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
  <img 
    src={logoStacked} 
    alt="GradelyAI" 
    style={{ height: '60px', width: 'auto', margin: '0 auto' }} 
  />
</div>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(0,126,167,0.12) 0%, transparent 70%)', top: -200, right: -100 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(60px)', background: 'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 70%)', bottom: -100, left: -50 }} />
      </div>

<p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            ← Back to home
          </span>
        </p>

          {/* Card */}
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card">
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
              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="e.g. Chidi Okonkwo"
                  value={form.name} onChange={e => update('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email"
                placeholder="yourname@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  borderColor: (emailTouched && emailError) ? 'var(--danger)' : undefined,
                  boxShadow: (emailTouched && emailError) ? '0 0 0 3px rgba(217,79,79,0.15)' : undefined,
                }}
              />
              {emailTouched && emailError && (
                <div style={{
                  marginTop: 6, fontSize: 13, color: 'var(--danger)',
                  fontFamily: 'Geist, sans-serif'
                }}>
                  {emailError}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input"
                  type={actualShowPassword ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  onFocus={() => {
                    setPasswordFocused(true)
                    setPasswordEverFocused(true)
                    setPasswordTouched(true)
                  }}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ paddingRight: 44 }}
                />
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
                  <EyeIcon open={actualShowPassword} />
                </button>
              </div>
              {mode === 'register' && passwordEverFocused && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {passwordRules.map(rule => {
                    const isSatisfied = rule.satisfied
                    let color = 'var(--text-muted)'
                    if (isSatisfied) {
                      color = 'var(--success)'
                    } else if (!passwordFocused) {
                      color = 'var(--danger)'
                    }
                    return (
                      <div key={rule.id} style={{
                        fontSize: 13,
                        color,
                        fontFamily: 'Geist, sans-serif',
                        transition: 'color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>{isSatisfied ? '✓' : '○'}</span>
                        {rule.label}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {mode === 'register' && (
              <div>
                <label className="label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => { setConfirmFocused(false); setConfirmTouched(true) }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{
                      paddingRight: 44,
                      borderColor: (confirmTouched && confirmError) ? 'var(--danger)' : undefined,
                      boxShadow: (confirmTouched && confirmError) ? '0 0 0 3px rgba(217,79,79,0.15)' : undefined,
                    }}
                  />
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
                {confirmTouched && confirmError && (
                  <div style={{
                    marginTop: 6, fontSize: 13, color: 'var(--danger)',
                    fontFamily: 'Geist, sans-serif'
                  }}>
                    {confirmError}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(217,79,79,0.08)', border: '1px solid rgba(217,79,79,0.2)',
              color: 'var(--danger)', fontSize: 14, fontFamily: 'Geist, sans-serif'
            }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            style={{
              width: '100%', justifyContent: 'center', marginTop: 24,
              padding: '14px', fontSize: 15,
              opacity: (!loading && isFormValid()) ? 1 : 0.6,
              cursor: (!loading && isFormValid()) ? 'pointer' : 'not-allowed'
            }}>
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
              <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</a>
              {' '}and{' '}
              <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}