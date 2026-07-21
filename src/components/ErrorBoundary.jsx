import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          padding: 24, textAlign: 'center', fontFamily: 'Geist, sans-serif',
          background: 'var(--bg, #fff)', color: 'var(--text, #1a1a1a)'
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted, #666)', maxWidth: 420 }}>
            This page hit an unexpected error. Your work should still be saved — try reloading.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{
              padding: '10px 24px', borderRadius: 40, border: 'none',
              background: '#1a1a1a', color: 'white', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Geist, sans-serif'
            }}
          >
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
