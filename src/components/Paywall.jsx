import { useState } from 'react'
import { initializePaystackPayment } from '../lib/payment'

const PLANS = {
  BASIC: {
    label: 'Basic',
    price: 5000,
    badge: null,
    features: [
      'All 5 chapters generated',
      'Word document export',
      'Defense prep & flashcards',
      'Supervisor corrections',
      'Student breakdown & weak spots',
    ]
  },
  PRO: {
    label: 'Pro',
    price: 10000,
    badge: 'Most Popular',
    features: [
      'Everything in Basic',
      'AI Humanization (unlimited)',
      'AI-humanized to beat Turnitin',
      'Priority support',
    ]
  },
  PREMIUM: {
    label: 'Premium',
    price: 15000,
    badge: null,
    features: [
      'Everything in Pro',
      'Unlimited project regenerations',
      'Defense simulation with scoring',
      'Supervisor profile tracking',
    ]
  }
}

export default function Paywall({ projectInfo, onUnlock, userEmail, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('BASIC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = () => {
    setLoading(true)
    setError('')

    initializePaystackPayment({
      email: userEmail || '',
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
        } catch {
          setError('Could not verify payment. Contact support with reference: ' + reference)
          setLoading(false)
        }
      },
      onClose: () => setLoading(false)
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
        padding: '36px 28px',
        maxWidth: 540,
        width: '100%',
        border: '1px solid var(--border)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Close button */}
        {onClose && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'transparent', border: 'none',
            fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)',
            lineHeight: 1, padding: 4
          }}>✕</button>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎓</div>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, color: 'var(--text)', marginBottom: 6 }}>
            Unlock Your Full Project
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your Chapter 1 is ready. Choose a plan to unlock all 5 chapters.
          </p>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {Object.entries(PLANS).map(([key, plan]) => (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              style={{
                flex: 1,
                padding: '14px 10px',
                borderRadius: 14,
                border: `2px solid ${selectedPlan === key ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedPlan === key ? 'rgba(0,126,167,0.06)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                position: 'relative'
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent)', color: 'white', fontSize: 10,
                  fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  whiteSpace: 'nowrap', fontFamily: 'Geist, sans-serif'
                }}>
                  {plan.badge}
                </div>
              )}
              <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, marginBottom: 4 }}>
                {plan.label}
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
                ₦{plan.price.toLocaleString()}
              </p>
              {plan.features.map((f, i) => (
                <p key={i} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, lineHeight: 1.4 }}>
                  ✓ {f}
                </p>
              ))}
            </button>
          ))}
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
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            borderRadius: 100, border: 'none',
            background: loading ? 'var(--border)' : 'var(--accent)',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Geist, sans-serif',
            transition: 'all 0.2s', marginBottom: 10
          }}
        >
          {loading
            ? 'Processing...'
            : `Pay ₦${PLANS[selectedPlan].price.toLocaleString()} — Unlock ${PLANS[selectedPlan].label}`
          }
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
          Secured by Paystack. Your payment is encrypted and safe.
        </p>
      </div>
    </div>
  )
}