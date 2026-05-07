import { useState } from 'react'
import { initiatePayment } from '../lib/payment'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function LockIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="20" fill="rgba(0,126,167,0.1)"/>
      <rect x="20" y="38" width="40" height="28" rx="6" fill="#007EA7"/>
      <path d="M28 38V28C28 20.268 34.268 14 42 14C49.732 14 56 20.268 56 28V38" stroke="#007EA7" strokeWidth="4" strokeLinecap="round" fill="none"/>
      <circle cx="40" cy="52" r="4" fill="white"/>
      <rect x="38" y="52" width="4" height="7" rx="2" fill="white"/>
      <rect x="24" y="34" width="32" height="8" rx="4" fill="#005F80"/>
    </svg>
  )
}

const FEATURES = [
  { label: 'All 5 chapters fully generated' },
  { label: 'Personal Voice Mode' },
  { label: 'Defense Q&A — 20+ panel questions' },
  { label: 'Concept + Defense flashcards' },
  { label: 'Panel weakness analysis' },
  { label: 'Student-friendly breakdown' },
  { label: 'Real academic references' },
  { label: 'Word document export' },
]

export default function Paywall({ projectInfo, onUnlock, userEmail }) {
  const [email, setEmail] = useState(userEmail || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (!window.PaystackPop) {
      setError('Payment system not loaded. Please refresh and try again.')
      return
    }

    setLoading(true)
    setError('')

    initiatePayment({
      email,
      name: projectInfo?.name || 'Student',
      onSuccess: () => {
        setLoading(false)
        onUnlock()
      },
      onClose: () => {
        setLoading(false)
      }
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: '40px 24px',
      overflowY: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: 480, paddingBottom: 48 }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          border: '1px solid var(--border)'
        }}>

          {/* Header */}
          <div style={{
            padding: '36px 36px 28px',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <LockIllustration />
            </div>
            <h2 style={{
              fontFamily: 'Melodrama, serif', fontSize: 28,
              fontWeight: 700, marginBottom: 10, color: 'var(--text)'
            }}>
              Unlock Your Full Project
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              You've seen Chapter 1. Get everything you need to finish and defend your project.
            </p>
          </div>

          {/* Features */}
          <div style={{ padding: '24px 36px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                    <CheckIcon />
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price + payment */}
          <div style={{ padding: '28px 36px' }}>
            <div style={{
              textAlign: 'center', marginBottom: 24,
              padding: '16px', borderRadius: 14,
              background: 'rgba(0,126,167,0.06)',
              border: '1px solid rgba(0,126,167,0.15)'
            }}>
              <p style={{
                fontFamily: 'Melodrama, serif', fontSize: 40,
                fontWeight: 700, color: 'var(--accent)', marginBottom: 4
              }}>
                ₦5,000
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                One-time payment · No subscription · Yours forever
              </p>
            </div>

            <label className="label">Your email address</label>
            <input
              className="input"
              type="email"
              placeholder="yourname@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePay()}
              style={{ marginBottom: 8 }}
            />

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <button
              className="btn-accent"
              onClick={handlePay}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px', marginTop: 12 }}>
              {loading ? 'Opening payment...' : 'Pay ₦5,000 — Unlock Full Project'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', marginTop: 14 }}>
              Secured by Paystack · Card, Bank Transfer, USSD accepted
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}