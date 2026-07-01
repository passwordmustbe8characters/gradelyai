import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socraticChat, generateProjectStructure } from '../lib/ai'
import { useAuth } from '../lib/AuthContext'
import { createProject, updateProject, fetchProject } from '../lib/auth'
import logoSubmark from '../assets/submark-logo.png'; // Import your Submark icon or image


// ─── WINDOW SIZE HOOK ─────────────────────────────────────────────────────────
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STORAGE_KEY_CHAT = 'gradelyChatHistory'
const STORAGE_KEY_SECTIONS = 'gradelyCompletedSections'
const STORAGE_KEY_SECTION_INDEX = 'gradelySectionIndex'

// ─── PROGRESS LIST COMPONENT ──────────────────────────────────────────────────
const ProgressList = ({ chapters, completedSections, sectionIndexMap, onSectionClick }) => (
  <>
    {chapters.length > 0 ? (
      chapters.map(ch => (
        <div key={ch.number || ch.title}>
          <div className="sb-chapter-label">Chapter {ch.number}: {ch.title}</div>
          {(ch.subsections || []).map(sec => {
            const sectionTitle = typeof sec === 'string' ? sec : sec.title
            const secNum = sectionTitle.split(' ')[0]
            const isReady = completedSections.includes(secNum)
            const messageIndex = sectionIndexMap[secNum]
            return (
              <div
                key={sectionTitle}
                className={`sb-section-item ${isReady ? 'done' : 'pending'}`}
                onClick={() => onSectionClick && onSectionClick(secNum, messageIndex)}
                style={{ cursor: messageIndex !== undefined ? 'pointer' : 'default' }}
              >
                <span className={`sb-section-text ${isReady ? 'done' : 'pending'}`}>{sectionTitle}</span>
                {isReady && <span className="sb-section-check">✓</span>}
              </div>
            )
          })}
        </div>
      ))
    ) : (
      <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No project structure found.</p>
    )}
  </>
)



