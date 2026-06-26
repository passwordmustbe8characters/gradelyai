import { useState } from 'react'
import { initiatePayment } from '../lib/payment'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// Tier definitions
const PLANS = {
  STANDARD: {
    price: 10000,
    label: 'Standard',
    features: ['All 5 chapters', 'Concept flashcards', 'Defense Q&A', 'Word export']
  },
  PREMIUM: {
    price: 15000,
    label: 'Premium',
    features: ['Everything in Standard', 'Personal Voice Mode', 'Panel Weakness Analysis', 'Priority support', 'Unlimited AI Rewrites']
  }
}

export default function Paywall({ projectInfo, onUnlock, userEmail }) {
  const [email, setEmail] = useState(userEmail || '')
  const [selectedPlan, setSelectedPlan] = useState('STANDARD')
  const [loading, setLoading] = useState(false)
  const [setError] = useState('')

  const handlePay = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    initiatePayment({
      email,
      amount: PLANS[selectedPlan].price,
      name: projectInfo?.name || 'Student',
      onSuccess: () => {
        setLoading(false)
        onUnlock()
      },
      onClose: () => setLoading(false)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,10,15,0.7)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', overflowY: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: 500, background: 'var(--bg-card)', borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 26, textAlign: 'center', marginBottom: 24 }}>Choose Your Plan</h2>

        {/* Plan Toggles */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {Object.keys(PLANS).map((plan) => (
            <button 
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              style={{
                flex: 1, padding: 16, borderRadius: 16, border: `2px solid ${selectedPlan === plan ? 'var(--accent)' : 'var(--border)'}`,
                background: selectedPlan === plan ? 'rgba(0,126,167,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'left'
              }}>
              <p style={{ fontWeight: 700, color: 'var(--text)' }}>{PLANS[plan].label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>₦{PLANS[plan].price.toLocaleString()}</p>
            </button>
          ))}
        </div>

        {/* Features List */}
        <div style={{ marginBottom: 24 }}>
          {PLANS[selectedPlan].features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: 'var(--success)' }}><CheckIcon /></span>
              <span style={{ fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Input & Action */}
        <input
          className="input"
          type="email"
          placeholder="yourname@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginBottom: 16, width: '100%' }}
        />

        <button
          className="btn-accent"
          onClick={handlePay}
          disabled={loading}
          style={{ width: '100%', padding: '14px' }}>
          {loading ? 'Processing...' : `Pay ₦${PLANS[selectedPlan].price.toLocaleString()} — Unlock ${PLANS[selectedPlan].label}`}
        </button>
      </div>
    </div>
  )
}