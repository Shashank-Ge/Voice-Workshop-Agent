# 🧱 LEGO Workshop Voice Agent

A real-time voice AI agent for LEGO Serious Play workshops. Speak to AI-powered facilitators, coaches, and creative directors — and hear them respond in natural voice, instantly.

Built with **Next.js**, **Groq** (LLaMA 3.3 70B), and **ElevenLabs** TTS.

---

## Features

- 🎙 **Voice-first interface** — speak naturally, no typing needed
- ⚡ **Ultra-low latency** — Groq's LPU inference + ElevenLabs Flash TTS
- 🧱 **3 AI personas** — Workshop Facilitator, Team Coach, Creative Director
- 🔊 **5 voice options** — switch voices mid-session
- 📊 **Live latency metrics** — STT / LLM / TTS breakdown
- 📥 **Export transcripts** — download full session as `.txt`
- ⌨️ **Keyboard shortcut** — Space bar to start/stop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| LLM | Groq · LLaMA 3.3 70B Versatile |
| TTS | ElevenLabs · Flash v2.5 |
| STT | Web Speech API (browser-native) / Whisper fallback |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx              # Main voice interface
  api/
    chat/route.ts       # Groq LLM streaming endpoint
    speak/route.ts      # ElevenLabs TTS endpoint
    transcribe/route.ts # Whisper STT fallback endpoint
lib/
  personas.ts           # AI persona definitions + voice list
```

---

## License

MIT
