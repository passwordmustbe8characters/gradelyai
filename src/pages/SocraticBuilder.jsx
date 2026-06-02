import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { socraticChat, generateProjectStructure } from '../lib/ai'

const STORAGE_KEY_CHAT = 'gradelyChatHistory';
const STORAGE_KEY_SECTIONS = 'gradelyCompletedSections';

export default function SocraticBuilder() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingStructure, setIsLoadingStructure] = useState(true) // New loading state
  const chatEndRef = useRef(null)
  
  // Load Project Data safely first
  let savedResult = null;
  let savedProjectInfo = null;
  try {
    const res = sessionStorage.getItem('gradelyResult');
    if (res) savedResult = JSON.parse(res);
    const proj = sessionStorage.getItem('gradelyProject');
    if (proj) savedProjectInfo = JSON.parse(proj);
  } catch (e) { console.error(e); }

  const projectData = {
    topic: savedResult?.projectInfo?.topic || savedProjectInfo?.topic || "Your Project Topic",
    chapters: savedResult?.structure?.chapters || [],
    references: savedResult?.references || []
  }

  // 1. Load Chat History safely
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CHAT);
      const parsed = saved ? JSON.parse(saved) : [];
      if (parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    return []; // Return empty, we will add greeting after structure is ready
  });

  const [completedSections, setCompletedSections] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_SECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error(e); return []; }
  });

  // 2. Auto-Generate Structure on Mount if missing
  useEffect(() => {
    const initProject = async () => {
      // Check if structure already exists in gradelyResult
      if (savedResult?.structure?.chapters?.length > 0) {
        setIsLoadingStructure(false);
        // Add greeting if chat is empty
        if (messages.length === 0) {
          setMessages([
            { role: 'assistant', content: `Hey! I've analyzed your project guide for "${projectData.topic}". Let's build Chapter 1: Introduction. To start with Section 1.1 (Background), tell me in your own words: Why is this topic important right now?` }
          ]);
        }
        return;
      }

      // If no structure, generate it!
      setIsLoadingStructure(true);
      try {
        const projInfo = savedProjectInfo || {};
        const structure = await generateProjectStructure(projInfo);
        
        const newResult = {
          ...projInfo,
          structure: structure,
          chapters: structure.chapters.map(ch => ({ ...ch, content: '' })),
          abstract: '',
          references: [],
          projectInfo: projInfo,
          humanized: false
        };
        sessionStorage.setItem('gradelyResult', JSON.stringify(newResult));
        
        // Reload the page to initialize with new data safely
        window.location.reload(); 

      } catch (err) {
        console.error("Failed to generate structure:", err);
        alert("Failed to generate project structure. Please try again.");
        navigate('/start');
      } finally {
        setIsLoadingStructure(false);
      }
    };

    initProject();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save Chat History & Sections
  useEffect(() => { sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { sessionStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(completedSections)); }, [completedSections]);

  const lastMessageWasDraft = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content.includes('[SECTION_DRAFT]')
  const isChapter1Complete = messages.some(m => m.content.includes('[CHAPTER_1_COMPLETE]'))
  const MIN_WORDS = (lastMessageWasDraft || isChapter1Complete) ? 1 : 10
  const wordCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length
  const isThresholdMet = wordCount >= MIN_WORDS

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isTyping])

  const handleSend = async () => {
    if (!isThresholdMet) return
    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)

    try {
      const currentResult = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}');
      const chapter1Structure = currentResult?.structure?.chapters?.find(c => c.number === 1) || { subsections: [] }
      const aiReply = await socraticChat(
        savedProjectInfo || currentResult?.projectInfo || {}, 
        chapter1Structure, 
        messages, 
        userMessage,
        currentResult?.references || []
      )
      
      if (aiReply.includes('[SECTION_DRAFT]')) {
        const outroText = aiReply.split('[/SECTION_DRAFT]')[1] || '';
        const sectionMatch = outroText.match(/(\d+\.\d+)/);
        if (sectionMatch) {
          setCompletedSections(prev => prev.includes(sectionMatch[1]) ? prev : [...prev, sectionMatch[1]])
        }

        const parts = aiReply.split('[SECTION_DRAFT]');
        if (parts.length > 1) {
          const draftContent = parts[1].split('[/SECTION_DRAFT]')[0].trim();
          if (draftContent) {
            let currentResultUpdate = JSON.parse(sessionStorage.getItem('gradelyResult') || '{}');
            if (currentResultUpdate.chapters && currentResultUpdate.chapters[0]) {
              currentResultUpdate.chapters[0].content = (currentResultUpdate.chapters[0].content || '') + '\n\n' + draftContent;
              sessionStorage.setItem('gradelyResult', JSON.stringify(currentResultUpdate));
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, I lost my train of thought. Can you repeat that?" }])
    }
    setIsTyping(false)
  }

  const formatMessage = (content) => {
    if (!content.includes('[SECTION_DRAFT]')) {
      const cleanContent = content.replace('[CHAPTER_1_COMPLETE]', '');
      return <span style={{ whiteSpace: 'pre-wrap' }}>{cleanContent}</span>
    }
    const parts = content.split('[SECTION_DRAFT]')
    const intro = parts[0]
    const draftAndOutro = parts[1].split('[/SECTION_DRAFT]')
    const draft = draftAndOutro[0]
    const outro = draftAndOutro[1] || ''
    return (
      <>
        {intro && <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{intro}</p>}
        <div style={{ background: 'rgba(0,126,167,0.03)', border: '1px solid rgba(0,126,167,0.15)', padding: '16px', borderRadius: '10px', marginBottom: 12, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{draft}</div>
        {outro && <p style={{ marginTop: 8, color: 'var(--success)', fontWeight: 600, whiteSpace: 'pre-wrap' }}>{outro}</p>}
      </>
    )
  }

  const handleSaveAndReview = () => {
    navigate('/results');
  }

  // Loading State UI
  if (isLoadingStructure) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} />
        <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 24, color: 'var(--text)' }}>Grad is reading your guide...</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Generating your chapter structure.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Geist, sans-serif' }}>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, color: 'var(--text)' }}>Grad <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>(Your Project Gee)</span></h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Topic: {projectData.topic}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={() => { sessionStorage.removeItem(STORAGE_KEY_CHAT); sessionStorage.removeItem(STORAGE_KEY_SECTIONS); navigate('/dashboard') }} style={{ fontSize: 13 }}>Exit</button>
            {isChapter1Complete && (
              <button className="btn-primary" onClick={handleSaveAndReview} style={{ fontSize: 13, padding: '8px 16px' }}>
                💾 Save & Review Ch 1
              </button>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)', color: msg.role === 'user' ? 'white' : 'var(--text)', fontSize: '14px', lineHeight: 1.6, boxShadow: 'var(--shadow)' }}>
                {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}
          {isTyping && <div style={{ color: 'var(--text-dim)', fontSize: 14, fontStyle: 'italic' }}>Grad is typing...</div>}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '20px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={isChapter1Complete ? "Type 'pay' to unlock chapters 2-5..." : (lastMessageWasDraft ? "Type 'yes' or 'next'..." : "Tell Grad your thoughts in your own words...")} style={{ width: '100%', padding: '14px 60px 14px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '14px', fontFamily: 'Geist, sans-serif', resize: 'none', outline: 'none', minHeight: '60px' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '14px', fontSize: '11px', color: isThresholdMet ? 'var(--success)' : 'var(--text-dim)', transition: 'color 0.2s', fontWeight: 600 }}>
                {(lastMessageWasDraft || isChapter1Complete) ? '✓' : `${wordCount}/${MIN_WORDS}`}
              </div>
            </div>
            <button onClick={handleSend} disabled={!isThresholdMet || isTyping} style={{ padding: '14px 20px', borderRadius: '12px', border: 'none', background: isThresholdMet ? 'var(--accent)' : 'var(--bg-card)', color: isThresholdMet ? 'white' : 'var(--text-dim)', cursor: isThresholdMet ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 600, fontFamily: 'Geist, sans-serif', transition: 'all 0.2s' }}>Send</button>
          </div>
        </div>
      </div>

      <div style={{ width: '340px', background: 'var(--bg-elevated)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        <h3 style={{ fontFamily: 'Melodrama, serif', fontSize: 20, marginBottom: '20px', color: 'var(--text)' }}>Project Progress</h3>
        {projectData.chapters.length > 0 ? ( projectData.chapters.map(ch => (
          <div key={ch.number || ch.title}>
            <h4 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '10px', marginTop: ch.number > 1 ? '20px' : '0' }}>Chapter {ch.number}: {ch.title}</h4>
            {(ch.subsections || []).map(sec => {
              const sectionTitle = typeof sec === 'string' ? sec : sec.title;
              const secNum = sectionTitle.split(' ')[0];
              const isReady = completedSections.includes(secNum);
              return (
                <div key={sectionTitle} style={{ padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', border: `1px solid ${isReady ? 'var(--success)' : 'var(--border)'}`, background: isReady ? 'rgba(45,155,111,0.05)' : 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: isReady ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>{sectionTitle}</span>
                  {isReady && <span style={{ fontSize: '12px', color: 'var(--success)' }}>✓</span>}
                </div>
              )
            })}
          </div>
        ))) : ( <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No project structure found.</p> )}
      </div>
    </div>
  )
}