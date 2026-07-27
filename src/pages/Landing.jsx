import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import logoPrimary from '../assets/primary-logo.png';
import logoPrimaryW from '../assets/primary-logo-w.png';

const BASE_URL = import.meta.env.VITE_API_URL || ''

export default function Landing() {
  const navigate = useNavigate()
 const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user?.onboarded) {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    projects: 0,
    chapters: 0,
    users: 0,
    universities: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [openIndex, setOpenIndex] = useState(null);

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/stats`)
        const data = await res.json()
        if (data.success) {
          setStats(data.stats)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

<nav style={{
  position: 'sticky',
  top: 0,
  zIndex: 50,
  background: 'rgba(247,245,240,0.65)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.2)',
  padding: '0 24px',
  boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
}}>
  <div style={{
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    position: 'relative'
  }}>
    {/* Logo - Far Left */}
    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', zIndex: 60 }} onClick={() => navigate('/')}>
  <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>

    {/* Centered Nav Links */}
    <div className="hide-mobile" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 48,
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap'
    }}>
      {['Features', 'How it Works', 'Gallery', 'Pricing', 'FAQ'].map(label => {
        const href = label === 'Gallery' ? 'gallery-section' : label.toLowerCase().replace(/ /g, '-');
        return (
          <span key={label}
            onClick={() => document.getElementById(href)?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'color 0.15s',
              position: 'relative',
              paddingBottom: '4px',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {label}
            {/* Thin curved pencil underline */}
            <svg
              className="pencil-underline"
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: '0',
                width: '100%',
                height: '4px',
                transition: 'opacity 0.2s ease',
                opacity: 0,
              }}
              onMouseEnter={e => {
                const svg = e.currentTarget;
                svg.style.opacity = '1';
                const path = svg.querySelector('path');
                if (path) {
                  path.style.strokeDashoffset = '0';
                }
              }}
              onMouseLeave={e => {
                const svg = e.currentTarget;
                svg.style.opacity = '0';
                const path = svg.querySelector('path');
                if (path) {
                  path.style.strokeDashoffset = '30';
                }
              }}
            >
              <path
                d="M 2 4 Q 25 1, 50 4 T 98 3"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="30"
                strokeDashoffset="30"
                style={{
                  transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </svg>
          </span>
        );
      })}
    </div>

    {/* Right side buttons - Far Right */}
    <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {user ? (
        <>
          <button className="btn-ghost" style={{ fontSize: 14 }} onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="btn-primary" style={{ fontSize: 14 }} onClick={() => navigate('/start')}>New Project →</button>
        </>
      ) : (
        <>
          {/* Gallery Button (fluid fill hover) */}
          <button
            onClick={() => navigate('/gallery')}
            style={{
              position: 'relative',
              padding: '9px 22px',
              borderRadius: '100px',
              border: '1.5px solid var(--accent)',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Geist, sans-serif',
              overflow: 'hidden',
              transition: 'color 0.3s ease',
              zIndex: 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'white';
              const fill = e.currentTarget.querySelector('.fluid-fill');
              if (fill) fill.style.transform = 'translateX(0)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--accent)';
              const fill = e.currentTarget.querySelector('.fluid-fill');
              if (fill) fill.style.transform = 'translateX(-101%)';
            }}
          >
            <span className="fluid-fill" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'var(--accent)',
              transform: 'translateX(-101%)',
              transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              zIndex: -1,
              borderRadius: '100px',
            }} />
            Gallery
          </button>

          {/* Get Started Button (with arrow stretch) */}
          <button
            onClick={() => {
              if (!user) {
                navigate('/auth', { 
                  state: { 
                    mode: 'register', 
                    redirect: '/start',
                    message: 'Create a free account to start your project and save it anytime.'
                  } 
                })
              } else {
                navigate('/start')
              }
            }}
            className="btn-primary"
            style={{
              fontSize: 14,
              padding: '9px 22px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'gap 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.gap = '18px';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.gap = '8px';
            }}
          >
            Get Started
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
              transform: 'translateX(0)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            >→</span>
          </button>
        </>
      )}
    </div>

    {/* Mobile hamburger - unchanged */}
    <button className="show-mobile" onClick={() => setMobileMenuOpen(o => !o)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, zIndex: 60 }}>
      {mobileMenuOpen ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      )}
    </button>
  </div>

  {/* Mobile menu - same as before */}
  {mobileMenuOpen && (
    <>
      <div
        onClick={() => setMobileMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div style={{
        position: 'fixed', top: 70, left: 0, right: 0,
        background: 'rgba(247,245,240,0.98)',
        backdropFilter: 'blur(20px)',
        zIndex: 50, padding: '16px 24px 28px',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {['Features', 'How it Works', 'Gallery', 'Pricing', 'FAQ'].map(label => {
            const href = label === 'Gallery' ? 'gallery-section' : label.toLowerCase().replace(/ /g, '-');
            return (
              <button key={label}
                onClick={() => {
                  document.getElementById(href)?.scrollIntoView({ behavior: 'smooth' })
                  setMobileMenuOpen(false)
                }}
                style={{
                  padding: '16px 0', fontSize: 16, fontWeight: 500,
                  background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left',
                  color: 'var(--text)', fontFamily: 'Geist, sans-serif',
                }}>
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {user ? (
            <>
              <button className="btn-ghost" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }} style={{ width: '100%', justifyContent: 'center' }}>Dashboard</button>
              <button className="btn-primary" onClick={() => { navigate('/start'); setMobileMenuOpen(false) }} style={{ width: '100%', justifyContent: 'center' }}>New Project →</button>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => { navigate('/auth', { state: { mode: 'login' } }); setMobileMenuOpen(false) }} style={{ width: '100%', justifyContent: 'center' }}>Sign in</button>
              <button className="btn-primary" onClick={() => {
                if (!user) {
                  navigate('/auth', { state: { mode: 'register', redirect: '/start', message: 'Create a free account to start your project and save it anytime.' } })
                } else {
                  navigate('/start')
                }
              }} style={{ width: '100%', justifyContent: 'center' }}>
                Get Started →
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )}
</nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
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
            <button className="btn-primary" onClick={() => {
              if (!user) {
                navigate('/auth', { 
                  state: { 
                    mode: 'register', 
                    redirect: '/start',
                    message: 'Create a free account to start your project and save it anytime.'
                  } 
                })
              } else {
                navigate('/start')
              }
            }}
            style={{ fontSize: 17, padding: '15px 40px', boxShadow: '0 8px 32px rgba(108,99,255,0.35)' }}>
            Start My Project →
          </button>
          <button className="btn-ghost"
            onClick={() => navigate('/humanizer')}
            style={{ fontSize: 15, padding: '15px 28px' }}>
            Humanizer →
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Chapter 1 free · Full project from ₦5,000
        </p>

       {/* Hero card — Socratic Chat mockup (Responsive) */}
<div style={{ marginTop: 72, maxWidth: 780, margin: '72px auto 0', padding: '0 4px' }}>
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: 'clamp(16px, 4vw, 24px)',
    boxShadow: '0 8px 48px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  }}>
    {/* Fake browser bar */}
    <div style={{
      padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 20px)',
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ width: 'clamp(8px, 1.5vw, 10px)', height: 'clamp(8px, 1.5vw, 10px)', borderRadius: '50%', background: '#FF6058' }} />
      <div style={{ width: 'clamp(8px, 1.5vw, 10px)', height: 'clamp(8px, 1.5vw, 10px)', borderRadius: '50%', background: '#FFBD2E' }} />
      <div style={{ width: 'clamp(8px, 1.5vw, 10px)', height: 'clamp(8px, 1.5vw, 10px)', borderRadius: '50%', background: '#28CA41' }} />
      <div style={{
        flex: 1,
        background: 'var(--bg-card)',
        borderRadius: 6,
        height: 'clamp(22px, 3vw, 26px)',
        marginLeft: 12,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 'clamp(8px, 1.5vw, 12px)',
      }}>
        <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: 'var(--text-dim)' }}>gradely.ai/build</span>
      </div>
    </div>

    {/* Mock chat interface - Responsive */}
    <div style={{ padding: 'clamp(16px, 4vw, 24px)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 3vw, 16px)' }}>
      {/* AI message */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 12px)' }}>
        <div style={{
          width: 'clamp(28px, 5vw, 32px)',
          height: 'clamp(28px, 5vw, 32px)',
          borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(12px, 2vw, 14px)',
          fontWeight: 700,
          color: 'white',
          flexShrink: 0,
        }}>G</div>
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
          maxWidth: '85%',
        }}>
          <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', margin: 0, color: 'var(--text)', lineHeight: 1.5 }}>
            Hey! Let's build your project. Tell me in your own words: <strong>Why is this topic important right now?</strong>
          </p>
        </div>
      </div>

      {/* User message */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'flex-end' }}>
        <div style={{
          background: 'rgba(0,126,167,0.88)',
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
          maxWidth: '85%',
          color: 'white',
        }}>
          <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', margin: 0, lineHeight: 1.5 }}>
            Nigeria's cybersecurity is weak because the government doesn't fund NITDA properly, and hackers are stealing from banks without being caught.
          </p>
        </div>
      </div>

      {/* AI response */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 12px)' }}>
        <div style={{
          width: 'clamp(28px, 5vw, 32px)',
          height: 'clamp(28px, 5vw, 32px)',
          borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(12px, 2vw, 14px)',
          fontWeight: 700,
          color: 'white',
          flexShrink: 0,
        }}>G</div>
        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'clamp(12px, 3vw, 16px)',
          padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
          maxWidth: '85%',
        }}>
          <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', margin: 0, color: 'var(--text)', fontWeight: 600 }}>
            ✅ Section 1.1 is ready!
          </p>
          <p style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', margin: '6px 0 0', color: 'var(--text-muted)' }}>
            Nigeria's cybersecurity is weak because the government doesn't fund NITDA properly... [full paragraph]
          </p>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)', marginTop: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              padding: 'clamp(4px, 1vw, 4px) clamp(10px, 2vw, 12px)',
              borderRadius: 20,
              background: 'var(--success)',
              color: 'white',
              fontWeight: 600,
            }}>✓ Looks good</span>
            <span style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              padding: 'clamp(4px, 1vw, 4px) clamp(10px, 2vw, 12px)',
              borderRadius: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}>Edit</span>
            <span style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              padding: 'clamp(4px, 1vw, 4px) clamp(10px, 2vw, 12px)',
              borderRadius: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}>Regenerate</span>
          </div>
        </div>
      </div>

      {/* Progress bar - Responsive */}
      <div style={{
        marginTop: 'clamp(4px, 1vw, 8px)',
        padding: 'clamp(10px, 2vw, 12px) clamp(12px, 3vw, 16px)',
        background: 'var(--bg-elevated)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        <p style={{
          fontSize: 'clamp(10px, 1.5vw, 12px)',
          color: 'var(--text-dim)',
          fontWeight: 600,
          marginBottom: 'clamp(4px, 1vw, 6px)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>PROJECT PROGRESS</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 1vw, 6px)' }}>
          {['1.1 ✓', '1.2 ✓', '1.3 …', '2.1', '2.2'].map((label, i) => {
            const isDone = label.includes('✓');
            const isActive = label.includes('…');
            return (
              <span key={i} style={{
                fontSize: 'clamp(10px, 1.5vw, 11px)',
                padding: 'clamp(2px, 0.8vw, 2px) clamp(8px, 2vw, 10px)',
                borderRadius: 20,
                background: isDone ? 'var(--success)' : isActive ? 'var(--accent)' : 'var(--bg-card)',
                color: isDone || isActive ? 'white' : 'var(--text-dim)',
                border: !isDone && !isActive ? '1px solid var(--border)' : 'none',
                fontWeight: isDone || isActive ? 600 : 400,
              }}>
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  </div>
</div>

      </div>
    </section>

    {/* Stats bar — real data */}
    <section style={{ background: 'var(--text)', color: 'white' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap' }}>
        {[
          { value: loadingStats ? '...' : stats.projects, label: 'Projects Generated' },
          { value: loadingStats ? '...' : stats.chapters, label: 'Chapters Written' },
          { value: loadingStats ? '...' : stats.users, label: 'Students Helped' },
          { value: loadingStats ? '...' : stats.universities, label: 'Universities Supported' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: '1 1 140px', padding: '24px 16px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}>
            <p style={{ fontFamily: 'Melodrama, serif', fontSize: 36, fontWeight: 400, color: '#9AD1D4', marginBottom: 6 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Gallery section (subtle) */}
    {/* Gallery section (subtle) with flowing gradient background */}
<section id="gallery-section" style={{ 
  position: 'relative',
  padding: '80px 24px',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #e6f0f5 0%, #f7f5f0 50%, #f0edf5 100%)'
}}>
  {/* Decorative flowing line/pattern */}
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, var(--accent), var(--gold), var(--accent))',
    opacity: 0.3
  }} />
  <div style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, var(--gold), var(--accent), var(--gold))',
    opacity: 0.2
  }} />
  <div style={{ 
    maxWidth: 1100, 
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
    textAlign: 'center'
  }}>
    <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Community Showcase</p>
    <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
      See what others have built
    </h2>
    <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
      Explore completed projects published by students like you. Get inspired and see what's possible.
    </p>
    <button className="btn-ghost" onClick={() => navigate('/gallery')} style={{ fontSize: 15 }}>
      Explore Gallery →
    </button>
  </div>
</section>

    {/* How it works */}
    <section id="how-it-works" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>How It Works</p>
        <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 600, margin: '0 auto' }}>
          From blank page to defended project
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {[
          { 
            num: '01', 
            title: 'Tell us about your project', 
            desc: 'University, department, topic — takes under 5 minutes. Upload your guide or use ours.'
          },
          { 
            num: '02', 
            title: 'Write in your own voice', 
            desc: 'Answer trigger questions naturally in the Socratic chat. GradelyAI captures your style.'
          },
          { 
            num: '03', 
            title: 'Watch it come to life', 
            desc: 'All 5 chapters generated chapter by chapter, with humanization and citations preserved.'
          },
          { 
            num: '04', 
            title: 'Prepare for your defense', 
            desc: '20+ panel questions, flashcards, and weakness analysis — all tailored to your project.'
          },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            padding: '24px 28px',
            background: 'var(--bg-card)', borderRadius: 16,
            boxShadow: 'var(--shadow)', alignItems: 'flex-start'
          }}>
            <span style={{ fontFamily: 'Melodrama, serif', fontSize: 28, color: 'var(--accent)', lineHeight: 1 }}>{item.num}</span>
            <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, margin: 0 }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Features (unchanged but kept) */}
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

    {/* For who (unchanged) */}
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
            <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>

{/* Pricing */}
<section id="pricing" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing</p>
      <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 16, letterSpacing: '-0.02em' }}>
        Flexible plans that fit your budget
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Start with Chapter 1 for free. Upgrade when you're ready.
      </p>
    </div>

    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: 24, 
      maxWidth: 1000, 
      margin: '0 auto' 
    }}>
      {/* Free */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: '32px 28px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}>
        {/* Subtle grid background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />
        {/* Subtle wavy line overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          opacity: 0.3,
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Free</p>
          <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, marginBottom: 4 }}>₦0</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>One project fully covered</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 28 }}>Chapter 1 only</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {[
              ['Chapter 1 generated', true],
              ['Topic suggestions', true],
              ['Project structure', true],
              ['Chapters 2–5', false],
              ['Defense preparation', false],
              ['Word export', false],
              ['Humanization', false],
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
      </div>

      {/* Basic */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: '32px 28px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}>
        {/* Subtle grid background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />
        {/* Subtle wavy line overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
          opacity: 0.3,
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Basic</p>
          <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, marginBottom: 4 }}>₦5,000</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>One project fully covered</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 28 }}>All 5 chapters · no humanization</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {[
              'All 5 chapters generated',
              'Word document export',
              'Defense prep & flashcards',
              'Supervisor corrections',
              'Student breakdown & weak spots',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                <span style={{ color: 'var(--text)' }}>{f}</span>
              </div>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => navigate('/auth', { state: { mode: 'register' } })} style={{ width: '100%', justifyContent: 'center' }}>
            Get Basic →
          </button>
        </div>
      </div>

      {/* Pro */}
      <div style={{
        background: 'var(--text)',
        borderRadius: 20,
        padding: '32px 28px',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid var(--accent)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,126,167,0.25)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}>
        {/* Subtle grid background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />
        {/* Subtle wavy line overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #80CED7, transparent)',
          opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,126,167,0.3) 0%, transparent 70%)',
          top: -100, right: -100
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: '#9AD1D4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Pro</p>
          <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, color: 'white', marginBottom: 4 }}>₦10,000</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>One project fully covered</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>10,000 words · 1 month</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {[
              'All 5 chapters generated',
              'Personal Voice Mode',
              'Defense Q&A (20+ questions)',
              'Concept + Defense flashcards',
              'Panel weakness analysis',
              'Student-friendly breakdown',
              'Real academic references',
              'Word document export',
              'Full humanization (Turnitin-grade)',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: '#80CED7', fontWeight: 700 }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/auth', { state: { mode: 'register' } })} style={{
            width: '100%', padding: '13px', borderRadius: 100, border: 'none',
            background: 'white', color: 'var(--text)', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif'
          }}>
            Get Pro →
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' }}>
            • 10,000 words/month • Additional words at ₦0.70/word
          </p>
        </div>
      </div>

      {/* Premium */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20,
        padding: '32px 28px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}>
        {/* Subtle grid background pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(232,160,32,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,160,32,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />
        {/* Subtle wavy line overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(232,160,32,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Premium</p>
          <p style={{ fontFamily: 'Melodrama, serif', fontSize: 48, fontWeight: 400, marginBottom: 4 }}>₦15,000</p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>One project fully covered</p>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 28 }}>20,000 words · 1 month</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {[
              'All Pro features',
              '20,000 words/month',
              'Priority support',
              'Unlimited revisions',
              'Export to any format',
              'Custom citation styles',
              'Team collaboration (coming)',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>✓</span>
                <span style={{ color: 'var(--text)' }}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/auth', { state: { mode: 'register' } })} style={{
            width: '100%', padding: '13px', borderRadius: 100, border: 'none',
            background: 'var(--gold)', color: 'white', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Geist, sans-serif'
          }}>
            Get Premium →
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, textAlign: 'center' }}>
            • 20,000 words/month • Additional words at ₦0.60/word
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

    {/* Testimonials (unchanged) */}
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 80, alignItems: 'start' }}>
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
          { q: 'What is the free tier?', a: 'The free tier gives you full access to Chapter 1 generation, topic suggestions, and project structure — completely free, no card required. Upgrade to unlock the rest of your project and defense prep.' },
          { q: 'How does the word limit work?', a: 'Pro gives you 10,000 words per month, which covers a full project. If you need more, you can upgrade to Premium for 20,000 words, or purchase extra words at ₦0.70/word for Pro and ₦0.60/word for Premium.' },
        ].map((faq, index) => (
          <FAQItem
            key={index}
            q={faq.q}
            a={faq.a}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  </div>
  {/* BackToTop is now rendered once here, outside the loop */}
  <BackToTop />
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
          Chapter 1 free · Full project from ₦5,000
        </p>
      </div>
    </section>

    {/* Footer */}
    <footer style={{ background: '#001E2E', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
  <img src={logoPrimaryW} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 GradelyAI · Built for Nigerian students
        </p>
       <div style={{ display: 'flex', gap: 24 }}>
  <a href="/privacy" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Privacy</a>
  <a href="/terms" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Terms</a>
  <a href="/about" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>About</a>
</div>
      </div>
    </footer>
  </div>
  )
}

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '24px 0', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, background: 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Geist, sans-serif'
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>{q}</span>
        <span style={{
          fontSize: 20, color: 'var(--text-muted)', flexShrink: 0,
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(45deg)' : 'none',
          display: 'inline-block'
        }}>+</span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 24 }}>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>{a}</p>
        </div>
      )}
    </div>
  );
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