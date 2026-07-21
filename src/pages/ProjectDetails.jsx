import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import logoPrimary from '../assets/primary-logo.png';

const BASE_URL = import.meta.env.VITE_API_URL || ''

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  // Remove all markdown and formatting, leaving plain text
  const toPlainText = (text) => {
    if (!text) return ''
    let cleaned = text
      // Remove any line that starts with # (any number) followed by space
      .replace(/^#{1,6}\s+/gm, '')
      // Remove "Full Content" or "# Full Content" lines
      .replace(/^#?\s*Full Content\s*#?$/gim, '')
      // Remove bold/italic markers
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove inline code
      .replace(/`(.*?)`/g, '$1')
      // Remove horizontal rules
      .replace(/^[-*]{3,}\s*$/gm, '')
      // Normalize multiple line breaks to double (paragraph separator)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    return cleaned
  }

  useEffect(() => {
    fetch(`${BASE_URL}/api/project/${id}`)
      .then(res => res.json())
      .then(data => {
        setProject(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [id])

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading project details...</div>
  if (!project) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Project not found.</div>

  // Combine abstract and full content into one continuous text
  const fullText = [project.abstract, project.full_content].filter(Boolean).join('\n\n')
  const plainText = toPlainText(fullText)
  const paragraphs = plainText.split(/\n\n+/)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* --- STICKY NAVBAR --- */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(247,245,240,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,126,167,0.12)',
        boxShadow: '0 4px 30px rgba(0,126,167,0.10), 0 0 40px rgba(0,126,167,0.04)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
  <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>
          <Link to="/gallery" style={{
            fontSize: 14,
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: '40px',
            background: 'transparent',
            color: 'var(--text)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            ← Back to Gallery
          </Link>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '20px', boxShadow: 'var(--shadow)' }}>
          <h1 style={{ fontFamily: 'Melodrama, serif', fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>
            {project.title}
          </h1>
          <p style={{ marginBottom: '0.5rem' }}><strong>Publisher:</strong> {project.publisher_name || 'Anonymous'}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Department:</strong> {project.department}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>University:</strong> {project.university}</p>
          {project.supervisor_name && <p style={{ marginBottom: '1rem' }}><strong>Supervisor:</strong> {project.supervisor_name}</p>}
          
          <div style={{ 
            background: 'var(--bg-elevated)', 
            padding: '1.5rem', 
            borderRadius: '12px',
            fontFamily: 'Georgia, serif',
            lineHeight: 1.7,
            fontSize: '1rem',
            marginTop: '1.5rem'
          }}>
            {paragraphs.map((para, idx) => (
              <p key={idx} style={{ marginBottom: '1rem' }}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}