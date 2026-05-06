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

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd voice-workshop-agent
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
```

Get your keys:
- [Groq Console](https://console.groq.com) — free tier available
- [ElevenLabs](https://elevenlabs.io) — free tier available

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

> Add your `GROQ_API_KEY` and `ELEVENLABS_API_KEY` as environment variables in the Vercel dashboard.

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
