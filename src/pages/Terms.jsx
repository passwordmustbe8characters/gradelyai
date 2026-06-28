import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logoPrimary from '../assets/primary-logo.png';

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

export default function Terms() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 48 }}>
          Last updated: June 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Section title="1. Acceptance of Terms">
            <p>By using GradelyAI ("the Service", "we", "our", "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.</p>
            <p style={{ marginTop: 12 }}>These Terms apply to all users of the platform, including students, supervisors, and any other visitors or contributors.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>GradelyAI provides AI-powered tools designed to assist Nigerian university students with project research, drafting, and defense preparation. While we strive for accuracy, please note the following:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>AI Output Disclaimer:</strong> Our AI generates content based on patterns and data; it may occasionally produce inaccuracies, "hallucinations," or non-existent citations. You are strictly responsible for verifying all facts, citations, and data generated.</li>
    <li><strong>Tool, Not Replacement:</strong> GradelyAI is a productivity tool, not a replacement for your own research or university requirements.</li>
    <li><strong>Core Features:</strong> Includes chapter generation, voice adaptation, defense prep, flashcards, and document export.</li>
              <li>Chapter-by-chapter project generation (5 chapters)</li>
              <li>Personal Voice Mode that adapts to your writing style</li>
              <li>Defense preparation with 20+ panel questions and model answers</li>
              <li>Smart flashcards for concept and defense review</li>
              <li>Weakness analysis and student-friendly breakdowns</li>
              <li>Word document export with proper formatting</li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>To access the Service, you must create an account. You agree to:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>Provide accurate and current information.</li>
    <li><strong>Account Security:</strong> You are responsible for all activity on your account. Sharing passwords, selling access, or using a single account for multiple students is strictly prohibited and grounds for immediate termination.</li>
    <li><strong>Suspicious Activity:</strong> We reserve the right to suspend or terminate accounts that exhibit automated scraping, suspicious bulk traffic, or misuse of our API credits.</li>
    <li>Notify us immediately of any unauthorized access.</li>
            </ul>
          </Section>

          <Section title="4. Payment and Pricing">
            <p>Payments are processed securely via our third-party payment partner, Monnify. By making a payment, you agree to the following:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
             <li><strong>Currency & Terms:</strong> All transactions are in Nigerian Naira (₦).</li>
    <li><strong>Third-Party Processing:</strong> Your payment data is handled by Monnify in accordance with their privacy policies. We do not store your full card details on our servers.</li>
    <li><strong>Chargebacks & Fraud:</strong> In the event of a chargeback or disputed transaction, you agree to cooperate with our fraud investigation procedures. Fraudulent disputes or attempts to bypass payment are grounds for account termination and potential legal action.</li>
    <li><strong>Pricing:</strong> Our current tiers are Free (₦0), Pro (₦10,000), and Premium (₦15,000). Prices may change with notice.</li>
              </ul>
            <p style={{ marginTop: 12 }}>All payments are processed securely through Monnify. Prices are in Nigerian Naira (₦) and are subject to change with prior notice.</p>
          </Section>

          <Section title="5. Refund Policy">
            <p>We want you to be satisfied with GradelyAI. Our refund policy is as follows:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Free Tier:</strong> No payment is required, so no refunds apply.</li>
              <li><strong>Pro and Premium:</strong> If you are not satisfied with the quality of your generated project, you may request a refund within 7 days of payment. Refunds are issued on a case-by-case basis and require reasonable justification.</li>
              <li>Refunds are not provided for projects that have been fully generated and exported.</li>
              <li>To request a refund, contact us at <a href="mailto:support@gradelyai.com" style={{ color: 'var(--accent)' }}>support@gradelyai.com</a>.</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p><strong>Your Content:</strong> You retain full ownership of all content you submit to GradelyAI, including your project text, answers to questions, and any other materials. We do not claim ownership of your work.</p>
            <p style={{ marginTop: 12 }}><strong>Our Content:</strong> The GradelyAI platform, including its design, branding, code, algorithms, and AI models, is the exclusive property of GradelyAI. You may not copy, modify, distribute, or reverse-engineer any part of the platform without our express written permission.</p>
          </Section>

          <Section title="7. Acceptable Use Policy">
            <p>You agree to use GradelyAI only for lawful purposes and in a manner that does not infringe on the rights of others. Specifically, you agree not to:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>Use the Service for any illegal or fraudulent activity.</li>
              <li>Submit content that is defamatory, obscene, threatening, or harassing.</li>
              <li>Attempt to gain unauthorized access to the platform or other users' accounts.</li>
              <li>Use the Service to generate content that plagiarizes or infringes on the intellectual property of others.</li>
              <li>Interfere with or disrupt the operation of the platform.</li>
            </ul>
          </Section>

          <Section title="8. Academic Integrity">
            <p>GradelyAI is designed as a learning and preparation tool, not as a substitute for your own work. We encourage you to:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>Use the generated content as a foundation to build your understanding.</li>
              <li>Review, edit, and personalize the content to reflect your own voice and ideas.</li>
              <li>Ensure that your final submission complies with your university's academic integrity policies.</li>
            </ul>
            <p style={{ marginTop: 12 }}>We are not responsible for how you use the content generated by the Service. You are solely responsible for ensuring that your use of the Service complies with your institution's rules.</p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li>The Service will meet your specific requirements or expectations.</li>
              <li>The Service will be uninterrupted, timely, secure, or error-free.</li>
              <li>The results obtained from the Service will be accurate, complete, or reliable.</li>
              <li>Any errors in the Service will be corrected.</li>
            </ul>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the fullest extent permitted by law, GradelyAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service. This includes, but is not limited to, damages for loss of profits, data, or other intangible losses.</p>
            <p style={{ marginTop: 12 }}>Our total liability to you for any claim arising out of these Terms shall not exceed the amount you paid to us for the Service in the 12 months preceding the claim.</p>
          </Section>

          <Section title="11. Indemnification">
            <p>You agree to indemnify and hold harmless GradelyAI and its affiliates, officers, employees, and agents from any claims, damages, losses, or expenses arising out of your use of the Service, your violation of these Terms, or your infringement of any rights of another party.</p>
          </Section>

          <Section title="12. Termination">
            <p>We reserve the right to suspend or terminate your account at our sole discretion, without prior notice, if you violate these Terms or engage in conduct that we believe is harmful to the platform or other users.</p>
            <p style={{ marginTop: 12 }}>Upon termination, you will lose access to your account and all associated data. We are not obligated to retain your data after termination.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts of Lagos, Nigeria.</p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>We may update these Terms from time to time. We will notify you of significant changes by email or through a notice on our platform. Your continued use of GradelyAI after such changes constitutes acceptance of the updated Terms.</p>
          </Section>

          <Section title="15. Contact Information">
            <p>If you have any questions or concerns about these Terms, please contact us at:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Email:</strong> <a href="mailto:support@gradelyai.com" style={{ color: 'var(--accent)' }}>support@gradelyai.com</a></li>
            </ul>
          </Section>
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-dim)' }}>
          <p>By using GradelyAI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#001E2E', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#007EA7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
            <span style={{ fontFamily: 'Melodrama, serif', fontSize: 16, color: 'white' }}>GradelyAI</span>
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