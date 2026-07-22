import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchProjects, deleteProject, fetchProject } from '../lib/auth'
import logoSubmark from '../assets/submark-logo.png'
import { initializePaystackPayment } from "../lib/payment";

const BASE_URL = import.meta.env.VITE_API_URL || ''
const UNLIMITED_PROJECTS_EMAIL = 'josephdelight87@gmail.com'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const loadProjects = async () => {
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch {
      console.error('Failed to load projects')
    }
    setLoading(false)
  }

  const handlePurchase = (amount, planName) => {
    if (!user?.email) return
    initializePaystackPayment({
      email: user.email,
      amount,
      onSuccess: async (reference) => {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('gradelyToken')
          const res = await fetch(`${BASE_URL}/api/payments/paystack/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ reference, purpose: 'credits', plan: planName })
          })
          const data = await res.json()
          if (data.success) {
            await refreshUser()
            alert(`✅ Payment verified — ${data.creditsAdded.toLocaleString()} humanization credits added.`)
          } else {
            alert(data.error || 'Payment verified but crediting failed. Please contact support.')
          }
        } catch (err) {
          console.error('Credit purchase verify error:', err)
          alert('Could not verify payment. Please contact support with your payment reference: ' + reference)
        }
      }
    })
  }
  
  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (user && user.onboarded === false) {
      navigate('/start')
      return
    }
    setTimeout(() => loadProjects(), 0)
  }, [user, navigate])

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteProject(id)
      setProjects(p => p.filter(proj => proj.id !== id))
    } catch {
      alert('Failed to delete project.')
    }
    setDeleting(null)
  }

  const handlePublish = async (projectId) => {
    try {
      const token = localStorage.getItem('gradelyToken')
      const res = await fetch(`${BASE_URL}/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      })
      const data = await res.json()
      if (res.ok) {
        alert('✅ Project published to gallery!')
      } else {
        alert(data.error || 'Failed to publish')
      }
    } catch {
      alert('Error publishing project')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getStatusColor = (status) => {
    if (status === 'complete') return 'var(--success)'
    if (status === 'in_progress') return 'var(--accent)'
    return 'var(--text-dim)'
  }

  const getStatusLabel = (status) => {
    if (status === 'complete') return 'Complete'
    if (status === 'in_progress') return 'In Progress'
    return 'Draft'
  }

  const getReadinessColor = (score) => {
    if (score >= 80) return 'var(--success)'
    if (score >= 60) return '#E8A020'
    return 'var(--danger)'
  }

  return (
    <>
      <style>{`
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: clamp(1.5rem, 5vw, 2.5rem);
          width: 100%;
        }
        .dash-nav { padding: 0 40px; }
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 48px; flex-wrap: wrap; gap: 20px; }
        .dash-project-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        
        @media (max-width: 768px) {
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-nav { padding: 0 20px !important; }
          .dash-header { flex-direction: column; }
          .dash-header button { width: 100%; justify-content: center; }
        }
        
        /* MOBILE OPTIMIZATION: Forced 2x2 grid so they are boxes, not huge full-width bars */
        @media (max-width: 480px) {
          .dash-stats-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 12px !important; 
          }
          .dash-stats-grid > div { 
            padding: 16px 12px !important; 
          }
          .dash-stats-grid p:first-of-type {
            font-size: 26px !important;
          }
          .dash-stats-grid p:last-of-type {
            font-size: 12px !important;
          }
          .dash-project-actions { width: 100%; margin-top: 12px; }
          .dash-project-actions button { flex: 1; justify-content: center; text-align: center; }
          .dash-nav { padding: 0 16px !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Top bar */}
        <nav className="dash-nav" style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(247,245,240,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
            <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <img src={logoSubmark} alt="GradelyAI" style={{ width: 32, height: 32 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 13, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
                Sign out
              </button>
            </div>
          </div>
        </nav>

        <div className="container" style={{ maxWidth: 1100, paddingTop: 48 }}>
          {/* Header */}
          <div className="dash-header">
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, marginBottom: 8, lineHeight: 1.1, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Geist, sans-serif', fontWeight: 400, color: 'var(--text)' }}>
                  {projects.length === 0 ? 'Hello,' : 'Welcome back,'}
                </span>
                <span style={{ fontFamily: 'Melodrama, serif', color: 'var(--accent)' }}>
                  {user?.name?.split(' ')[0]}.
                </span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
                {projects.length === 0
                  ? 'You have no projects yet. Start your first one below.'
                  : `You have ${projects.length} project${projects.length > 1 ? 's' : ''}.`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={() => navigate('/upload')} style={{ fontSize: 15, padding: '13px 24px', whiteSpace: 'nowrap' }}>
                Upload Existing Project
              </button>
              <button className="btn-primary" onClick={() => {
                const paidProjects = projects.filter(p => p.is_paid)
                const hasPremium = paidProjects.some(p => p.plan === 'PREMIUM')
                if (user?.email !== UNLIMITED_PROJECTS_EMAIL && paidProjects.length > 0 && !hasPremium) {
                  alert('You already have a paid project. Delete it, or upgrade it to Premium, to start a second one.')
                  return
                }
                navigate('/start?mode=new_project')
              }} style={{ fontSize: 15, padding: '13px 28px', whiteSpace: 'nowrap' }}>
                + New Project
              </button>
            </div>
          </div>

          {/* Stats row */}
          {projects.length > 0 && (
<div className="dash-stats-grid">
              {[
               { label: 'Total Projects', value: projects.length, color: 'var(--accent)' },
                { label: 'Completed', value: projects.filter(p => p.status === 'complete').length, color: 'var(--success)' },
                { label: 'Readiness', value: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.defense_readiness || 0), 0) / projects.length) + '%' : '—', color: 'var(--text)' },
              { 
  label: 'Humanization Credits', 
  value: user?.humanization_credits?.toLocaleString() || 0, 
  color: 'var(--success)', 
  isAction: true,
  // NEW: Updated to show a choice when clicked
  onClick: () => {
    const choice = prompt("Select Plan:\n1. Standard (10k NGN = 10k words)\n2. Premium (15k NGN = 20k words)\n\nEnter '1' or '2'");
    if (choice === '1') handlePurchase(10000, 'Standard Plan');
    else if (choice === '2') handlePurchase(15000, 'Premium Plan');
  }
},
              ].map((s, i) => (
                <div key={i} onClick={s.onClick} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow)',
                  cursor: s.isAction ? 'pointer' : 'default',
                  border: s.isAction ? '1px solid var(--accent)' : 'none'
                }}>
                  <p style={{ fontFamily: 'Melodrama, serif', fontSize: 32, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>
                    {s.label} {s.isAction && ' (Buy 10k)'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Projects list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--bg-card)', borderRadius: 24, boxShadow: 'var(--shadow)', border: '2px dashed var(--border)' }}>
              <p style={{ fontSize: 48, marginBottom: 20 }}>📄</p>
              <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>No projects yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>Start your first final year project and it will appear here for you to come back to anytime.</p>
              <button className="btn-primary" onClick={() => navigate('/start')} style={{ fontSize: 15 }}>Start My First Project →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', paddingBottom: 60 }}>
              {projects.map(project => (
                <div key={project.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 20,
                  padding: 'clamp(16px, 4vw, 20px)',
                  boxShadow: 'var(--shadow)',
                  border: '1.5px solid var(--border)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'clamp(12px, 3vw, 16px)',
                  width: '100%',
                  position: 'relative',
                }}>
                  {/* Top row: title + status + buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    width: '100%',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'Geist, sans-serif',
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        margin: 0,
                        minWidth: 0,
                        wordBreak: 'break-word',
                      }}>{project.title}</h3>
                      <span style={{
                        fontSize: 11,
                        padding: '2px 10px',
                        borderRadius: 100,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        background: project.status === 'complete' ? 'rgba(45,155,111,0.1)' : 'rgba(0,126,167,0.1)',
                        color: getStatusColor(project.status),
                      }}>{getStatusLabel(project.status)}</span>
                      {!!project.is_paid && (
                        <span style={{
                          fontSize: 11,
                          padding: '2px 10px',
                          borderRadius: 100,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          background: 'rgba(232,160,32,0.1)',
                          color: '#E8A020',
                        }}>Pro</span>
                      )}
                    </div>

                    {/* Buttons on the right */}
                    <div className="dash-project-actions">
                      <button className="btn-ghost" onClick={async () => {
                        try {
                          const proj = await fetchProject(project.id)
                          const safeParseJSON = (val, fallback) => {
  if (!val) return fallback
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return fallback }
}

const resultData = {
  projectInfo: safeParseJSON(proj.project_info, {}),
  structure: safeParseJSON(proj.structure, {}),
  chapters: safeParseJSON(proj.chapters, []),
  abstract: proj.abstract || '',
  references: safeParseJSON(proj.refs, []),
  dbProjectId: proj.id,
  isPaidUser: proj.is_paid === 1,
  correctionsHistory: safeParseJSON(proj.corrections_history, {}),
  source: proj.source,
}
                          sessionStorage.setItem('gradelyResult', JSON.stringify(resultData))
                          if (proj.is_paid) sessionStorage.setItem('gradelyPaid', JSON.stringify({ paid: true }))
                          navigate('/results')
                        } catch (err) { alert('Failed to load project: ' + err.message) }
                      }} style={{ fontSize: 12, padding: '6px 14px' }}>View</button>
                      
                      {(() => {
                        const isComplete = project.status === 'complete'
                        return (
                          <button
                            onClick={() => isComplete ? handlePublish(project.id) : null}
                            className="btn-accent"
                            disabled={!isComplete}
                            title={isComplete ? 'Publish to gallery' : 'Complete all chapters to publish'}
                            style={{
                              fontSize: 12, padding: '6px 14px',
                              opacity: isComplete ? 1 : 0.4,
                              cursor: isComplete ? 'pointer' : 'not-allowed',
                            }}>
                            Publish
                          </button>
                        )
                      })()}
                    <button onClick={() => handleDelete(project.id)} disabled={deleting === project.id} style={{
                        padding: '6px 12px',
                        borderRadius: 100,
                        border: '1.5px solid var(--danger)',
                        background: 'rgba(217,79,79,0.08)',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'Geist, sans-serif',
                        transition: 'all 0.2s',
                        opacity: deleting === project.id ? 0.5 : 1,
                      }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,79,79,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {deleting === project.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: details left, readiness right */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: 12,
                    width: '100%',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                        {project.department} · {project.university}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '4px 0 0' }}>
                        Last updated {new Date(project.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Readiness score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{
                        fontFamily: 'Melodrama, serif',
                        fontSize: 28,
                        fontWeight: 700,
                        color: getReadinessColor(project.defense_readiness),
                        lineHeight: 1,
                        margin: 0,
                      }}>{project.defense_readiness || 0}%</p>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', margin: '4px 0 0' }}>Readiness</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}