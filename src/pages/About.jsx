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

export default function About() {
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
          About GradelyAI
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 48 }}>
          Built for Nigerian students, by Nigerian students.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Section title="Our Mission">
            <p>
              GradelyAI exists to solve one problem: <strong>Nigerian university students deserve to graduate with confidence.</strong>
            </p>
            <p style={{ marginTop: 12 }}>
              Every year, thousands of students struggle with their final year projects — not because they aren't capable, but because they don't have the right guidance, structure, or preparation. Supervisors are overworked, project guides are confusing, and the pressure of the defense panel is overwhelming.
            </p>
            <p style={{ marginTop: 12 }}>
              We built GradelyAI to change that. Our platform co-builds your project with you — chapter by chapter — and prepares you to defend every word with confidence.
            </p>
          </Section>

          <Section title="Who We Are">
            <p>
              GradelyAI was founded by a team of Nigerian graduates who remember exactly how stressful the final year project experience was. We've been in your shoes — the sleepless nights, the endless revisions, the fear of the panel.
            </p>
            <p style={{ marginTop: 12 }}>
              We're a remote-first team of engineers, designers, and educators based across Nigeria. We believe that technology can bridge the gap between what students need and what they actually get from the traditional system.
            </p>
            <p style={{ marginTop: 12 }}>
              Our advisors include academics from Nigerian universities who helped us ensure that GradelyAI follows the actual project standards expected by supervisors and departments.
            </p>
          </Section>

          <Section title="Why We Built It">
            <p>We built GradelyAI because we saw a real gap in the market:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Project guides are outdated:</strong> Many universities are still using project guides from 10+ years ago.</li>
              <li><strong>Supervisors are overloaded:</strong> One supervisor can have 30+ students. Quality feedback is rare.</li>
              <li><strong>Students don't know how to start:</strong> "Choose a topic" sounds simple until you realize you have no idea what makes a good topic.</li>
              <li><strong>The defense is terrifying:</strong> Students write decent projects but freeze when the panel starts asking questions.</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              GradelyAI addresses all of these problems. We guide you from topic selection to defense preparation — so you walk into that room knowing you're ready.
            </p>
          </Section>

          <Section title="What Makes Us Different">
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>🎯 Nigerian-First</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>We understand the Nigerian university system — the project guide formats, the supervisor expectations, the defense panel culture. We're not a generic AI tool; we're built for you.</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>🗣️ Your Voice, Not AI's</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Personal Voice Mode captures how you naturally write. The project sounds like you wrote it, not like a robot.</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>🛡️ Defense-Ready</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>We don't just co-write the project with you — we help you defend it. 20+ panel questions, flashcards, weakness analysis, and a plain-English breakdown.</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>💰 Affordable for Students</h4>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>We know student budgets are tight. That's why we offer a free tier and keep our Pro plan starting at ₦7,000 — less than the cost of printing and binding your project.</p>
              </div>
            </div>
          </Section>

          <Section title="Our Values">
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Integrity:</strong> We believe in academic honesty. GradelyAI is a tool to help you learn and prepare, not a shortcut to cheat.</li>
              <li><strong>Accessibility:</strong> Every Nigerian student deserves access to quality project guidance, regardless of their university or department.</li>
              <li><strong>Excellence:</strong> We hold ourselves to the highest standards — your project should be something you're proud to submit.</li>
              <li><strong>Community:</strong> We're building a community of students who support each other through the final year journey.</li>
            </ul>
          </Section>

          <Section title="What's Next">
            <p>We're just getting started. Here's what we're working on:</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>More University Guides:</strong> Adding project guides from more Nigerian universities.</li>
              <li><strong>Team Collaboration:</strong> Group projects made easier with shared workspaces.</li>
              <li><strong>Mobile App:</strong> Take GradelyAI with you anywhere.</li>
              <li><strong>Supervisor Tools:</strong> Tools for supervisors to review and provide feedback on student projects.</li>
            </ul>
          </Section>

          <Section title="Join the Community">
            <p>
              Thousands of students have already used GradelyAI to build and defend their projects. Whether you're just starting your final year or you're weeks away from your defense, we're here to help.
            </p>
            <p style={{ marginTop: 12 }}>
              Ready to get started? <a href="/start" style={{ color: 'var(--accent)', fontWeight: 600 }}>Start your project for free →</a>
            </p>
          </Section>

          <Section title="Contact Us">
            <p>Have questions, feedback, or just want to say hello? We'd love to hear from you.</p>
            <ul style={{ paddingLeft: 24, lineHeight: 1.8, color: 'var(--text-muted)' }}>
              <li><strong>Email:</strong> <a href="mailto:support@gradelyai.com" style={{ color: 'var(--accent)' }}>support@gradelyai.com</a></li>
              <li><strong>Twitter/X:</strong> <a href="#" style={{ color: 'var(--accent)' }}>@gradelyai</a></li>
              <li><strong>Instagram:</strong> <a href="#" style={{ color: 'var(--accent)' }}>@gradelyai</a></li>
              <li><strong>Response Time:</strong> We aim to respond within 24 hours.</li>
            </ul>
          </Section>
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