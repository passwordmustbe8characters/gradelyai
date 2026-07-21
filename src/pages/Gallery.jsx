import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchableSelect from '../components/SearchableSelect'
import { NIGERIAN_UNIVERSITIES, DEPARTMENTS_BY_FACULTY } from '../lib/universities'
import logoPrimary from '../assets/primary-logo.png';

// Flatten departments from faculties into a single array
const ALL_DEPARTMENTS = Object.values(DEPARTMENTS_BY_FACULTY).flat()
const BASE_URL = import.meta.env.VITE_API_URL || ''

// Custom hook to get window size
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

export default function Gallery() {
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState({ department: '', university: '', topic: '' })
  const [page, setPage] = useState(1)
  const limit = 12
  const loaderRef = useRef(null)

  // Breakpoints
  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024

  // Determine grid columns
  let gridCols
  if (isMobile) gridCols = '1fr'
  else if (isTablet) gridCols = 'repeat(2, 1fr)'
  else gridCols = 'repeat(auto-fill, minmax(320px, 1fr))'

  // Fetch projects
  const fetchProjects = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      const params = new URLSearchParams({ ...filters, page: currentPage, limit })
      const res = await fetch(`${BASE_URL}/api/gallery?${params}`)
      const data = await res.json()
      const newProjects = data.projects || []
      
      if (reset) {
        setProjects(newProjects)
        setPage(1)
      } else {
        setProjects(prev => [...prev, ...newProjects])
        setPage(currentPage + 1)
      }
      
      setHasMore(newProjects.length === limit)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, page, limit])

  // Initial fetch & filter changes
  useEffect(() => {
    // Avoid calling setState synchronously within an effect to prevent cascading renders.
    // Schedule the fetch to run after the current render frame.
    const t = setTimeout(() => fetchProjects(true), 0)
    return () => clearTimeout(t)
  }, [filters, fetchProjects])

  // Infinite scroll
  useEffect(() => {
    if (!isMobile) return // Only on mobile
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProjects()
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [isMobile, hasMore, loadingMore, loading, fetchProjects])

  const handleDepartmentChange = (val) => {
    setFilters(prev => ({ ...prev, department: val === 'All Departments' ? '' : val }))
  }

  const handleUniversityChange = (val) => {
    setFilters(prev => ({ ...prev, university: val === 'All Universities' ? '' : val }))
  }

  const handleTopicChange = (e) => {
    setFilters(prev => ({ ...prev, topic: e.target.value }))
  }

  // Extract top keywords from project (for bubbles)
  const getKeywords = (project) => {
    const text = (project.title + ' ' + (project.project_topic || '') + ' ' + (project.abstract || '')).toLowerCase()
    const stopWords = ['the', 'of', 'and', 'a', 'to', 'in', 'for', 'is', 'on', 'that', 'by', 'with', 'are', 'as', 'be', 'at', 'or', 'this', 'system', 'development', 'network', 'authentication']
    const words = text.split(/\W+/).filter(w => w.length > 3 && !stopWords.includes(w))
    const freq = {}
    words.forEach(w => freq[w] = (freq[w] || 0) + 1)
    const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1])
    return sorted.slice(0, 3).map(kw => kw[0])
  }

  return (
    <div className="gallery-page" style={{ 
      padding: '0', 
      background: 'var(--bg)', 
      minHeight: '100vh',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* --- GLOW GRADIENT EFFECTS --- */}
      <div style={{
        position: 'absolute',
        width: isMobile ? '400px' : '600px',
        height: isMobile ? '400px' : '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,126,167,0.20) 0%, transparent 70%)',
        top: '-200px',
        right: isMobile ? '-100px' : '-150px',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div style={{
        position: 'absolute',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,126,167,0.15) 0%, transparent 70%)',
        bottom: '-150px',
        left: isMobile ? '-80px' : '-100px',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        width: isMobile ? '500px' : '800px',
        height: isMobile ? '500px' : '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(154,209,212,0.08) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* --- GLOSSY-BLUR STICKY NAVBAR --- */}
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
        height: isMobile ? '52px' : '64px',
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
          {/* Logo: show only the "G" icon on mobile, full logo otherwise */}
         <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
  <img src={logoPrimary} alt="GradelyAI" style={{ height: '28px', width: 'auto' }} />
</div>
          
          {/* Back button: circular black button at top-right on mobile */}
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
                fontSize: 18,
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
              ✕
            </button>
          ) : (
            <button 
              className="btn-ghost" 
              onClick={() => navigate('/')} 
              style={{ 
                fontSize: 14, 
                fontWeight: 500,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ← Back
            </button>
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="container" style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: `${isMobile ? '1rem' : '2rem'} ${isMobile ? '16px' : '24px'}`, 
        position: 'relative', 
        zIndex: 1 
      }}>
        {/* Header - compressed height on mobile but with subtitle */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '1rem' : '2rem',
          padding: `${isMobile ? '0.75rem 0.75rem' : '2rem 1rem'}`,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(0,126,167,0.06) 0%, rgba(154,209,212,0.10) 100%)',
          border: '1px solid rgba(0,126,167,0.08)',
          backdropFilter: 'blur(4px)',
          position: 'relative',
        }}>
          <h1 style={{ 
            fontFamily: 'Melodrama, serif', 
            fontSize: isMobile ? '1.5rem' : isTablet ? '2.6rem' : '3rem', 
            fontWeight: 700, 
            color: 'var(--accent)', 
            marginBottom: isMobile ? '0.25rem' : '0.5rem',
            textShadow: '0 0 40px rgba(0,126,167,0.15)',
            lineHeight: 1.2,
          }}>
            Published Projects Gallery
          </h1>
          {/* Subtitle brought back on mobile */}
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: isMobile ? '0.8rem' : isTablet ? '1rem' : '1.1rem',
            marginBottom: 0,
          }}>
            Explore final year projects completed by students using GradelyAI
          </p>
          {/* Subtle underline glow */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '-8px' : '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? '40%' : '60%',
            height: isMobile ? '2px' : '4px',
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            opacity: 0.2,
            borderRadius: '4px',
          }} />
        </div>

        {/* Filters Row - stack on mobile */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: isMobile ? '0.6rem' : '1rem', 
          marginBottom: isMobile ? '1rem' : '2rem',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '0.25rem 0',
        }}>
          <div style={{ 
            minWidth: isMobile ? '100%' : isTablet ? '200px' : '220px', 
            flex: isMobile ? '1 1 100%' : 1,
          }}>
            <SearchableSelect
              options={['All Departments', ...ALL_DEPARTMENTS]}
              value={filters.department || 'All Departments'}
              onChange={handleDepartmentChange}
              placeholder="Select department"
            />
          </div>
          <div style={{ 
            minWidth: isMobile ? '100%' : isTablet ? '200px' : '220px', 
            flex: isMobile ? '1 1 100%' : 1,
          }}>
            <SearchableSelect
              options={['All Universities', ...NIGERIAN_UNIVERSITIES]}
              value={filters.university || 'All Universities'}
              onChange={handleUniversityChange}
              placeholder="Select university"
            />
          </div>
          <div style={{ 
            minWidth: isMobile ? '100%' : isTablet ? '200px' : '250px', 
            flex: isMobile ? '1 1 100%' : 1,
          }}>
            <input
              type="text"
              placeholder="Search by topic..."
              value={filters.topic}
              onChange={handleTopicChange}
              className="input"
              style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '12px' }}
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading && projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>No projects published yet.</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: gridCols, 
            gap: isMobile ? '0.8rem' : '1.5rem' 
          }}>
            {projects.map((project) => (
              <div key={project.id} className="card" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                padding: isMobile ? '0.85rem' : '1.5rem',
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}>
                <div>
                  <h2 style={{ 
                    fontSize: isMobile ? '0.95rem' : '1.5rem', 
                    fontWeight: 700, 
                    color: 'var(--accent)', 
                    marginBottom: '0.4rem',
                    lineHeight: 1.3
                  }}>
                    {project.title}
                  </h2>
                  <p style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <strong>Publisher:</strong> {project.publisher_name || 'Anonymous'}
                  </p>
                  <p style={{ fontSize: isMobile ? '0.65rem' : '0.85rem', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>
                    {project.department} • {project.university}
                    {project.supervisor_name && <span> • Supervisor: {project.supervisor_name}</span>}
                  </p>
                  <p style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: 'var(--text)', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                    {project.abstract?.length > 120 ? project.abstract.substring(0, 120) + '...' : project.abstract}
                  </p>
                  {/* Keyword bubbles */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {getKeywords(project).map(kw => (
                      <span key={kw} style={{
                        background: 'rgba(0,126,167,0.12)',
                        color: 'var(--accent)',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: isMobile ? '0.6rem' : '0.75rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}>
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                    Published: {new Date(project.published_at).toLocaleDateString()}
                  </span>
                  <Link 
                    to={`/project/${project.id}`} 
                    className="btn-accent" 
                    style={{ 
                      fontSize: isMobile ? '1rem' : '0.85rem', 
                      padding: isMobile ? '0.2rem 0.5rem' : '0.4rem 0.8rem',
                      borderRadius: '20px',
                      background: 'var(--accent)',
                      color: 'white',
                      textDecoration: 'none',
                      fontWeight: 600,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infinite scroll loader (mobile only) */}
        {isMobile && (
          <div ref={loaderRef} style={{ 
            textAlign: 'center', 
            padding: '1.5rem 0',
            minHeight: '60px',
          }}>
            {loadingMore && <span style={{ color: 'var(--text-muted)' }}>Loading more projects...</span>}
            {!hasMore && projects.length > 0 && (
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                ✦ You've seen all {projects.length} projects ✦
              </span>
            )}
          </div>
        )}

        {/* Pagination - desktop only */}
        {!isMobile && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem', 
            marginTop: '2.5rem',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => {
                if (page > 1) {
                  setPage(p => p - 1)
                  fetchProjects(true)
                }
              }}
              disabled={page === 1}
              className="btn-ghost"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.6rem 1.2rem',
                borderRadius: '40px',
                fontSize: '1rem',
              }}
            >
              ← Previous
            </button>
            <span style={{ 
              padding: '0.5rem 1rem', 
              background: 'var(--bg-elevated)', 
              borderRadius: '40px', 
              minWidth: '70px', 
              textAlign: 'center',
              fontSize: '1rem',
            }}>
              {page}
            </span>
            <button
              onClick={() => {
                if (hasMore) {
                  setPage(p => p + 1)
                  fetchProjects(true)
                }
              }}
              disabled={!hasMore}
              className="btn-ghost"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.6rem 1.2rem',
                borderRadius: '40px',
                fontSize: '1rem',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}