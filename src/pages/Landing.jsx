import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>


<nav style={{
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(247,245,240,0.92)', backdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)', padding: '0 40px'
}}>
  <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
    
    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>G</div>
      <span style={{ fontFamily: 'Melodrama, serif', fontSize: 20, color: 'var(--text)' }}>GradelyAI</span>
    </div>

    {/* Nav links */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
      {[
  { label: 'Features', href: 'features' },
  { label: 'How it Works', href: 'how-it-works' },
  { label: 'Pricing', href: 'pricing' },
  { label: 'FAQ', href: 'faq' }
].map(link => (
  <span key={link.label}
    onClick={() => document.getElementById(link.href)?.scrollIntoView({ behavior: 'smooth' })}
    style={{ fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
    {link.label}
  </span>
))}
    </div>

    {/* Right side */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {user ? (
        <>
            <button className="btn-ghost" style={{ fontSize: 14 }}
            onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn-primary" style={{ fontSize: 14 }}
            onClick={() => navigate('/start')}>
            New Project →
          </button>
        </>
      ) : (
        <>
          <button className="btn-ghost" style={{ fontSize: 14 }}
            onClick={() => navigate('/auth', { state: { mode: 'login' } })}>
            Sign in
          </button>
          <button className="btn-primary" style={{ fontSize: 14 }}
            onClick={() => navigate('/auth', { state: { mode: 'register' } })}>
            Get Started →
          </button>
        </>
      )}
    </div>

  </div>
</nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Gradient blob background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(135deg, #CCE8F0 0%, #F7F5F0 40%, #F0EDE8 100%)',
        }} />
        <div style={{
          position: 'absolute', width: 700, height: 500,
          borderRadius: '50%', filter: 'blur(80px)',
          background: 'radial-gradient(circle, rgba(0,126,167,0.25) 0%, transparent 70%)',
          top: -100, right: -100, zIndex: 0
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 400,
          borderRadius: '50%', filter: 'blur(60px)',
          background: 'radial-gradient(circle, rgba(232,160,32,0.2) 0%, transparent 70%)',
          bottom: -50, left: 100, zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '120px 24px 100px', textAlign: 'center' }}>

        
          {/* Headline */}
          <h1 style={{
            fontFamily: 'Melodrama, serif',
            fontSize: 'clamp(44px, 7vw, 88px)',
            fontWeight: 400, lineHeight: 1.0,
            color: 'var(--text)', marginBottom: 28,
            maxWidth: 800, margin: '0 auto 28px',
            letterSpacing: '-0.02em'
          }}>
            Your final year project,{' '}
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>done right.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'var(--text-muted)', maxWidth: 560,
            margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 400
          }}>
            GradelyAI co-builds your complete final year project with you — <i style={{ color: 'var(--accent)' }}>chapter by chapter</i> —
            then prepares you to defend every word with confidence.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <button className="btn-primary" onClick={() => navigate('/start')}
              style={{ fontSize: 16, padding: '15px 36px' }}>
              Start my project — it's free
            </button>
            <button className="btn-ghost" style={{ fontSize: 15, padding: '15px 28px' }}>
              See how it works
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Chapter 1 free · Full project from ₦5,000 · No subscription
          </p>

          {/* Hero card — centered product mockup */}
          <div style={{ marginTop: 72, maxWidth: 780, margin: '72px auto 0' }}>
            <div style={{
              background: 'var(--bg-card)', borderRadius: 24,
              boxShadow: '0 8px 48px rgba(0,0,0,0.1)',
              overflow: 'hidden', border: '1px solid var(--border)'
            }}>
              {/* Fake browser bar */}
              <div style={{ padding: '14px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF6058' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28CA41' }} />
                <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 6, height: 26, marginLeft: 12, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>gradely.ai/generate</span>
                </div>
              </div>
              {/* Mock generation screen */}
              <div style={{ padding: '32px', textAlign: 'left' }}>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16, fontWeight: 500 }}>GENERATING YOUR PROJECT</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { ch: 'Chapter 1: Introduction', status: 'done' },
                    { ch: 'Chapter 2: Literature Review', status: 'done' },
                    { ch: 'Chapter 3: Methodology', status: 'generating' },
                    { ch: 'Chapter 4: Results & Discussion', status: 'pending' },
                    { ch: 'Chapter 5: Conclusion', status: 'pending' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: 12,
                      background: item.status === 'generating' ? 'rgba(0,126,167,0.05)' : 'var(--bg-elevated)',
                      border: item.status === 'generating' ? '1px solid rgba(0,126,167,0.2)' : '1px solid transparent'
                    }}>
                      <span style={{ fontSize: 14, color: item.status === 'pending' ? 'var(--text-dim)' : 'var(--text)', fontWeight: item.status === 'generating' ? 600 : 400 }}>
                        {item.ch}
                      </span>
                      <span className={`chapter-pill ${item.status}`}>
                        {item.status === 'done' ? 'Done' : item.status === 'generating' ? 'Writing...' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: 'var(--text)', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap' }}>
          {[
            { value: '5', label: 'Chapter Generation' },
            { value: '20+', label: 'Panel Questions Prepared' },
            { value: '100+', label: 'Universities Supported' },
            { value: '₦5k', label: 'One-Time Price' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 160, padding: '32px 24px', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
            }}>
              <p style={{ fontFamily: 'Melodrama, serif', fontSize: 40, fontWeight: 400, color: '#9AD1D4', marginBottom: 6 }}>{s.value}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>How It Works</p>
            <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
              From blank page to defended project
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
              GradelyAI guides you through every step — picking a topic, building each chapter, and preparing you to answer every question your panel throws at you.
            </p>
            <button className="btn-primary" onClick={() => navigate('/start')} style={{ fontSize: 15 }}>
              Start now →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { num: '01', title: 'Tell us about your project', desc: 'University, department, topic — takes under 5 minutes.' },
              { num: '02', title: 'Write in your own voice', desc: 'Answer 5 trigger questions naturally. We capture your style.' },
              { num: '03', title: 'Watch it come to life', desc: 'All 5 chapters generated chapter by chapter, live.' },
              { num: '04', title: 'Prepare for your defense', desc: '20+ panel questions, flashcards, and weakness analysis.' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 20, padding: '20px 24px',
                background: 'var(--bg-card)', borderRadius: 16,
                boxShadow: 'var(--shadow)', alignItems: 'flex-start'
              }}>
                <span style={{ fontFamily: 'Melodrama, serif', fontSize: 28, color: 'var(--text-dim)', lineHeight: 1, minWidth: 36 }}>{item.num}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.title}</p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: 'var(--text)'}}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, color: '#9AD1D4', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Everything Included</p>
            <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 400, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 700, margin: '0 auto' }}>
              Not just a generator. A complete project system.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {[
  { title: '5-Chapter Generation', desc: 'Full introduction, literature review, methodology, results, and conclusion — structured exactly how your university requires.', tag: 'Core', glow: 'rgba(0,126,167,0.4)' },
  { title: 'Personal Voice Mode', desc: 'Your answers to 5 trigger questions teach GradelyAI your writing style. The project sounds like you wrote it.', tag: 'Unique', glow: 'rgba(232,160,32,0.35)' },
  { title: 'University Guide Database', desc: 'Project guides from UNILAG, FUTA, UI, Covenant, LASU, Bingham, UNN and more already in our system.', tag: 'Nigerian', glow: 'rgba(45,155,111,0.35)' },
  { title: 'Defense Preparation', desc: '20+ realistic panel questions with model answers based on your specific project. Know what they will ask.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
  { title: 'Smart Flashcards', desc: 'Concept cards and defense cards with a Q&A session. Rate yourself, track readiness, study the night before.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
  { title: 'Weakness Analysis', desc: 'GradelyAI reviews your project like a strict supervisor — flags every weak spot and how to respond.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
  { title: 'Student-Friendly Breakdown', desc: 'A plain-English version of your entire project. Read this and explain any section in your own words.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
  { title: 'Real Academic References', desc: 'References from real academic paper databases — not made up. Every citation is verifiable.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
  { title: 'Word Document Export', desc: 'Download a clean, properly formatted Word document ready for printing and binding. Title page included.', tag: 'Pro', glow: 'rgba(154,209,212,0.3)' },
].map((f, i) => (
  <div key={i} style={{
    padding: '32px 28px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'default',
    transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease',
  }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = `0 0 0 1px ${f.glow}, 0 8px 32px ${f.glow}`
      e.currentTarget.style.borderColor = 'transparent'
      e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
    }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{
        fontSize: 11, padding: '3px 10px', borderRadius: 100, fontWeight: 600,
        background: f.tag === 'Unique' ? 'rgba(232,160,32,0.15)' : f.tag === 'Nigerian' ? 'rgba(45,155,111,0.15)' : f.tag === 'Core' ? 'rgba(0,126,167,0.2)' : 'rgba(255,255,255,0.08)',
        color: f.tag === 'Unique' ? '#E8A020' : f.tag === 'Nigerian' ? '#4ADE80' : f.tag === 'Core' ? '#80CED7' : 'rgba(255,255,255,0.4)',
      }}>
        {f.tag}
      </span>
    </div>
    <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 10, lineHeight: 1.2 }}>{f.title}</h3>
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
  </div>
))}
          </div>
        </div>
      </section>

      {/* For who */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Who It's For</p>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Made for the Nigerian student experience
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { title: 'The deadline is in 3 weeks', desc: 'You have not started. Your supervisor keeps postponing. GradelyAI gets you from zero to a complete draft in one session.' },
            { title: "You wrote it but can't defend it", desc: 'You copied and pasted and now you are terrified of the panel. GradelyAI prepares you to answer every question confidently.' },
            { title: "You don't know what topic to pick", desc: 'GradelyAI suggests 5 relevant topics for your department with clear descriptions so you can make an informed choice.' },
            { title: 'Your supervisor keeps rejecting it', desc: "GradelyAI follows your department's exact project guide format — the structure your supervisor actually expects." },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', borderRadius: 20,
              padding: '32px 28px', boxShadow: 'var(--shadow)',
              border: '1.5px solid var(--border)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
              <h3 style={{ fontFamily: 'Geist, serif', fontSize: 22, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 60, alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</p>
              <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
                Simple. One-time. Worth it.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Less than the cost of printing and binding your project.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Free */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '32px 28px', boxShadow: 'var(--shadow)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Free</p>
                <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, marginBottom: 4 }}>₦0</p>
                <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 28 }}>No card required</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                  {[
                    ['Chapter 1 generated', true],
                    ['Topic suggestions', true],
                    ['Project structure', true],
                    ['Chapters 2–5', false],
                    ['Defense preparation', false],
                    ['Word export', false],
                  ].map(([f, included]) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                      <span style={{ color: included ? 'var(--success)' : 'var(--text-dim)', fontWeight: 700, fontSize: 16 }}>{included ? '✓' : '×'}</span>
                      <span style={{ color: included ? 'var(--text)' : 'var(--text-dim)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-ghost" onClick={() => navigate('/start')} style={{ width: '100%', justifyContent: 'center' }}>
                  Start free
                </button>
              </div>

              {/* Pro */}
              <div style={{
                background: 'var(--text)', borderRadius: 20, padding: '32px 28px',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,126,167,0.3) 0%, transparent 70%)',
                  top: -100, right: -100
                }} />
                <p style={{ fontSize: 13, color: '#9AD1D4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, position: 'relative' }}>Pro</p>
                <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, color: 'white', marginBottom: 4, position: 'relative' }}>₦5,000</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, position: 'relative' }}>One-time · No subscription</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, position: 'relative' }}>
                  {[
                    'All 5 chapters generated',
                    'Personal Voice Mode',
                    'Defense Q&A (20+ questions)',
                    'Concept + Defense flashcards',
                    'Panel weakness analysis',
                    'Student-friendly breakdown',
                    'Real academic references',
                    'Word document export',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                      <span style={{ color: '#80CED7', fontWeight: 700 }}>✓</span>
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/start')} style={{
                  width: '100%', padding: '13px', borderRadius: 100, border: 'none',
                  background: 'white', color: 'var(--text)', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', position: 'relative'
                }}>
                  Get full project →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Student Stories</p>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            What students are saying
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[
            { quote: 'I started on a Monday and defended on Friday. The panel asked 15 questions and I answered every single one. GradelyAI prepared me for all of them.', name: 'Tunde A.', detail: 'Computer Science · UNILAG' },
            { quote: 'My supervisor said it was one of the best structured projects she had seen from our department. I was proud because I actually understood every part.', name: 'Chioma E.', detail: 'Business Administration · Covenant University' },
            { quote: 'The flashcards saved me. The night before my defense I went through all the defense cards and the panel asked 8 of those exact questions. I was ready.', name: 'Emeka O.', detail: 'Information Technology · FUTA' },
          ].map((t, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '32px 28px', boxShadow: 'var(--shadow)' }}>
              <p style={{ fontFamily: 'Melodrama, serif', fontSize: 64, color: 'var(--accent)', lineHeight: 0.8, marginBottom: 20 }}>"</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24, color: 'var(--text)' }}>{t.quote}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                  {t.name[0]}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{t.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
            <div style={{ position: 'sticky', top: 80 }}>
              <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>FAQ</p>
              <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Questions students ask
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { q: 'Is this considered cheating?', a: 'GradelyAI is an AI co-supervisor — it helps you build and understand your project, not do it invisibly. The defense prep and study tools ensure you genuinely understand your work. How you use it is up to you.' },
                { q: 'Will my supervisor know AI was used?', a: 'GradelyAI captures your writing style through trigger questions and writes the project to sound like you. The Personal Voice Mode adjusts tone to match how you naturally write.' },
                { q: 'What if my university has a specific format?', a: "We have project guides from multiple Nigerian universities in our database. If yours isn't there, you can upload your department's guide during intake and GradelyAI will follow it exactly." },
                { q: 'What happens after I pay?', a: 'Payment is processed instantly via Paystack. Once confirmed, GradelyAI immediately continues generating the remaining 4 chapters, defense prep, flashcards, and Word export.' },
                { q: 'Can I use this for a research project, not just software?', a: 'Yes — GradelyAI supports all project types: pure research, software development, hardware projects, and mixed projects. The methodology and results chapters adapt to your specific type.' },
                { q: 'What if I already have a topic?', a: "Perfect — just type it in during intake. GradelyAI works with topics you already have or helps you choose one if you're still deciding." },
              ].map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

