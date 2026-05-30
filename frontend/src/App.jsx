import React, { useState } from 'react'
import axios from 'axios'
import { Sparkles, Activity, CheckCircle, AlertCircle, ArrowRight, BookOpen } from 'lucide-react'
import InterviewConfig from './components/InterviewConfig'
import InterviewChat from './components/InterviewChat'
import FeedbackReport from './components/FeedbackReport'
import HistoryDashboard from './components/HistoryDashboard'
import './App.css'

function App() {
  const [appState, setAppState] = useState('landing') // landing, config, chat, report, dashboard
  const [sessionData, setSessionData] = useState(null)
  const [completedSessionId, setCompletedSessionId] = useState(null)

  // Connection & Internet Verification States
  const [connectionStatus, setConnectionStatus] = useState('idle') // idle, loading, success, error
  const [backendMessage, setBackendMessage] = useState('')
  const [internetStatus, setInternetStatus] = useState('')
  const [networkQuality, setNetworkQuality] = useState('')
  const [latencyReport, setLatencyReport] = useState([])

  const testConnection = async () => {
    setConnectionStatus('loading')
    try {
      const response = await axios.get('/api/health')
      if (response.data && response.data.status === 'UP') {
        setConnectionStatus('success')
        setBackendMessage(response.data.message || 'Connected successfully!')
        setInternetStatus(response.data.internet || 'UNKNOWN')
        setNetworkQuality(response.data.networkQuality || 'UNKNOWN')
        setLatencyReport(response.data.endpoints || [])
      } else {
        setConnectionStatus('error')
        setBackendMessage('Backend returned unexpected response format.')
      }
    } catch (err) {
      console.error(err)
      setConnectionStatus('error')
      setBackendMessage('Could not connect to backend. Make sure Spring Boot is running on port 8080.')
    }
  }

  const handleSessionStarted = (data) => {
    setSessionData(data)
    setAppState('chat')
  }

  const handleInterviewCompleted = (sessionId) => {
    setCompletedSessionId(sessionId)
    setAppState('report')
  }

  const handleReset = () => {
    setAppState('config')
    setSessionData(null)
    setCompletedSessionId(null)
  }

  return (
    <div className="app-container animated-fade-in">
      {/* Universal Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '1rem' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          onClick={() => setAppState('landing')}
        >
          <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            AI Interview <span style={{ color: 'var(--secondary)' }}>Simulator</span>
          </span>
        </div>

        {/* Navigation Tabs (Only visible when connected, hides during active chat) */}
        {connectionStatus === 'success' && appState !== 'chat' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.5rem 0.9rem',
                background: (appState === 'config' || appState === 'landing') ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: (appState === 'config' || appState === 'landing') ? '1px solid var(--primary-glow)' : '1px solid transparent',
                color: (appState === 'config' || appState === 'landing') ? '#fff' : 'var(--text-secondary)'
              }}
              onClick={() => setAppState('config')}
            >
              Start Simulator
            </button>
            <button 
              className="btn" 
              style={{ 
                fontSize: '0.85rem', 
                padding: '0.5rem 0.9rem',
                background: appState === 'dashboard' ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: appState === 'dashboard' ? '1px solid var(--primary-glow)' : '1px solid transparent',
                color: appState === 'dashboard' ? '#fff' : 'var(--text-secondary)'
              }}
              onClick={() => setAppState('dashboard')}
            >
              Dashboard History
            </button>
          </div>
        )}

        <div>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            onClick={() => setAppState('landing')}
          >
            System Status
          </button>
        </div>
      </header>

      {/* Main Screen Toggle Controller */}
      <div style={{ margin: '2rem 0' }}>
        
        {/* LANDING SCREEN */}
        {appState === 'landing' && (
          <main className="hero-section">
            <h1 className="hero-title">
              Master Your Next Interview With AI
            </h1>
            <p className="hero-subtitle">
              Practice realistic mock interviews tailored to your target job role. Receive real-time follow-up questions and granular evaluation reports instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={testConnection}>
                  Verify System Pipeline <ArrowRight size={18} />
                </button>
                {connectionStatus === 'success' && (
                  <button className="btn btn-secondary" onClick={() => setAppState('config')} style={{ border: '1px solid var(--primary-glow)', color: '#fff' }}>
                    Configure Mock Interview <BookOpen size={18} style={{ marginLeft: '4px' }} />
                  </button>
                )}
              </div>

              {/* Connection Status Banner */}
              {connectionStatus !== 'idle' && (
                <div className="panel" style={{ 
                  padding: '1.25rem 1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem',
                  maxWidth: '500px',
                  borderLeft: connectionStatus === 'success' ? '4px solid var(--accent)' : connectionStatus === 'error' ? '4px solid #ef4444' : '4px solid var(--primary)'
                }}>
                  {connectionStatus === 'loading' && <Activity className="animate-pulse" style={{ color: 'var(--primary)' }} />}
                  {connectionStatus === 'success' && <CheckCircle style={{ color: 'var(--accent)' }} />}
                  {connectionStatus === 'error' && <AlertCircle style={{ color: '#ef4444' }} />}
                  
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {connectionStatus === 'loading' && 'Checking Connection...'}
                      {connectionStatus === 'success' && 'Backend Connected!'}
                      {connectionStatus === 'error' && 'Connection Error'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {connectionStatus === 'loading' && 'Probing the Spring Boot backend server at /api/health...'}
                      {connectionStatus === 'success' && backendMessage}
                      {connectionStatus === 'error' && backendMessage}
                    </p>
                    {connectionStatus === 'success' && (
                      <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                          <span>Outbound Internet: <span style={{ color: 'var(--accent)' }}>{internetStatus}</span></span>
                          <span>Quality: <span style={{ color: networkQuality === 'EXCELLENT' ? 'var(--accent)' : 'var(--accent-blue)' }}>{networkQuality}</span></span>
                        </div>
                        
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                          {latencyReport.map((ep, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                              <span>{ep.name}:</span>
                              <span>{ep.status === 'UP' ? `${ep.latencyMs}ms` : 'OFFLINE'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Feature Cards Grid */}
            <div className="feature-grid" style={{ marginTop: '4rem' }}>
              <div className="feature-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>1. Configure Session</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Choose your target role and experience depth to initialize custom interview questions.
                </p>
              </div>

              <div className="feature-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>2. Live STT Simulation</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Practice verbally using Speech-to-Text with active countdown timers for answers.
                </p>
              </div>

              <div className="feature-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>3. Grade & Feedback</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Receive visual charts scoring clarity, relevance, STAR metrics, and critique reports.
                </p>
              </div>
            </div>
          </main>
        )}

        {/* CONFIG SCREEN */}
        {appState === 'config' && (
          <InterviewConfig onSessionStarted={handleSessionStarted} />
        )}

        {/* CHAT SCREEN */}
        {appState === 'chat' && sessionData && (
          <InterviewChat 
            sessionData={sessionData} 
            onInterviewCompleted={handleInterviewCompleted} 
          />
        )}

        {/* REPORT SCREEN */}
        {appState === 'report' && completedSessionId && (
          <FeedbackReport 
            sessionId={completedSessionId} 
            onReset={handleReset} 
          />
        )}

        {/* DASHBOARD SCREEN */}
        {appState === 'dashboard' && (
          <HistoryDashboard onSelectSession={(id) => {
            setCompletedSessionId(id)
            setAppState('report')
          }} />
        )}

      </div>

      {/* Universal Footer */}
      <footer style={{ marginTop: 'auto', padding: '2rem 0', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p>© 2026 AI Interview Simulator Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