// ─── STYLES (unchanged – keep your existing CSS) ────────────────────────────
const styles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
  @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-5px); } }
  @keyframes pulse-ring { 0%,100% { box-shadow:0 4px 18px rgba(0,126,167,0.28), 0 0 0 0 rgba(0,126,167,0.22); } 50% { box-shadow:0 4px 18px rgba(0,126,167,0.28), 0 0 0 6px rgba(0,126,167,0); } }
  @keyframes highlightFlash { 0% { background-color:rgba(0,126,167,0.15); } 100% { background-color:transparent; } }

  .sb-root { display:flex; height:100vh; height:100dvh; background:var(--bg); font-family:'Geist',sans-serif; position:relative; overflow:hidden; }
  .sb-root::before { content:''; position:fixed; top:-15%; left:-8%; width:520px; height:520px; background:radial-gradient(circle,rgba(0,157,201,0.10) 0%,transparent 68%); pointer-events:none; z-index:0; }
  .sb-root::after { content:''; position:fixed; bottom:-20%; right:-8%; width:440px; height:440px; background:radial-gradient(circle,rgba(232,160,32,0.08) 0%,transparent 65%); pointer-events:none; z-index:0; }

  .sb-sidebar { display:flex; flex-direction:column; flex-shrink:0; background:rgba(240,237,232,0.65); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border-right:1px solid var(--border-light); transition:width 0.3s ease,padding 0.3s ease,transform 0.3s ease; overflow:hidden; position:relative; z-index:1; width:280px; }
  .sb-sidebar.collapsed { width:140px; }
  .sb-sidebar.mobile { position:fixed; left:0; top:0; bottom:0; z-index:60; transform:translateX(-100%); transition:transform 0.3s ease; border-right:1px solid var(--border); box-shadow:4px 0 30px rgba(0,0,0,0.1); width:280px !important; }
  .sb-sidebar.mobile.open { transform:translateX(0); }
  .sb-sidebar.mobile .sb-sidebar-body { display:block !important; }
  .sb-sidebar.mobile .sb-sidebar-header { justify-content:space-between !important; }

  .sb-overlay { display:none; position:fixed; inset:0; z-index:55; background:rgba(13,13,12,0.35); backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); animation:fadeUp 0.2s ease forwards; }
  .sb-overlay.open { display:block; }

  .sb-sidebar-header { display:flex; align-items:center; height:64px; padding:0 16px; flex-shrink:0; border-bottom:1px solid var(--border-light); background:rgba(247,245,240,0.82); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
  .sb-sidebar-header .sb-logo { display:flex; align-items:center; gap:8px; cursor:pointer; font-family:'Melodrama',serif; font-size:18px; color:var(--text); text-decoration:none; white-space:nowrap; overflow:hidden; }
  .sb-sidebar-header .sb-logo .sb-logo-icon { width:32px; height:32px; border-radius:8px;  display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
  .sb-sidebar-header .sb-logo .sb-logo-text { transition:opacity 0.2s; }
  .sb-sidebar-header .sb-header-actions { display:flex; gap:6px; flex-shrink:0; }
  .sb-sidebar-header .sb-header-actions button { width:36px; height:36px; border-radius:8px; border:1px solid var(--border); background:rgba(255,255,255,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text-muted); transition:all 0.2s; }
  .sb-sidebar-header .sb-header-actions button:hover { background:var(--bg-card); border-color:var(--text-dim); color:var(--text); }
  .sb-sidebar-header .sb-header-actions button.active { color:var(--accent); border-color:rgba(0,126,167,0.25); background:rgba(0,126,167,0.06); }

  .sb-sidebar-body { flex:1; overflow-y:auto; padding:8px 16px 20px; scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
  .sb-sidebar-body::-webkit-scrollbar { width:3px; }
  .sb-sidebar-body::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  .sb-sidebar.collapsed .sb-sidebar-body { display:none; }

  .sb-chapter-label { font-size:10.5px; text-transform:uppercase; letter-spacing:1.3px; color:var(--text-dim); font-weight:600; margin-top:20px; margin-bottom:9px; padding-left:2px; }
  .sb-section-item { padding:11px 14px; border-radius:var(--radius-sm); margin-bottom:6px; border:1px solid; display:flex; justify-content:space-between; align-items:center; transition:all 0.22s ease; backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); }
  .sb-section-item.done { border-color:rgba(45,155,111,0.22); background:rgba(45,155,111,0.06); box-shadow:0 2px 10px rgba(45,155,111,0.07); }
  .sb-section-item.pending { border-color:var(--border-light); background:rgba(255,255,255,0.55); box-shadow:0 1px 6px rgba(0,0,0,0.03); }
  .sb-section-item.pending:hover { border-color:var(--border); background:rgba(255,255,255,0.80); box-shadow:0 2px 10px rgba(0,0,0,0.06); transform:translateX(2px); }
  .sb-section-item.done:hover { background:rgba(45,155,111,0.10); }
  .sb-section-text { font-size:13px; font-weight:500; }
  .sb-section-text.done { color:var(--success); }
  .sb-section-text.pending { color:var(--text-muted); }
  .sb-section-check { font-size:12px; color:var(--success); }

  .sb-chat-panel { flex:1; display:flex; flex-direction:column; position:relative; z-index:1; min-width:0; background:var(--bg); }

  .sb-header { height:64px; padding:0 24px; border-bottom:1px solid var(--border-light); background:rgba(247,245,240,0.82); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); display:flex; justify-content:space-between; align-items:center; gap:16px; flex-shrink:0; }
  .sb-header-left { display:flex; align-items:center; gap:8px; min-width:0; flex:1; }
  .sb-header-text-wrapper { display:flex; flex-direction:column; min-width:0; flex:1; }
  .sb-header-topic { font-size:15px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .sb-header-type { font-size:12px; color:var(--text-muted); font-weight:400; }
  .sb-header-type .sb-type-label { color:var(--accent); font-weight:500; }
  .sb-header-actions { display:flex; gap:10px; align-items:center; flex-shrink:0; }
  .sb-header-actions .sb-save-exit-btn { padding:8px 20px; border-radius:40px; border:none; background:#1a1a1a; color:white; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Geist',sans-serif; box-shadow:0 2px 10px rgba(0,0,0,0.08); }
  .sb-header-actions .sb-save-exit-btn:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.15); }
  .sb-header-actions .sb-menu-btn { display:none; width:36px; height:36px; border-radius:8px; border:1px solid var(--border); background:rgba(255,255,255,0.5); cursor:pointer; align-items:center; justify-content:center; color:var(--text-muted); transition:all 0.2s; flex-shrink:0; }
  .sb-header-actions .sb-menu-btn:hover { background:var(--bg-card); border-color:var(--text-dim); color:var(--text); }

  .sb-messages-wrapper { flex:1; overflow-y:auto; padding:20px 24px 16px; display:flex; flex-direction:column; align-items:center; scrollbar-width:thin; scrollbar-color:var(--border) transparent; }
  .sb-messages-wrapper::-webkit-scrollbar { width:4px; }
  .sb-messages-wrapper::-webkit-scrollbar-track { background:transparent; }
  .sb-messages-wrapper::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

  .sb-messages-container { max-width:800px; width:100%; display:flex; flex-direction:column; gap:20px; }

  .sb-section-progress { background:rgba(0,126,167,0.06); border:1px solid rgba(0,126,167,0.14); border-radius:12px; padding:10px 16px; display:flex; align-items:center; gap:12px; font-size:13px; color:var(--text-muted); margin-bottom:8px; flex-shrink:0; }
  .sb-section-progress .sb-section-progress-label { font-weight:600; color:var(--text); }
  .sb-section-progress .sb-section-progress-status { margin-left:auto; font-weight:600; }
  .sb-section-progress .sb-section-progress-status.done { color:var(--success); }

  .sb-msg-row { display:flex; animation:fadeUp 0.28s ease forwards; }
  .sb-msg-row.user { justify-content:flex-end; }
  .sb-msg-row.assistant { justify-content:flex-start; }

  .sb-bubble { max-width:78%; padding:15px 20px; font-size:14.5px; line-height:1.68; position:relative; }
  .sb-bubble.user { background:rgba(0,126,167,0.88); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border:1px solid rgba(0,157,201,0.3); color:#fff; border-radius:18px 18px 4px 18px; box-shadow:0 4px 20px rgba(0,126,167,0.22), inset 0 1px 0 rgba(255,255,255,0.15); }
  .sb-bubble.assistant { background:rgba(255,255,255,0.72); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(229,224,216,0.8); color:var(--text); border-radius:18px 18px 18px 4px; box-shadow:0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9); transition:border-color 0.2s, box-shadow 0.2s; }
  .sb-bubble.assistant.editing { border-color:var(--accent); box-shadow:0 0 0 3px rgba(0,126,167,0.12), 0 4px 20px rgba(0,0,0,0.08); }
  .sb-bubble.assistant.highlight { animation:highlightFlash 1s ease 2; }

  .sb-bubble .sb-edit-pencil { position:absolute; bottom:4px; right:8px; background:rgba(255,255,255,0.85); border:1px solid var(--border); border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; transition:all 0.2s; opacity:0; font-size:12px; }
  .sb-bubble.assistant:hover .sb-edit-pencil { opacity:1; }
  .sb-bubble.assistant .sb-edit-pencil:hover { background:var(--accent); color:white; border-color:var(--accent); }
  .sb-bubble .sb-edit-area { margin-top:12px; padding-top:12px; border-top:1px solid var(--border-light); }
  .sb-bubble .sb-edit-area textarea { width:100%; padding:10px; border-radius:10px; border:1.5px solid var(--border); background:rgba(255,255,255,0.9); font-size:14px; font-family:'Geist',sans-serif; resize:vertical; min-height:80px; outline:none; transition:border-color 0.2s; }
  .sb-bubble .sb-edit-area textarea:focus { border-color:var(--accent); }
  .sb-bubble .sb-edit-actions { display:flex; gap:8px; margin-top:8px; }
  .sb-bubble .sb-edit-actions button { padding:6px 16px; border-radius:20px; border:none; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
  .sb-bubble .sb-edit-actions .sb-edit-save { background:var(--accent); color:white; }
  .sb-bubble .sb-edit-actions .sb-edit-save:hover { background:var(--accent-light); }
  .sb-bubble .sb-edit-actions .sb-edit-cancel { background:var(--bg-elevated); color:var(--text-muted); }
  .sb-bubble .sb-edit-actions .sb-edit-cancel:hover { background:var(--border); }
  .sb-bubble .sb-edit-actions .sb-edit-generate { background:rgba(0,126,167,0.08); color:var(--accent); border:1px solid rgba(0,126,167,0.2); }
  .sb-bubble .sb-edit-actions .sb-edit-generate:hover { background:rgba(0,126,167,0.15); }

  .sb-draft-block { background:rgba(0,126,167,0.04); border:1px solid rgba(0,126,167,0.14); padding:16px 18px; border-radius:var(--radius-sm); margin:12px 0; white-space:pre-wrap; line-height:1.75; color:var(--text); font-size:13.5px; box-shadow:inset 0 1px 0 rgba(0,126,167,0.06); }
  .sb-draft-outro { margin-top:10px; color:var(--success); font-weight:600; font-size:13px; white-space:pre-wrap; }

  .sb-typing { display:flex; align-items:center; gap:10px; color:var(--text-dim); font-size:13px; font-style:italic; padding-left:4px; }
  .sb-typing-dots { display:flex; gap:5px; }
  .sb-typing-dot { width:5px; height:5px; border-radius:50%; background:var(--accent); opacity:0.55; animation:float 1.1s ease-in-out infinite; }
  .sb-typing-dot:nth-child(2) { animation-delay:0.18s; }
  .sb-typing-dot:nth-child(3) { animation-delay:0.36s; }

  .sb-quick-replies { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-light); }
  .sb-quick-reply-btn { padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:rgba(255,255,255,0.6); font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; color:var(--text-muted); display:inline-flex; align-items:center; gap:6px; }
  .sb-quick-reply-btn:hover { background:var(--bg-card); border-color:var(--accent); color:var(--accent); }
  .sb-quick-reply-btn.success { border-color:var(--success); color:var(--success); }
  .sb-quick-reply-btn.success:hover { background:rgba(45,155,111,0.08); }

  .sb-input-area { padding:18px 28px 22px; background:rgba(247,245,240,0.75); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid var(--border-light); flex-shrink:0; display:flex; flex-direction:column; align-items:center; }
  .sb-input-inner { max-width:800px; width:100%; }
  .sb-input-row { display:flex; align-items:flex-end; gap:12px; width:100%; position:relative; }
  .sb-textarea-wrap { flex:1; position:relative; width:100%; }
  .sb-textarea { width:100%; padding:14px 56px 14px 18px; border-radius:16px; border:1.5px solid var(--border); background:rgba(255,255,255,0.78); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); color:var(--text); font-size:14.5px; font-family:'Geist',sans-serif; resize:none; outline:none; min-height:58px; box-sizing:border-box; transition:border-color 0.2s,box-shadow 0.2s; line-height:1.6; box-shadow:0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9); }
  .sb-textarea::placeholder { color:var(--text-dim); }
  .sb-textarea:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(0,126,167,0.10), 0 2px 10px rgba(0,0,0,0.04); }

  .sb-send-btn { border-radius:100px; border:none; font-size:14px; font-weight:600; font-family:'Geist',sans-serif; cursor:pointer; transition:all 0.2s ease; white-space:nowrap; padding:14px 24px; flex-shrink:0; }
  .sb-send-btn.active { background:var(--accent); color:white; animation:pulse-ring 3s infinite; }
  .sb-send-btn.active:hover { background:var(--accent-light); transform:translateY(-1px); box-shadow:0 6px 24px rgba(0,126,167,0.38); }
  .sb-send-btn.inactive { background:var(--bg-elevated); color:var(--text-dim); cursor:not-allowed; border:1.5px solid var(--border); }

  .sb-send-btn-mobile { position:absolute; bottom:10px; right:10px; width:38px; height:38px; border-radius:50%; border:none; background:var(--accent); color:white; font-size:18px; cursor:pointer; display:none; align-items:center; justify-content:center; transition:all 0.2s; box-shadow:0 2px 10px rgba(0,126,167,0.25); }
  .sb-send-btn-mobile:hover { transform:scale(1.05); box-shadow:0 4px 16px rgba(0,126,167,0.35); }
  .sb-send-btn-mobile:disabled { background:var(--bg-elevated); color:var(--text-dim); cursor:not-allowed; box-shadow:none; }
  .sb-send-btn-mobile .arrow-up { display:inline-block; transform:rotate(0deg); line-height:1; }

  .sb-search-overlay { display:none; position:fixed; inset:0; z-index:100; background:rgba(13,13,12,0.35); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); animation:fadeUp 0.2s ease forwards; justify-content:center; align-items:flex-start; padding-top:80px; }
  .sb-search-overlay.open { display:flex; }
  .sb-search-modal { background:var(--bg-card); border-radius:20px; max-width:600px; width:90%; max-height:70vh; box-shadow:0 20px 60px rgba(0,0,0,0.2); display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--border); }
  .sb-search-modal .sb-search-input-wrap { padding:16px 20px; border-bottom:1px solid var(--border-light); display:flex; align-items:center; gap:12px; }
  .sb-search-modal .sb-search-input-wrap input { flex:1; border:none; outline:none; font-size:16px; font-family:'Geist',sans-serif; background:transparent; color:var(--text); }
  .sb-search-modal .sb-search-input-wrap input::placeholder { color:var(--text-dim); }
  .sb-search-modal .sb-search-input-wrap .sb-search-close { cursor:pointer; color:var(--text-muted); font-size:18px; }
  .sb-search-results { flex:1; overflow-y:auto; padding:8px 0; }
  .sb-search-results .sb-search-result-item { padding:12px 20px; cursor:pointer; border-bottom:1px solid var(--border-light); transition:background 0.15s; }
  .sb-search-results .sb-search-result-item:hover { background:rgba(0,126,167,0.05); }
  .sb-search-results .sb-search-result-item .sb-search-result-preview { font-size:13px; color:var(--text); line-height:1.5; }
  .sb-search-results .sb-search-result-item .sb-search-result-preview .highlight { background:rgba(232,160,32,0.25); padding:0 2px; border-radius:2px; }
  .sb-search-results .sb-search-result-item .sb-search-result-meta { font-size:11px; color:var(--text-dim); margin-top:4px; }
  .sb-search-results .sb-search-no-results { padding:24px; text-align:center; color:var(--text-dim); font-size:14px; }

  @media (max-width:768px) {
    .sb-root { flex-direction:column; }
    .sb-sidebar { display:none !important; }
    .sb-sidebar.mobile { display:flex !important; }
    .sb-header { height:56px; padding:0 12px; }
    .sb-sidebar-header { height:56px; }
    .sb-header-left { display:flex; flex-direction:row; align-items:center; gap:8px; flex:1; min-width:0; }
    .sb-header-actions .sb-menu-btn { display:flex !important; flex-shrink:0; }
    .sb-header-text-wrapper { display:flex; flex-direction:column; min-width:0; flex:1; }
    .sb-header-topic { font-size:13px; max-width:140px; flex-shrink:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sb-header-type { font-size:10px; flex-shrink:0; white-space:nowrap; }
    .sb-header-actions .sb-save-exit-btn { padding:6px 14px; font-size:12px; }
    .sb-messages-wrapper { padding:12px 12px 8px; }
    .sb-bubble { max-width:88%; padding:12px 15px; font-size:14px; }
    .sb-input-area { padding:10px 12px 14px; }
    .sb-textarea { font-size:13px; padding:12px 48px 12px 14px; min-height:50px; }
    .sb-send-btn-desktop { display:none !important; }
    .sb-send-btn-mobile { display:flex !important; }
    .sb-search-overlay { padding-top:60px; }
    .sb-search-modal { max-width:95%; max-height:80vh; }
    .sb-quick-reply-btn { font-size:11px; padding:4px 10px; }
  }
  @media (max-width:380px) {
    .sb-header-topic { max-width:80px; font-size:12px; }
    .sb-header-type { font-size:9px; }
    .sb-header-actions .sb-save-exit-btn { padding:4px 10px; font-size:11px; }
    .sb-bubble { padding:10px 12px; font-size:13px; }
    .sb-textarea { font-size:12px; padding:10px 44px 10px 12px; min-height:44px; }
    .sb-send-btn-mobile { width:34px; height:34px; font-size:16px; bottom:8px; right:8px; }
  }
`

// ─── ICONS ──────────────────────────────────────────────────────────────────
const PanelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="10.5" y1="1.5" x2="10.5" y2="14.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
    <line x1="12.5" y1="12.5" x2="16.5" y2="16.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
)

// ─── PARSE AI RESPONSE (single source of truth) ───────────────────────────────
function parseAIResponse(raw) {
  let clean = raw
    .replace(/\*\*Yes,\s*looks\s*good\*\*\s*\|?/gi, '')
    .replace(/\*\*No,\s*let\s*me\s*edit\*\*\s*\|?/gi, '')
    .replace(/\*\*Regenerate\*\*/gi, '')
    .replace(/Yes,\s*looks\s*good\./gi, '')
    .replace(/No,\s*let\s*me\s*edit\./gi, '')
    .replace(/Regenerate\./gi, '')
    .replace(/\*\*Please review this section\.\*\*/gi, '')
    .replace(/\|/g, '')
    .replace(/\*\*/g, '')
    .replace(/Does it capture your main point correctly\?[\s\S]*?(?=\n\n|$)/i, '')
    .trim()

  if (clean.includes('[CHAPTER_1_COMPLETE]')) {
    return { type: 'complete', content: clean.replace('[CHAPTER_1_COMPLETE]', '').trim() }
  }


 if (clean.includes('[STUCK_EXAMPLE]')) {
    const exampleText = clean.split('[STUCK_EXAMPLE]')[1].split('[/STUCK_EXAMPLE]')[0].trim()
    return { type: 'stuck_example', content: '', exampleText }
  }

  if (clean.includes('[SECTION_DRAFT]')) {
    const [intro, rest] = clean.split('[SECTION_DRAFT]')
    const [draftContent, outro = ''] = rest.split('[/SECTION_DRAFT]')
    const trimmedIntro = intro.trim()
    const trimmedDraft = draftContent.trim()
    const sectionMatch = trimmedIntro.match(/(\d+\.\d+)/) || trimmedDraft.match(/(\d+\.\d+)/)
    return {
      type: 'draft',
      content: trimmedIntro,
      draftContent: trimmedDraft,
      outro: outro.trim(),
      sectionNumber: sectionMatch?.[1] || null,
    }
  }

  if (clean.includes('[HINTS]')) {
    const [mainText, hintBlock] = clean.split('[HINTS]')
    const hints = hintBlock.split('[/HINTS]')[0].split('|').map(h => h.trim()).filter(Boolean)
    return { type: 'hints', content: mainText.trim(), hints }
  }

  return { type: 'question', content: clean }
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SocraticBuilder() {
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const { user, markOnboarded } = useAuth()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingStructure, setIsLoadingStructure] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [editingMessageIndex, setEditingMessageIndex] = useState(null)
  const [editContent, setEditContent] = useState('')
  const chatEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const projectCreatedRef = useRef(false)

  const isMobile = width < 768

  // Calculate if we should show the full logo
const showFullLogo = sidebarOpen && !isMobile;

  let savedResult = null
  let savedProjectInfo = null
  try {
    const res = sessionStorage.getItem('gradelyResult')
    if (res) savedResult = JSON.parse(res)
    const proj = sessionStorage.getItem('gradelyProject')
    if (proj) savedProjectInfo = JSON.parse(proj)
  } catch (e) { console.error(e) }

  const projectData = {
    topic: savedResult?.projectInfo?.topic || savedProjectInfo?.topic || "Your Project Topic",
    type: savedResult?.projectInfo?.projectType || savedProjectInfo?.projectType || "Research",
    chapters: savedResult?.structure?.chapters || [],
    references: savedResult?.references || []
  }

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CHAT)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SECTIONS)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const [sectionIndexMap, setSectionIndexMap] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SECTION_INDEX)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  // ─── HYDRATE FROM DB IF LOCAL SESSION IS EMPTY ─────────────────────────────
  useEffect(() => {
    const hydrateFromDb = async () => {
      if (messages.length > 0) return
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
      const dbProjectId = currentResult.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
      if (!dbProjectId) return
      try {
        const proj = await fetchProject(dbProjectId)
        if (proj?.chat_history) {
          const restoredMessages = JSON.parse(proj.chat_history)
          if (restoredMessages.length > 0) {
            setMessages(restoredMessages)
            setCompletedSections(proj.completed_sections ? JSON.parse(proj.completed_sections) : [])
            setSectionIndexMap(proj.section_index_map ? JSON.parse(proj.section_index_map) : {})
          }
        }
      } catch (err) {
        console.error('[Gradely] Failed to hydrate chat from DB:', err)
      }
    }
    hydrateFromDb()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── DERIVED: current section ──────────────────────────────────────────────
  const allSections = projectData.chapters.flatMap(ch =>
    (ch.subsections || []).map(sec => {
      const title = typeof sec === 'string' ? sec : sec.title
      const num = title.split(' ')[0]
      return { number: num, title }
    })
  )
  const completedSet = new Set(completedSections)
  const currentSection = allSections.find(s => !completedSet.has(s.number)) || null

  // ─── PERSISTENCE ─────────────────────────────────────────────────────────────
 const syncTimerRef = useRef(null)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages))
    sessionStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(completedSections))
    sessionStorage.setItem(STORAGE_KEY_SECTION_INDEX, JSON.stringify(sectionIndexMap))

    const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
    const dbProjectId = currentResult.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')
    if (!dbProjectId || messages.length === 0) return

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      updateProject(dbProjectId, {
        chat_history: messages,
        completed_sections: completedSections,
        section_index_map: sectionIndexMap,
      }).catch(err => console.error('[Gradely] Chat sync failed:', err))
    }, 2000)

    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [messages, completedSections, sectionIndexMap])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ─── Auto‑resize textarea on mobile ────────────────────────────────────────
  useEffect(() => {
    if (isMobile && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input, isMobile])

  // ─── INIT PROJECT ──────────────────────────────────────────────────────────
  useEffect(() => {
    const initProject = async () => {
      if (savedResult?.structure?.chapters?.length > 0) {
        setIsLoadingStructure(false)
        if (messages.length === 0) {
          const firstPrompt = `Hey! I've analyzed your project guide for "${projectData.topic}". Let's build Chapter 1: Introduction. To start with Section 1.1 (Background), tell me in your own words: Why is this topic important right now?`
          setMessages([{ role: 'assistant', content: firstPrompt }])
        }
        return
      }
      setIsLoadingStructure(true)
      try {
        const projInfo = savedProjectInfo || {}
        const structure = await generateProjectStructure(projInfo)
        const newResult = {
          ...projInfo,
          structure,
          chapters: structure.chapters.map(ch => ({ ...ch, content: '' })),
          abstract: '',
          references: [],
          projectInfo: projInfo,
          humanized: false
        }
        sessionStorage.setItem('gradelyResult', JSON.stringify(newResult))
        window.location.reload()
      } catch (err) {
        console.error('Failed to generate structure:', err)
        alert('Failed to generate project structure. Please try again.')
        navigate('/start')
      } finally {
        setIsLoadingStructure(false)
      }
    }
    initProject()
  }, []) // eslint-disable-line

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null
  const lastMessageWasDraft = lastMsg?.role === 'assistant' && lastMsg?.type === 'draft'
  const isChapter1Complete = messages.some(m => m.type === 'complete')
  const isAskingForTopic = () => lastMsg?.role === 'assistant' && lastMsg?.type === 'question'
  const showStuckButton = isAskingForTopic()


// ─── AUTO-SAVE PROJECT ON FIRST MESSAGE ──────────────────────────────────────
  const autoSaveProject = async () => {
    if (projectCreatedRef.current) return
    projectCreatedRef.current = true

    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')

      // Returning user — project already exists in DB, skip
      if (currentResult.dbProjectId || sessionStorage.getItem('gradelyProjectDbId')) return

      const projInfo = savedProjectInfo || currentResult?.projectInfo || {}

      const data = await createProject({
        title: projInfo.topic || 'Untitled Project',
        university: projInfo.university || '',
        department: projInfo.department || '',
        project_type: projInfo.project_type || projInfo.projectType || '',
        status: 'in_progress',
        project_info: projInfo,
        structure: currentResult?.structure || {},
        chapters: currentResult?.chapters || [],
      })

      const newId = data?.project?.id
      if (newId) {
        sessionStorage.setItem('gradelyProjectDbId', String(newId))
        const updated = { ...currentResult, dbProjectId: newId, projectInfo: projInfo }
        sessionStorage.setItem('gradelyResult', JSON.stringify(updated))
      }
    } catch (err) {
      console.error('[Gradely] Auto-save failed silently:', err)
      projectCreatedRef.current = false
    }
  }


  // ─── SEND MESSAGE (AI) ─────────────────────────────────────────────────────
const handleSend = async (overrideInput = null) => {
    const text = overrideInput || input
    if (!text.trim()) return

    // ── Auto-save on first real user message (fire and forget — doesn't block chat)
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0
    if (isFirstMessage) {
      autoSaveProject()
    }

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
      const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] }
       const chapterNum = currentSection?.number ? parseInt(currentSection.number.split('.')[0], 10) : 1
      const aiReply = await socraticChat(
        savedProjectInfo || currentResult?.projectInfo || {},
        chapter1Structure,
        [...messages, userMsg],
        text,
        currentResult?.references || [],
        { requestType: 'draft', currentChapterNumber: chapterNum }
      )

      const parsed = parseAIResponse(aiReply)
      const assistantMsg = { role: 'assistant', topicSentence: text, ...parsed }
      const newMessages = [...messages, userMsg]

      if (parsed.type === 'draft' && parsed.sectionNumber) {
        const secNum = parsed.sectionNumber
        if (!completedSections.includes(secNum)) {
          setCompletedSections(prev => [...prev, secNum])
          setSectionIndexMap(prev => ({ ...prev, [secNum]: newMessages.length }))
        }
        if (parsed.draftContent) {
          const cur = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
          if (cur.chapters?.[0]) {
            cur.chapters[0].content = (cur.chapters[0].content || '') + '\n\n' + parsed.draftContent
            sessionStorage.setItem('gradelyResult', JSON.stringify(cur))
          }
        }
      }

      newMessages.push(assistantMsg)
      setMessages(newMessages)
    } catch (err) {
      console.error('AI generation error:', err)
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last?.content?.includes('trouble generating')) return prev
        return [...prev, { role: 'assistant', type: 'info', content: "I had trouble generating that. Could you rephrase and try again?" }]
      })
    }
    setIsTyping(false)
  }

  // ─── GENERATE SECTION PROMPT ──────────────────────────────────────────────
  const getSectionPrompt = (sectionTitle) => {
    const title = sectionTitle.toLowerCase()
    if (title.includes('background')) {
      return 'Why is this topic important right now?'
    } else if (title.includes('problem') || title.includes('statement')) {
      return 'What is the specific problem you are addressing?'
    } else if (title.includes('aim') || title.includes('objective')) {
      return 'What is the main aim and what are the specific objectives of your project?'
    } else if (title.includes('significance')) {
      return 'Why does this project matter? Who benefits from it and how?'
    } else if (title.includes('scope') || title.includes('limitation')) {
      return 'What is the scope of your study? What are the limitations?'
    } else if (title.includes('definition')) {
      return 'What are the key terms that need to be defined in your project?'
    } else if (title.includes('organization')) {
      return 'How will you organize the remaining chapters of your project?'
    } else {
      return 'Tell me in your own words: what is the main point of this section?'
    }
  }

  // ─── LOOKS GOOD ─────────────────────────────────────────────────────────────
  const handleLooksGood = (messageIndex) => {
    const msg = messages[messageIndex]
    if (!msg || msg.role !== 'assistant' || msg.type !== 'draft') return

    const sectionNumber = msg.sectionNumber
    if (!sectionNumber) return

    if (completedSections.includes(sectionNumber)) {
      alert(`Section ${sectionNumber} is already completed.`)
      return
    }

    if (currentSection?.number !== sectionNumber) {
      alert(`Please use the "Looks good" button on the current section draft.`)
      return
    }

    setCompletedSections(prev => [...prev, sectionNumber])
    const nextSection = allSections.find(
      s => !completedSections.includes(s.number) && s.number !== sectionNumber
    )

    if (nextSection) {
      const prompt = getSectionPrompt(nextSection.title)
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '✅ Looks good, moving on.' },
        { role: 'assistant', type: 'question', content: `Let's move to the next section: **${nextSection.title}**. ${prompt}` }
      ])
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '✅ Looks good, moving on.' },
        { role: 'assistant', type: 'complete', content: '🎉 Congratulations! You have completed all sections of Chapter 1. You can now review your project or proceed to the next steps.' }
      ])
    }
  }

