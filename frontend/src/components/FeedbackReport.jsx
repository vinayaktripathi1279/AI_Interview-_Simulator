import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { CheckCircle2, ChevronDown, ChevronUp, AlertCircle, ArrowLeft, RefreshCw, Star } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

function FeedbackReport({ sessionId, onReset }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openCardIndex, setOpenCardIndex] = useState(0) // Default open first Q&A card

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await axios.get(`/api/interviews/${sessionId}/feedback`)
        setReport(response.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load interview report card.')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [sessionId])

  if (loading) {
    return (
      <div className="panel animated-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
        <h2>Generating Your Report Card...</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Please hold tight. The AI is synthesizing your answers and compiling feedback.
        </p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="panel animated-fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', borderColor: '#ef4444' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2>Error Loading Report</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>{error || 'No report found.'}</p>
        <button className="btn btn-secondary" onClick={onReset}>
          Return to Setup
        </button>
      </div>
    )
  }

  // Prepping chart data from session question answers
  const chartData = report.questionsAnswers.map(qa => ({
    name: `Q${qa.sequenceNumber}`,
    Relevance: qa.relevanceScore,
    Clarity: qa.clarityScore,
    Structure: qa.structureScore
  }))

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--accent)'
    if (score >= 60) return 'var(--accent-blue)'
    return '#ef4444'
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', margin: '1.5rem 0', textAlign: 'left' }}>
      
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interview Completed
          </span>
          <h2 style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>Performance Report Card</h2>
        </div>
        <button className="btn btn-secondary" onClick={onReset} style={{ fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Run Another Mock
        </button>
      </div>

      {/* Main Grid: Overall Score + Recharts Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Overall Circular Score Panel */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
            Overall Average Score
          </span>
          <div style={{
            height: '150px',
            width: '150px',
            borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${report.overallScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <div style={{
              height: '130px',
              width: '130px',
              borderRadius: '50%',
              background: '#0a0e1a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff', lineHeight: 1 }}>
                {report.overallScore}%
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Role</h4>
              <p style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>{report.roleType}</p>
            </div>
            <div style={{ width: '1px', background: 'var(--border-light)' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Level</h4>
              <p style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>{report.experienceLevel}</p>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Panel */}
        <div className="panel" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
            Question Scores Breakdown
          </span>
          <div style={{ width: '100%', height: '220px', fontSize: '0.8rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'var(--border-light)', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: 'var(--primary)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Relevance" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Clarity" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Structure" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Aggregate AI Review (Strengths, Weaknesses, Suggestions) */}
      <div className="panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div>
          <h3 style={{ color: 'var(--accent)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle2 size={18} /> Key Strengths
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {report.strengths}
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
          <h3 style={{ color: '#ec4899', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Star size={18} /> Growth Opportunities
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {report.weaknesses}
          </p>
        </div>

        <div style={{ borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-blue)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertCircle size={18} /> Actionable Steps
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {report.suggestions}
          </p>
        </div>
      </div>

      {/* Turn-by-Turn Card Breakdown */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Detailed Dialogue Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {report.questionsAnswers.map((qa, index) => {
            const isOpen = openCardIndex === index
            const questionAvg = Math.round((qa.relevanceScore + qa.clarityScore + qa.structureScore) / 3)

            return (
              <div 
                key={qa.id} 
                className="panel" 
                style={{ 
                  padding: '1rem 1.5rem', 
                  borderColor: isOpen ? 'var(--primary-glow)' : 'var(--border-light)',
                  background: isOpen ? 'rgba(255, 255, 255, 0.01)' : 'var(--bg-surface)'
                }}
              >
                {/* Header Toggle bar */}
                <div 
                  onClick={() => setOpenCardIndex(isOpen ? -1 : index)} 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: 'var(--primary)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px'
                    }}>
                      Q{qa.sequenceNumber}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#fff', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {qa.questionText}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: getScoreColor(questionAvg)
                    }}>
                      Score: {questionAvg}%
                    </span>
                    {isOpen ? <ChevronUp size={20} color="var(--text-secondary)" /> : <ChevronDown size={20} color="var(--text-secondary)" />}
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isOpen && (
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Full Question */}
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>Question text</span>
                      <p style={{ color: '#fff', fontSize: '0.95rem', marginTop: '0.25rem' }}>{qa.questionText}</p>
                    </div>

                    {/* Answer text */}
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 600 }}>Your Answer</span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px', borderLeft: '2px solid var(--border-light)' }}>
                        "{qa.answerText}"
                      </p>
                    </div>

                    {/* AI Feedback & Scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Scores breakdown</span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Relevance:</span>
                            <span style={{ fontWeight: 600, color: getScoreColor(qa.relevanceScore) }}>{qa.relevanceScore}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${qa.relevanceScore}%`, background: getScoreColor(qa.relevanceScore), borderRadius: '2px' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <span>Clarity & Tone:</span>
                            <span style={{ fontWeight: 600, color: getScoreColor(qa.clarityScore) }}>{qa.clarityScore}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${qa.clarityScore}%`, background: getScoreColor(qa.clarityScore), borderRadius: '2px' }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            <span>STAR Structure:</span>
                            <span style={{ fontWeight: 600, color: getScoreColor(qa.structureScore) }}>{qa.structureScore}%</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${qa.structureScore}%`, background: getScoreColor(qa.structureScore), borderRadius: '2px' }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(99, 102, 241, 0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>Detailed Critique</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                          {qa.feedbackText}
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default FeedbackReport