{/* Final CTA */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#003249' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #007EA7 0%, #003249 100%)'
        }} />
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          top: -200, right: -100
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em' }}>
            Your defense is closer than you think.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginBottom: 48, lineHeight: 1.7 }}>
            Start with Chapter 1 for free. See the quality for yourself before you pay a single naira.
          </p>
          <button onClick={() => navigate('/start')} style={{
            background: 'white', color: 'var(--text)', border: 'none',
            borderRadius: 100, padding: '16px 48px', fontSize: 17, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', transition: 'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            Start my project — free →
          </button>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
            No account needed · Chapter 1 free · Full project ₦5,000
          </p>
        </div>

            </section>

      {/* Footer */}
      <footer style={{ background: '#001E2E', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#007EA7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>G</div>
            <span style={{ fontFamily: 'Melodrama, serif', fontSize: 16, color: 'white' }}>GradelyAI</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            © 2025 GradelyAI · Built for Nigerian students · Your project. Done right.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

 

    </div>

  )
}
    

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '24px 0', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, background: 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'DM Sans, sans-serif'
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{q}</span>
        <span style={{ fontSize: 20, color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 24 }}>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
         <BackToTop />
    </div>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: 32, right: 32, zIndex: 1000,
        width: 48, height: 48, borderRadius: '50%',
        background: '#007EA7', color: 'white',
        border: '2px solid rgba(255,255,255,0.2)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700,
        boxShadow: '0 0px 11px rgba(0,126,167,0.4)',
        transition: 'all 0.2s',
        fontFamily: 'Geist, sans-serif',
        lineHeight: 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,126,167,0.6)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,126,167,0.4)'
      }}
    >
      ↑
    </button>
  )
}