// ─── REGENERATE ─────────────────────────────────────────────────────────────
  const handleRegenerate = () => {
    const lastWithTopic = [...messages].reverse().find(m => m.role === 'assistant' && m.topicSentence)
    if (!lastWithTopic?.topicSentence) {
      alert('No topic sentence to regenerate.')
      return
    }
    setMessages(prev => {
      const copy = [...prev]
      if (copy[copy.length - 1]?.role === 'assistant') copy.pop()
      return copy
    })
    handleSend(lastWithTopic.topicSentence)
  }

  // ─── I'M STUCK ──────────────────────────────────────────────────────────────
 const handleStuck = async () => {
    if (isTyping) return
    setIsTyping(true)
    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
      const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] }
      const chapterNum = currentSection?.number ? parseInt(currentSection.number.split('.')[0], 10) : 1
      const aiReply = await socraticChat(
        savedProjectInfo || currentResult?.projectInfo || {},
        chapter1Structure,
        messages,
        '',
        currentResult?.references || [],
        { requestType: 'stuck', currentChapterNumber: chapterNum }
      )
      const parsed = parseAIResponse(aiReply)
      setMessages(prev => [...prev, { role: 'assistant', type: parsed.type, exampleText: parsed.exampleText, content: parsed.content || '' }])
    } catch (err) {
      console.error('Stuck-mode error:', err)
      setMessages(prev => [...prev, { role: 'assistant', type: 'info', content: "Couldn't load an example right now. Try your best attempt and I'll help refine it." }])
    }
    setIsTyping(false)
  }
  // ─── QUICK REPLY HANDLER ────────────────────────────────────────────────────
 const onLooksGoodClick = (e, index) => {
  e.preventDefault();
  e.stopPropagation();
  handleLooksGood(index);
};

