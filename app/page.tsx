'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { personas } from '@/lib/personas'
import { voices } from '@/lib/personas'

type Message = { role: string; content: string }
type Status = 'idle' | 'listening' | 'thinking' | 'speaking'

export default function Home() {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [latency, setLatency] = useState<{ stt: number; llm: number; tts: number } | null>(null)
  const [personaId, setPersonaId] = useState('facilitator')
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(4))
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const currentPersona = personas.find(p => p.id === personaId)!
  const [voiceId, setVoiceId] = useState(currentPersona.defaultVoiceId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Keyboard shortcut — Space
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        if (status === 'idle') startListening()
        else if (status === 'listening' || status === 'speaking') stop()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status])

  const startWaveform = (stream: MediaStream) => {
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    source.connect(analyser)
    analyserRef.current = analyser

    const draw = () => {
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const heights = Array.from({ length: 20 }, (_, i) => {
        const val = data[Math.floor(i * data.length / 20)] / 255
        return Math.max(4, val * 48)
      })
      setWaveHeights(heights)
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  const stopWaveform = () => {
    cancelAnimationFrame(animFrameRef.current)
    setWaveHeights(Array(20).fill(4))
  }

  const handleTranscript = async (text: string, sttMs: number) => {
    setStatus('thinking')
    stopWaveform()
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setTranscript('')

    const t1 = Date.now()
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, systemPrompt: currentPersona.prompt })
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let reply = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      reply += decoder.decode(value)
    }
    const llmMs = Date.now() - t1
    setMessages(prev => [...prev, { role: 'assistant', content: reply }])

    const t2 = Date.now()
    setStatus('speaking')

    const audioRes = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: reply, voiceId: voiceId })
    })

    if (!audioRes.ok) {
      const errText = await audioRes.text()
      console.error('TTS error:', audioRes.status, errText)
      setStatus('idle')
      return
    }

    const audioBlob = await audioRes.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    audio.oncanplaythrough = () => setLatency({ stt: sttMs, llm: llmMs, tts: Date.now() - t2 })
    audio.onended = () => { setStatus('idle'); URL.revokeObjectURL(audioUrl) }
    audio.play()
  }

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      const recognition = new SR()
      recognitionRef.current = recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      let finalTranscript = ''
      const t0 = Date.now()

      recognition.onend = async () => {
        if (!finalTranscript) { setStatus('idle'); stopWaveform(); return }
        await handleTranscript(finalTranscript, Date.now() - t0)
      }

      recognition.onresult = (e: any) => {
        let interim = ''
        let final = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript
          else interim += e.results[i][0].transcript
        }
        setTranscript(interim || final)
        if (final) finalTranscript += ' ' + final.trim()
      }
      recognition.start()
      setStatus('listening')

      // Start waveform via mic stream
      navigator.mediaDevices.getUserMedia({ audio: true }).then(startWaveform)
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        startWaveform(stream)
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []
        const t0 = Date.now()
        recorder.ondataavailable = e => chunks.push(e.data)
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop())
          stopWaveform()
          const sttMs = Date.now() - t0
          setStatus('thinking')
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
          const { text } = await res.json()
          if (text) { setTranscript(text); await handleTranscript(text, sttMs) }
          else setStatus('idle')
        }
        recognitionRef.current = { stop: () => recorder.stop() }
        recorder.start()
        setStatus('listening')
        setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, 8000)
      })
    }
  }

  const stop = () => {
    if (status === 'listening') {
      recognitionRef.current?.stop()
      stopWaveform()
      // onend will fire automatically and call handleTranscript
      return
    }
    audioRef.current?.pause()
    audioRef.current = null
    stopWaveform()
    setStatus('idle')
  }

  const switchPersona = (id: string) => {
    stop()
    setMessages([])
    setLatency(null)
    setPersonaId(id)
    const p = personas.find(p => p.id === id)!
    setVoiceId(p.defaultVoiceId)
  }

  const exportTranscript = () => {
    if (!messages.length) return
    const lines = messages.map(m => {
      const speaker = m.role === 'user' ? 'You' : currentPersona.name
      return `${speaker}:\n${m.content}\n`
    }).join('\n')
    const blob = new Blob([lines], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workshop-session-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const statusConfig = {
    idle:      { color: '#94a3b8', label: 'Press Space or click mic', pulse: false },
    listening: { color: '#e63946', label: 'Listening...', pulse: true },
    thinking:  { color: '#f59e0b', label: 'Thinking...', pulse: true },
    speaking:  { color: '#10b981', label: 'Speaking...', pulse: true },
  }
  const { color, label, pulse } = statusConfig[status]

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#f1f5f9',
      padding: '0 0 120px'
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1px solid #ffffff10',
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(10px)',
        position: 'sticky', top: 0, zIndex: 10,
        background: '#0f0f0fee'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🧱</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>LEGO Workshop Voice Agent</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Groq · ElevenLabs · Web Speech API</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {latency && (
            <div style={{
              fontSize: 11, color: '#475569',
              display: 'flex', gap: 8,
              background: '#ffffff08', padding: '4px 10px',
              borderRadius: 20, border: '1px solid #ffffff10'
            }}>
              <span>STT <strong style={{ color: '#94a3b8' }}>{latency.stt}ms</strong></span>
              <span>LLM <strong style={{ color: '#94a3b8' }}>{latency.llm}ms</strong></span>
              <span>TTS <strong style={{ color: '#94a3b8' }}>{latency.tts}ms</strong></span>
            </div>
          )}
          {messages.length > 0 && (
            <button onClick={exportTranscript} style={{
              background: '#ffffff10', border: '1px solid #ffffff15',
              color: '#94a3b8', borderRadius: 8, padding: '5px 12px',
              fontSize: 12, cursor: 'pointer'
            }}>⬇ Export</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1.25rem' }}>

        {/* Persona selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
          {personas.map(p => (
            <button key={p.id} onClick={() => switchPersona(p.id)} style={{
              padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
              border: personaId === p.id ? '2px solid #e63946' : '1px solid #ffffff15',
              background: personaId === p.id
                ? 'linear-gradient(135deg, #e6394615, #e6394605)'
                : '#ffffff08',
              color: personaId === p.id ? '#f87171' : '#94a3b8',
              fontWeight: personaId === p.id ? 600 : 400,
              fontSize: 12, transition: 'all 0.2s', textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{p.emoji}</div>
              <div>{p.name}</div>
            </button>
          ))}
        </div>

        {/* Voice selector */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 24, padding: '10px 14px',
          background: '#ffffff06', borderRadius: 12,
          border: '1px solid #ffffff10'
        }}>
          <span style={{ fontSize: 12, color: '#475569', flexShrink: 0 }}>🔊 Voice</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {voices.map(v => (
              <button key={v.id} onClick={() => setVoiceId(v.id)} style={{
                padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                border: voiceId === v.id ? '1px solid #e63946' : '1px solid #ffffff15',
                background: voiceId === v.id ? '#e6394620' : 'transparent',
                color: voiceId === v.id ? '#f87171' : '#64748b',
                fontSize: 12, fontWeight: voiceId === v.id ? 600 : 400,
                transition: 'all 0.15s'
              }}>
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, minHeight: 200 }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center', color: '#334155', fontSize: 14,
              padding: '3rem 0', lineHeight: 2
            }}>
              Start a conversation with {currentPersona.character}<br/>
              <span style={{ fontSize: 12, color: '#1e293b' }}>Press Space or click the mic below</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <span style={{ fontSize: 11, color: '#475569', marginBottom: 5, padding: '0 4px' }}>
                {m.role === 'user' ? 'You' : `${currentPersona.emoji} ${currentPersona.character}`}
              </span>
              <div style={{
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #e63946, #c1121f)'
                  : '#1e293b',
                color: '#f1f5f9',
                padding: '0.75rem 1.1rem', borderRadius: 18,
                maxWidth: '72%', fontSize: 14, lineHeight: 1.65,
                border: m.role === 'assistant' ? '1px solid #ffffff10' : 'none',
                borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
              }}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Live transcript */}
        {transcript && (
          <div style={{
            background: '#f59e0b18', border: '1px solid #f59e0b40',
            borderRadius: 12, padding: '0.75rem 1rem',
            marginBottom: 20, fontSize: 14, color: '#fbbf24',
            fontStyle: 'italic'
          }}>
            {transcript}
          </div>
        )}
      </div>

      {/* Bottom bar — mic + waveform + status */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0a0a0af0',
        borderTop: '1px solid #ffffff10',
        backdropFilter: 'blur(20px)',
        padding: '1rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
      }}>
        {/* Waveform */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          height: 52, opacity: status === 'listening' ? 1 : 0,
          transition: 'opacity 0.3s'
        }}>
          {waveHeights.map((h, i) => (
            <div key={i} style={{
              width: 3, height: h,
              borderRadius: 2,
              background: `hsl(${350 + i * 2}, 80%, ${55 + i}%)`,
              transition: 'height 0.05s ease'
            }} />
          ))}
        </div>

        {/* Status + mic button row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
              boxShadow: pulse ? `0 0 0 4px ${color}44` : 'none', transition: 'all 0.3s'
            }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
          </div>

          <button onClick={status === 'idle' ? startListening : stop} style={{
            width: 64, height: 64, borderRadius: '50%',
            cursor: 'pointer', fontSize: 24,
            background: status === 'idle'
              ? 'linear-gradient(135deg, #e63946, #c1121f)'
              : '#1e293b',
            color: '#fff', transition: 'all 0.2s',
            boxShadow: status === 'listening'
              ? '0 0 0 12px #e6394633, 0 0 0 6px #e6394455'
              : '0 4px 20px #e6394633',
            transform: status === 'listening' ? 'scale(1.08)' : 'scale(1)',
            border: status !== 'idle' ? '2px solid #ffffff20' : 'none'
          } as any}>
            {status === 'idle' ? '🎙' : '⏹'}
          </button>

          <div style={{ minWidth: 160, textAlign: 'right' }}>
            <span style={{ fontSize: 11, color: '#334155' }}>Click again to send</span>
          </div>
        </div>
      </div>
    </main>
  )
}