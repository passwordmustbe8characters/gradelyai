import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchProjects, deleteProject } from '../lib/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
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

  useEffect(() => {
  if (!user) {
    navigate('/auth')
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Top bar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(247,245,240,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '0 40px'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white' }}>G</div>
            <span style={{ fontFamily: 'Melodrama, serif', fontSize: 20, color: 'var(--text)' }}>GradelyAI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user?.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <button className="btn-ghost" onClick={handleLogout}
  style={{ fontSize: 13, transition: 'all 0.2s' }}
  onMouseEnter={e => {
    e.currentTarget.style.borderColor = 'var(--danger)'
    e.currentTarget.style.color = 'var(--danger)'
  }}
  onMouseLeave={e => {
    e.currentTarget.style.borderColor = 'var(--border)'
    e.currentTarget.style.color = 'var(--text-muted)'
  }}>
  Sign out
</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
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
          <button className="btn-primary" onClick={() => navigate('/start')}
            style={{ fontSize: 15, padding: '13px 28px', whiteSpace: 'nowrap' }}>
            + New Project
          </button>
        </div>

        {/* Stats row */}
        {projects.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
            {[
              {
                label: 'Total Projects',
                value: projects.length,
                color: 'var(--accent)'
              },
              {
                label: 'Completed',
                value: projects.filter(p => p.status === 'complete').length,
                color: 'var(--success)'
              },
              {
                label: 'In Progress',
                value: projects.filter(p => p.status === 'in_progress').length,
                color: '#E8A020'
              },
              {
                label: 'Avg Readiness',
                value: projects.length > 0
                  ? Math.round(projects.reduce((acc, p) => acc + (p.defense_readiness || 0), 0) / projects.length) + '%'
                  : '—',
                color: 'var(--text)'
              },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', borderRadius: 16,
                padding: '20px 24px', boxShadow: 'var(--shadow)'
              }}>
                <p style={{ fontFamily: 'Melodrama, serif', fontSize: 32, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Geist, sans-serif' }}>{s.label}</p>
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
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: 'var(--bg-card)', borderRadius: 24,
            boxShadow: 'var(--shadow)', border: '2px dashed var(--border)'
          }}>
            <p style={{ fontSize: 48, marginBottom: 20 }}>📄</p>
            <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>No projects yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
              Start your first final year project and it will appear here for you to come back to anytime.
            </p>
            <button className="btn-primary" onClick={() => navigate('/start')} style={{ fontSize: 15 }}>
              Start My First Project →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projects.map(project => (
              <div key={project.id} style={{
                background: 'var(--bg-card)', borderRadius: 20,
                padding: '24px 28px', boxShadow: 'var(--shadow)',
                border: '1.5px solid var(--border)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,126,167,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'var(--shadow)'
                }}>

                {/* Project info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
                      {project.title}
                    </h3>
                    <span style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 100, fontWeight: 600,
                      background: project.status === 'complete' ? 'rgba(45,155,111,0.1)' : 'rgba(0,126,167,0.1)',
                      color: getStatusColor(project.status)
                    }}>
                      {getStatusLabel(project.status)}
                    </span>
                    {project.is_paid ? (
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, fontWeight: 600, background: 'rgba(232,160,32,0.1)', color: '#E8A020' }}>
                        Pro
                      </span>
                    ) : null}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {project.department} · {project.university}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                    Last updated {new Date(project.updated_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Defense readiness */}
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <p style={{ fontFamily: 'Melodrama, serif', fontSize: 28, fontWeight: 700, color: getReadinessColor(project.defense_readiness), lineHeight: 1 }}>
                    {project.defense_readiness || 0}%
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Readiness</p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button className="btn-ghost"
                    onClick={() => {
                      sessionStorage.setItem('gradelyProjectId', project.id)
                      navigate('/results')
                    }}
                    style={{ fontSize: 13, padding: '8px 16px' }}>
                    View Project
                  </button>
                  <button className="btn-primary"
                    onClick={() => navigate('/flashcards')}
                    style={{ fontSize: 13, padding: '8px 16px' }}>
                    Study
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={deleting === project.id}
                    style={{
                      padding: '8px 12px', borderRadius: 100,
                      border: '1.5px solid rgba(217,79,79,0.2)',
                      background: 'transparent', color: 'var(--danger)',
                      cursor: 'pointer', fontSize: 13,
                      fontFamily: 'Geist, sans-serif',
                      transition: 'all 0.2s',
                      opacity: deleting === project.id ? 0.5 : 1
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(217,79,79,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {deleting === project.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}