const onEditClick = (e, index) => {
  e.preventDefault();
  e.stopPropagation();
  startEditing(index, messages[index].content);
};

const onRegenerateClick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  handleRegenerate();
};

  // ─── SEARCH ──────────────────────────────────────────────────────────────────
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    const results = []
    messages.forEach((msg, idx) => {
      if (msg.role === 'assistant' && msg.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({ index: idx, preview: msg.content.slice(0, 120) + '...', full: msg.content })
      }
    })
    setSearchResults(results)
  }

  const scrollToMessage = (index) => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    const bubble = document.querySelector(`[data-msg-index="${index}"]`)
    if (bubble) {
      bubble.scrollIntoView({ behavior: 'smooth', block: 'center' })
      bubble.classList.add('highlight')
      setTimeout(() => bubble.classList.remove('highlight'), 2000)
    } else {
      console.warn('Bubble not found for index', index)
    }
  }

  const handleSectionClick = (secNum, messageIndex) => {
    if (messageIndex !== undefined) {
      scrollToMessage(messageIndex)
    } else {
      const section = allSections.find(s => s.number === secNum)
      if (section) {
        const title = section.title
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role === 'assistant' && messages[i].content.includes(title)) {
            scrollToMessage(i)
            break
          }
        }
      }
    }
  }

  // ─── SAVE & EXIT ────────────────────────────────────────────────────────────
  useEffect(() => {
  // If user is logged in but the DB says they aren't onboarded, send them to onboarding
  if (user && user.onboarded === false) {
    navigate('/onboarding'); 
  }
}, [user, navigate]);

  const handleSaveAndExit = async () => {
    if (user && user.onboarded) {
      try {
        await markOnboarded()
      } catch (err) { console.error('Failed to mark onboarded:', err) }
    }
    navigate('/dashboard')
  }

  // ─── INLINE EDITING ─────────────────────────────────────────────────────────
  const startEditing = (index, content) => {
    setEditingMessageIndex(index)
    setEditContent(content)
  }

  const cancelEditing = () => {
    setEditingMessageIndex(null)
    setEditContent('')
  }

  const saveEdit = (index) => {
    setMessages(prev => {
      const newMessages = [...prev]
      if (newMessages[index]) newMessages[index].content = editContent
      return newMessages
    })
    setEditingMessageIndex(null)
    setEditContent('')
  }

  const handleEditGenerate = async (index) => {
    const msg = messages[index]
    if (!msg || msg.role !== 'assistant') return

    const topicSentence = msg.topicSentence
      || messages.slice(0, index).reverse().find(m => m.topicSentence)?.topicSentence

    if (!topicSentence) {
      alert('No topic sentence found. Please type your main point again.')
      return
    }

    setIsTyping(true)
    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
      const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] }
      const aiReply = await socraticChat(
        savedProjectInfo || currentResult?.projectInfo || {},
        chapter1Structure,
        messages.slice(0, index),
        topicSentence,
        currentResult?.references || []
      )

      const parsed = parseAIResponse(aiReply)

      setMessages(prev => {
        const copy = [...prev]
        if (copy[index]) copy[index] = { ...copy[index], ...parsed, topicSentence }
        return copy
      })

      if (parsed.type === 'draft' && parsed.draftContent) {
        const cur = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}')
        if (cur.chapters?.[0]) {
          cur.chapters[0].content = (cur.chapters[0].content || '') + '\n\n' + parsed.draftContent
          sessionStorage.setItem('gradelyResult', JSON.stringify(cur))
        }
      }

      setEditingMessageIndex(null)
      setEditContent('')
    } catch (err) {
      console.error('Regenerate error:', err)
      alert('Failed to regenerate. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

 // ─── FORMAT MESSAGE ─────────────────────────────────────────────────────────
  const formatMessage = (msg) => {
    if (msg.type === 'draft') {
      return (
        <>
          {msg.content && <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{msg.content}</p>}
          <div className="sb-draft-block">{msg.draftContent}</div>
          {msg.outro && <p className="sb-draft-outro">{msg.outro}</p>}
        </>
      )
    }
    if (msg.type === 'stuck_example') {
      return (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>
            Here's one way a student might start answering this — don't copy it, rewrite it in your own words below:
          </p>
          <div className="sb-draft-block" style={{ fontStyle: 'italic' }}>{msg.exampleText}</div>
        </>
      )
    }
    if (msg.type === 'hints') {
      return (
        <>
          <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            {(msg.hints || []).map((h, i) => (
              <button key={i} className="sb-quick-reply-btn" onClick={() => { setInput(h); textareaRef.current?.focus() }}>{h}</button>
            ))}
          </div>
        </>
      )
    }
    return <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
  }
  // ─── PLACEHOLDER ────────────────────────────────────────────────────────────
  const getPlaceholder = () => {
    if (isChapter1Complete) return "Type 'pay' to unlock chapters 2-5..."
    if (isAskingForTopic()) return isMobile ? "Write your main point" : "Write your main point here – what's your claim? Why does it matter?"
    if (lastMessageWasDraft) return "Type 'yes' or 'next'..."
    return "Tell Grad your thoughts..."
  }

  if (isLoadingStructure) {
    return (
      <>
        <style>{styles}</style>
        <div className="sb-loading">
          <div className="sb-spinner" />
          <h2 className="sb-loading-title">Grad is reading your guide...</h2>
          <p className="sb-loading-sub">Generating your chapter structure.</p>
          <div className="sb-loading-bar" />
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>
      <div className={`sb-overlay${mobileSidebarOpen ? ' open' : ''}`} onClick={() => setMobileSidebarOpen(false)} />

      <div className={`sb-search-overlay${searchOpen ? ' open' : ''}`} onClick={(e) => {
        if (e.target === e.currentTarget) setSearchOpen(false)
      }}>
        <div className="sb-search-modal">
          <div className="sb-search-input-wrap">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              autoFocus
            />
            <span className="sb-search-close" onClick={() => setSearchOpen(false)}>✕</span>
          </div>
          <div className="sb-search-results">
            {searchQuery.trim() && searchResults.length === 0 && (
              <div className="sb-search-no-results">No messages found for "{searchQuery}"</div>
            )}
            {searchResults.map((res, idx) => (
              <div key={idx} className="sb-search-result-item" onClick={() => scrollToMessage(res.index)}>
                <div className="sb-search-result-preview" dangerouslySetInnerHTML={{
                  __html: res.preview.replace(new RegExp(searchQuery, 'gi'), match => `<span class="highlight">${match}</span>`)
                }} />
                <div className="sb-search-result-meta">Message #{res.index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sb-root">
        {isMobile ? (
          <div className={`sb-sidebar mobile${mobileSidebarOpen ? ' open' : ''}`}>
            <div className="sb-sidebar-header">
              <div className="sb-logo" onClick={() => navigate('/')}>
  {showFullLogo ? (
    <>
      <div className="sb-logo-icon">G</div>
      <span className="sb-logo-text">Gradely</span>
    </>
  ) : (
    <div className="sb-logo-icon"> <img src={logoSubmark} alt="GradelyAI" /> </div> 
  )}
</div>
              <div className="sb-header-actions">
                <button onClick={() => { setSearchOpen(true); setMobileSidebarOpen(false) }} title="Search messages">
                  <SearchIcon />
                </button>
                <button onClick={() => setMobileSidebarOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
            <div className="sb-sidebar-body">
              <ProgressList
                chapters={projectData.chapters}
                completedSections={completedSections}
                sectionIndexMap={sectionIndexMap}
                onSectionClick={handleSectionClick}
              />
            </div>
          </div>
        ) : (
          <div className={`sb-sidebar${sidebarOpen ? '' : ' collapsed'}`}>
            <div className="sb-sidebar-header">
              <div className="sb-logo" onClick={() => { navigate('/'); setMobileSidebarOpen(false); }}>
  {/* Mobile always uses the Submark */}
  <div className="sb-logo-icon"> <img src={logoSubmark} alt="GradelyAI" /> </div> 
</div>
              <div className="sb-header-actions">
                <button onClick={() => setSearchOpen(true)} title="Search messages"><SearchIcon /></button>
                <button
                  className={!sidebarOpen ? 'active' : ''}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <PanelIcon />
                </button>
              </div>
            </div>
            <div className="sb-sidebar-body">
              <ProgressList
                chapters={projectData.chapters}
                completedSections={completedSections}
                sectionIndexMap={sectionIndexMap}
                onSectionClick={handleSectionClick}
              />
            </div>
          </div>
        )}

        <div className="sb-chat-panel">
          <div className="sb-header">
            <div className="sb-header-left">
              {isMobile && (
                <button className="sb-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
                  <MenuIcon />
                </button>
              )}
              <div className="sb-header-text-wrapper">
                <div className="sb-header-topic">{projectData.topic}</div>
                <div className="sb-header-type">
                  <span className="sb-type-label">Project type:</span> {projectData.type}
                </div>
              </div>
            </div>
            <div className="sb-header-actions">
              <button className="sb-save-exit-btn" onClick={handleSaveAndExit}>Save & Exit</button>
            </div>
          </div>

          <div className="sb-messages-wrapper" ref={messagesContainerRef}>
            <div className="sb-messages-container">
              {currentSection && !isChapter1Complete && (
                <div className="sb-section-progress">
                  <span className="sb-section-progress-label">📍 {currentSection.title}</span>
                  <span className="sb-section-progress-status">
                    {completedSections.includes(currentSection.number) ? (
                      <span className="done">✓ Complete</span>
                    ) : (
                      `Section ${currentSection.number} of ${allSections.length}`
                    )}
                  </span>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isEditing = editingMessageIndex === idx
                const isDraft = msg.type === 'draft'
                const isAssistant = msg.role === 'assistant'
                const showQuickReplies = isAssistant && isDraft

                return (
                  <div key={idx} className={`sb-msg-row ${msg.role}`}>
                    <div className={`sb-bubble ${msg.role}${isEditing ? ' editing' : ''}`} data-msg-index={idx}>
                      {msg.role === 'assistant' ? (
                        <>
                          {formatMessage(msg)}
                         {showQuickReplies && (
  <div className="sb-quick-replies">
    <button 
      type="button" 
      className="sb-quick-reply-btn success" 
      onClick={(e) => onLooksGoodClick(e, idx)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Looks good
    </button>

    <button 
      type="button" 
      className="sb-quick-reply-btn" 
      onClick={(e) => onEditClick(e, idx)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5L12.5 4.5L4 13H1V10L9.5 1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Edit
    </button>

    <button 
      type="button" 
      className="sb-quick-reply-btn" 
      onClick={(e) => onRegenerateClick(e)}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3C9.8 1.8 8.1 1 6.2 1C2.8 1 0 3.8 0 7.2C0 10.6 2.8 13.4 6.2 13.4C9 13.4 11.4 11.5 12.1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M13 1V4H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Regenerate
    </button>
  </div>
)}
                          {isDraft && (
                            <button className="sb-edit-pencil" onClick={() => startEditing(idx, msg.content)} title="Edit this section">
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5L12.5 4.5L4 13H1V10L9.5 1.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {isEditing && (
                            <div className="sb-edit-area">
                              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
                              <div className="sb-edit-actions">
                                <button className="sb-edit-save" onClick={() => saveEdit(idx)}>Save</button>
                                <button className="sb-edit-cancel" onClick={cancelEditing}>Cancel</button>
                                <button className="sb-edit-generate" onClick={() => handleEditGenerate(idx)}>🔄 Regenerate</button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="sb-typing">
                  <div className="sb-typing-dots"><div className="sb-typing-dot" /><div className="sb-typing-dot" /><div className="sb-typing-dot" /></div>
                  Grad is thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

         <div className="sb-input-area">
            <div className="sb-input-inner">
              {showStuckButton && (
                <button className="sb-quick-reply-btn" onClick={handleStuck} disabled={isTyping}
                  style={{ marginBottom: 8, alignSelf: 'flex-start' }}>
                  🤔 I'm stuck — give me an example
                </button>
              )}
              <div className="sb-input-row">
                <div className="sb-textarea-wrap">
                  <textarea
                    ref={textareaRef}
                    className="sb-textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={getPlaceholder()}
                    rows={isMobile ? 2 : 3}
                  />
                  <button className="sb-send-btn-mobile" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                    <span className="arrow-up">↑</span>
                  </button>
                </div>
                <button className={`sb-send-btn sb-send-btn-desktop ${input.trim() && !isTyping ? 'active' : 'inactive'}`} onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
                  Submit →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}