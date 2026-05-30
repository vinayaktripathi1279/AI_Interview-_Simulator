import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, RefreshCw, BarChart2, Star, ChevronRight, AlertCircle, FileText } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function HistoryDashboard({ onSelectSession }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('/api/interviews')
        setSessions(response.data)
      } catch (err) {
        console.error(err)
        setError('Could not fetch historical mock interview records.')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="panel animated-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
        <h2>Loading History Logs...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel animated-fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2>Error Loading Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error}</p>
      </div>
    )
  }

  // Prep Recharts progress line data: reverse chronological order to normal time order
  const progressData = [...sessions]
    .reverse()
    .map((s, idx) => ({
      index: idx + 1,
      name: `Mock #${idx + 1}`,
      Score: s.overallScore,
      role: s.roleType
    }))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left' }}>
      
      {/* Title block */}
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Performance Tracker
        </span>
        <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>Your Mock Interview Dashboard</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No Mock Interviews Recorded Yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem', fontSize: '0.9rem' }}>
            Complete your first mock interview simulation to generate tracking scores and feedback reports.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <BarChart2 size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Overall Score Progression Trend</h3>
            </div>
            
            <div style={{ width: '100%', height: '240px', fontSize: '0.8rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: 'var(--border-light)', borderRadius: '8px', color: '#fff' }}
                    labelStyle={{ color: 'var(--primary)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Score" 
                    stroke="var(--primary)" 
                    strokeWidth={3} 
                    activeDot={{ r: 8 }} 
                    dot={{ stroke: 'var(--secondary)', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Past Sessions List */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Past Mock Sessions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sessions.map((s) => (
                <div 
                  key={s.id}
                  className="panel"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                        {s.roleType}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)', 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px' 
                      }}>
                        {s.experienceLevel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      <span>{formatDate(s.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</span>
                      <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: s.overallScore >= 80 ? 'var(--accent)' : 'var(--accent-blue)', marginTop: '-0.1rem' }}>
                        {s.overallScore}%
                      </h4>
                    </div>

                    <button 
                      className="btn btn-secondary"
                      onClick={() => onSelectSession(s.id)}
                      style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                    >
                      View Report <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HistoryDashboard
