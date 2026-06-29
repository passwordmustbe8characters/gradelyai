import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoPrimary from '../assets/primary-logo.png';
import logoPrimaryW from '../assets/primary-logo-w.png';

// Custom hook for window size
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return size
}

export default function Privacy() {
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const isMobile = width < 640

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* --- Sticky Navbar with mobile back button --- */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(247,245,240,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,126,167,0.12)',
        boxShadow: '0 4px 30px rgba(0,126,167,0.10), 0 0 40px rgba(0,126,167,0.04)',
        padding: `0 ${isMobile ? '16px' : '24px'}`,
        height: isMobile ? '56px' : '64px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
  <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>

          {isMobile ? (
            <button 
              onClick={() => navigate('/')} 
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#1a1a1a',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 500,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)'
              }}
            >
              ←
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => navigate('/')} style={{ fontSize: 14, fontWeight: 500 }}>
              ← Back to Home
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 100px' }}>
        <h1 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 48 }}>
          Last updated: June 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Section title="1. Information We Collect">
            <p>GradelyAI collects the following types of information to provide and improve our services:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Personal Information:</strong> Name, email address, university, department, and other details you provide during registration and project intake.</li>
              <li><strong>Project Content:</strong> All text, answers to trigger questions, and project-related content you submit to GradelyAI for generation and processing.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including pages visited, features used, and time spent.</li>
              <li><strong>Payment Information:</strong> Payment processing is handled by Moniepoint. We do not store your full payment card details on our servers.</li>
              <li><strong>Device Information:</strong> Browser type, IP address, operating system, and device identifiers for analytics and security purposes.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>Generate your project chapters and related content (defense questions, flashcards, analysis).</li>
              <li>Personalize your experience — the project is written in your voice based on your answers.</li>
              <li>Process payments and manage your account.</li>
              <li>Process KYC (Know Your Customer) verification and fraud prevention; as required by the agreement with our payment partner, Monnify.</li>
              <li>Improve our AI models and platform performance.</li>
              <li>Send you important updates about your project, account, and new features.</li>
              <li>Respond to your support requests and feedback.</li>
            </ul>
          </Section>

          <Section title="3. Data Storage and Security">
            <p>We take data security seriously:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>All data is encrypted in transit using SSL/TLS and at rest using industry-standard encryption.</li>
              <li>Access to user data is restricted to authorized personnel only.</li>
              <li>We regularly review our security practices to protect against unauthorized access, alteration, or destruction.</li>
              <li>In the event of a data breach, we will notify affected users within 72 hours of discovery.</li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            <p>We retain your data for as long as your account is active or as needed to provide you with services. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or regulatory purposes.</p>
          </Section>

          <Section title="5. Sharing Your Information">
            <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Service Providers:</strong> With trusted third-party vendors who help us operate our platform (e.g., Moniepoint for payments, hosting providers). These parties are bound by strict confidentiality obligations.</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal requests from authorities.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction.</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations).</li>
              <li><strong>Portability:</strong> Request a transfer of your data to another service.</li>
              <li><strong>Objection:</strong> Object to certain processing activities, including marketing communications.</li>
            </ul>
            <p style={{ marginTop: 12 }}>To exercise any of these rights, contact us at <a href="mailto:support@getgradely.xyz" style={{ color: 'var(--accent)' }}>support@getgradely.xyz</a>.</p>
          </Section>

          <Section title="7. Cookies and Tracking">
            <p>We use cookies and similar tracking technologies to enhance your experience, analyze usage, and improve our platform. You can control cookie preferences through your browser settings. Essential cookies are required for the platform to function properly.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>GradelyAI is not intended for users under the age of 16. We do not knowingly collect personal information from minors. If we discover that we have inadvertently collected such data, we will delete it promptly.</p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>Your data may be transferred to and processed in countries outside your country of residence. We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our platform. Your continued use of GradelyAI after such changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Email:</strong> <a href="mailto:support@getgradely.xyz" style={{ color: 'var(--accent)' }}>support@getgradely.xyz</a></li>
          <li><strong>Response Time:</strong> We aim to respond to all privacy-related inquiries within 48 hours.</li>
            </ul>
          </Section>
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)' }}>
          <p>GradelyAI is committed to protecting your privacy and ensuring transparency in how we handle your data.</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#001E2E', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
           <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={logoPrimaryW} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
          </div>

          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>© 2026 GradelyAI · Built for Nigerian students</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms</a>
            <a href="/about" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>About</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 400, marginBottom: 12, color: 'var(--text)' }}>{title}</h2>
      <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}