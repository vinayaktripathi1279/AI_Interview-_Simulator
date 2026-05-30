import React, { useState } from 'react'
import axios from 'axios'
import { Sparkles, ArrowRight } from 'lucide-react'

function InterviewConfig({ onSessionStarted }) {
  const [roleType, setRoleType] = useState('Software Engineer')
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level')
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/api/interviews', {
        roleType,
        experienceLevel,
        resumeText
      })
      onSessionStarted(response.data)
    } catch (err) {
      console.error(err)
      setError('Could not initialize interview session. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel animated-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex' }}>
          <Sparkles size={20} color="#fff" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Setup Your Mock Interview</h2>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
        Select your target career path and professional depth. The AI will customize its line of questioning and follow-ups accordingly.
      </p>

      {error && (
        <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'left' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleStart}>
        <div className="input-group">
          <label className="input-label">Target Role / Job Title</label>
          <select 
            className="input-field" 
            value={roleType} 
            onChange={(e) => setRoleType(e.target.value)}
            style={{ backgroundColor: '#111827', color: '#fff', cursor: 'pointer' }}
          >
            <option value="Software Engineer">Software Engineer / Developer</option>
            <option value="Product Manager">Product Manager (PM)</option>
            <option value="Data Scientist">Data Scientist / Analyst</option>
            <option value="UI UX Designer">UI/UX Product Designer</option>
            <option value="General Professional">General Professional / HR Practice</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Experience Level</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {['Junior', 'Mid-Level', 'Senior'].map((level) => (
              <button
                key={level}
                type="button"
                className="btn"
                style={{
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  border: experienceLevel === level ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: experienceLevel === level ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: experienceLevel === level ? '#fff' : 'var(--text-secondary)',
                }}
                onClick={() => setExperienceLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '1.5rem' }}>
          <label className="input-label">Paste Resume / Profile Context (Optional)</label>
          <textarea
            className="input-field"
            rows={4}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your key projects, skills, or target qualifications here to allow the AI to customize the mock interview around your resume..."
            style={{ resize: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Generating 1st Question...' : 'Start Mock Session'} {!loading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  )
}

export default InterviewConfig
