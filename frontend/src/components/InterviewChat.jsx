import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Mic, MicOff, Clock, HelpCircle, ArrowRight, Play, CheckCircle, Lightbulb, RefreshCw } from 'lucide-react'

function InterviewChat({ sessionData, onInterviewCompleted }) {
  const { sessionId, roleType, experienceLevel } = sessionData
  const [currentQuestion, setCurrentQuestion] = useState(sessionData.currentQuestion)
  const [answerText, setAnswerText] = useState('')
  
  // Timer State (3 minutes = 180 seconds)
  const [timeLeft, setTimeLeft] = useState(180)
  const timerRef = useRef(null)

  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // STAR Guide & Hints States
  const [showStarGuide, setShowStarGuide] = useState(false)
  const [hintText, setHintText] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset timer on new question
  useEffect(() => {
    setTimeLeft(180)
    setHintText('')
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentQuestion])

  const handleRequestHint = async () => {
    setHintLoading(true)
    setHintText('')
    try {
      const response = await axios.get(`/api/interviews/${sessionId}/questions/${currentQuestion.id}/hint`)
      setHintText(response.data.hint)
    } catch (err) {
      console.error(err)
      setHintText('Could not retrieve a coaching tip for this question.')
    } finally {
      setHintLoading(false)
    }
  }

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }
        
        if (finalTranscript) {
          setAnswerText((prev) => prev + finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!answerText.trim()) return

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    setLoading(true)
    setError('')
    try {
      const response = await axios.post(`/api/interviews/${sessionId}/answers`, {
        questionId: currentQuestion.id,
        answerText: answerText,
        timeTakenSeconds: 180 - timeLeft
      })

      if (response.data.isFinished) {
        clearInterval(timerRef.current)
        onInterviewCompleted(sessionId)
      } else {
        setAnswerText('')
        setCurrentQuestion(response.data.nextQuestion)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to submit answer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Calculate percentage of timer remaining for progress bar
  const timerPercentage = (timeLeft / 180) * 100

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showStarGuide ? '1fr 320px' : '1fr', gap: '1.5rem', margin: '1.5rem 0', transition: 'all 0.3s ease' }}>
      
      {/* Main Chat Component */}
      <div className="panel animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
        
        {/* Progress Bar & Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Session: {roleType} ({experienceLevel})
            </span>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
              Question {currentQuestion.sequenceNumber} of 5
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Countdown timer */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.75rem', 
              background: timeLeft < 30 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
              border: timeLeft < 30 ? '1px solid #ef4444' : '1px solid var(--border-light)',
              borderRadius: '8px',
              color: timeLeft < 30 ? '#ef4444' : '#fff'
            }}>
              <Clock size={16} className={timeLeft < 30 ? 'animate-pulse' : ''} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatTime(timeLeft)}</span>
            </div>

            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={() => setShowStarGuide(!showStarGuide)}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            >
              <HelpCircle size={16} /> STAR Guide
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '-1rem' }}>
          <div style={{ height: '100%', width: `${(currentQuestion.sequenceNumber / 5) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.4s ease' }} />
        </div>

        {/* Question Panel */}
        <div className="panel" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'var(--primary-glow)', padding: '1.5rem', textAlign: 'left' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interviewer (AI)
          </span>
          <p style={{ fontSize: '1.15rem', color: '#fff', marginTop: '0.5rem', fontWeight: 500 }}>
            {currentQuestion.questionText}
          </p>
        </div>

        {/* AI Hint Panel */}
        {hintText && (
          <div className="panel animated-fade-in" style={{ background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '1rem 1.25rem', textAlign: 'left', marginTop: '-0.5rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>
              <Lightbulb size={16} />
              <span>COACH HINT</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
              {hintText}
            </p>
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {/* Answer submission block */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              className="input-field"
              rows={6}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response here, or click the mic button below to dictate your response verbally..."
              style={{ resize: 'none', paddingRight: '3rem', fontSize: '1rem', lineHeight: '1.5' }}
              disabled={loading}
              required
            />
            {/* Visual Listening pulses */}
            {isListening && (
              <span className="animate-ping" style={{ position: 'absolute', right: '1.5rem', bottom: '1.5rem', height: '10px', width: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* STT mic button */}
              <button
                type="button"
                onClick={toggleListening}
                className="btn"
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isListening ? '1px solid #ef4444' : '1px solid var(--border-light)',
                  color: isListening ? '#ef4444' : 'var(--text-secondary)',
                  padding: '0.75rem 1.25rem'
                }}
                disabled={loading}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening ? 'Stop' : 'Speak'}
              </button>

              {/* Get AI Hint button */}
              <button
                type="button"
                onClick={handleRequestHint}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.25rem',
                  borderColor: hintText ? 'var(--accent)' : 'var(--border-light)'
                }}
                disabled={loading || hintLoading}
              >
                {hintLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Lightbulb size={18} style={{ color: hintText ? 'var(--accent)' : 'inherit' }} />
                )}
                Get AI Hint
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !answerText.trim()}
              style={{ minWidth: '160px' }}
            >
              {loading ? 'Evaluating...' : 'Submit Answer'} <ArrowRight size={18} />
            </button>
          </div>
        </form>

        {/* Countdown warning indicator bar */}
        {timeLeft <= 30 && timeLeft > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: `${timerPercentage}%`, background: '#ef4444', transition: 'width 1s linear', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }} />
        )}
      </div>

      {/* STAR Framework Help Drawer */}
      {showStarGuide && (
        <div className="panel animated-fade-in" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--primary-glow)' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            STAR Answer Framework
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Behavioral questions are best structured using the STAR method to stay organized:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '0.75rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>S - Situation</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Set the scene. Provide context of the challenge, project, or environment.
              </p>
            </div>
            <div style={{ borderLeft: '3px solid #ec4899', paddingLeft: '0.75rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>T - Task</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                State the target or problem. What was your responsibility?
              </p>
            </div>
            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '0.75rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>A - Action</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Explain your direct steps. What did you do to resolve the situation?
              </p>
            </div>
            <div style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.75rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>R - Result</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                Outline the outcomes. Focus on quantitative highlights and lessons learned.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewChat
