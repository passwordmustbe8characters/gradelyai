import { useState } from 'react'
import { initializePaystackPayment } from '../lib/payment'

const PLANS = {
  STANDARD: { label: 'Standard', price: 10000, features: ['All 5 chapters', 'Word export', 'Defense prep', 'Flashcards', 'Supervisor corrections'] },
  PREMIUM: { label: 'Premium', price: 15000, features: ['Everything in Standard', 'AI Humanizer (unlimited)', 'Priority support', 'Plagiarism-safe guarantee'] }
}

export default function Paywall({ projectInfo, onUnlock, userEmail }) {
  const [email, setEmail] = useState(userEmail || '')
  const [selectedPlan, setSelectedPlan] = useState('STANDARD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')

    initializePaystackPayment({
      email: email.trim(),
      amount: PLANS[selectedPlan].price,
      onSuccess: async (reference) => {
        try {
          const BASE_URL = import.meta.env.VITE_API_URL || ''
          const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
          const projectId = projectInfo?.dbProjectId
            || projectInfo?.id
            || sessionStorage.getItem('gradelyProjectDbId')

          const res = await fetch(`${BASE_URL}/api/payments/paystack/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reference, projectId, plan: selectedPlan })
          })

          const data = await res.json()
          if (data.success) {
            setLoading(false)
            onUnlock()
          } else {
            setError(data.error || 'Payment verified but activation failed. Please contact support.')
            setLoading(false)
          }
        } catch (err) {
          console.error('Paystack verify error:', err)
          setError('Could not verify payment. Please contact support with your payment reference: ' + reference)
          setLoading(false)
        }
      },
      onClose: () => {
        setLoading(false)
      }
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(10,10,15,0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', overflowY: 'auto'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: '36px 32px',
        maxWidth: 480,
        width: '100%',
        border: '1px solid var(--border)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>
            Unlock Your Full Project
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your Chapter 1 is ready. Unlock all 5 chapters, defense prep, flashcards, and Word export.
          </p>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {Object.entries(PLANS).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              style={{
                flex: 1, padding: '16px 12px',
                borderRadius: 14,
                border: `2px solid ${selectedPlan === key ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedPlan === key ? 'rgba(0,126,167,0.06)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>{plan.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
                ₦{plan.price.toLocaleString()}
              </p>
              {plan.features.map((f, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>✓ {f}</p>
              ))}
            </button>
          ))}
        </div>

        {/* Email input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              fontSize: 14, fontFamily: 'Geist, sans-serif',
              background: 'var(--bg)', color: 'var(--text)',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
            ⚠️ {error}
          </p>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading || !email.trim()}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 100,
            border: 'none',
            background: loading || !email.trim() ? 'var(--border)' : 'var(--accent)',
            color: 'white',
            fontSize: 15, fontWeight: 700,
            cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: 'all 0.2s',
            marginBottom: 12
          }}
        >
          {loading ? 'Processing...' : `Pay ₦${PLANS[selectedPlan].price.toLocaleString()} — Unlock ${PLANS[selectedPlan].label}`}
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
          Secured by Paystack. Your payment is encrypted and safe.
        </p>
      </div>
    </div>
  )
}