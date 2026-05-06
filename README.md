# 🧱 LEGO Workshop Voice Agent

> **A real-time, voice-first AI facilitation platform for LEGO Serious Play workshops.**  
> Speak to AI-powered personas — Workshop Facilitator, Team Coach, Creative Director — and hear them respond in natural voice with near-zero latency.

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=flat-square)](https://groq.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Flash_TTS-purple?style=flat-square)](https://elevenlabs.io)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

---

## 🎯 What It Does

This application replaces static facilitation scripts with intelligent, responsive AI personas that guide teams through LEGO Serious Play sessions in real time. Users speak naturally — the agent listens, thinks, and responds in a human voice, making the experience feel like talking to a real workshop facilitator.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎙 **Voice-First Interface** | No typing needed — speak naturally and receive spoken responses |
| ⚡ **Ultra-Low Latency Pipeline** | Groq LPU inference + ElevenLabs Flash TTS for near-real-time turns |
| 🧱 **3 Distinct AI Personas** | Workshop Facilitator · Team Coach · Creative Director |
| 🔊 **5 Switchable Voices** | Change AI voice mid-session without losing context |
| 📊 **Live Latency Metrics** | Granular STT / LLM / TTS breakdown shown in the UI |
| 📥 **Session Transcript Export** | Download the full conversation log as a `.txt` file |
| ⌨️ **Keyboard Shortcut** | Spacebar to start/stop recording for a seamless flow |

---

## 🏗️ Architecture & Tech Stack

```
User Voice Input
      │
      ▼
 Web Speech API  ──(fallback)──►  Whisper STT (Groq API)
      │
      ▼
  Groq LLM  ◄──  Persona system prompt (from lib/personas.ts)
  (LLaMA 3.3 70B Versatile)
      │
      ▼
  ElevenLabs Flash v2.5 TTS
      │
      ▼
  Browser Audio Playback
```

### Stack Breakdown

| Layer | Technology | Role |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework with server-side API routes |
| **LLM** | Groq · LLaMA 3.3 70B | Ultra-fast inference via Groq's custom LPU hardware |
| **TTS** | ElevenLabs · Flash v2.5 | High-quality, low-latency text-to-speech synthesis |
| **STT** | Web Speech API + Whisper | Browser-native transcription with a server-side fallback |
| **Deployment** | Vercel | Edge-optimized serverless hosting |

---

## 🔑 Engineering Highlights

- **Streaming LLM responses** fed directly into TTS to minimize the perceived wait time between speaking and hearing a reply.
- **Persona-aware prompt engineering** — each of the 3 AI roles carries a distinct system prompt with tailored tone, vocabulary, and facilitation style.
- **Latency instrumentation** — the app measures and displays each stage of the STT → LLM → TTS pipeline independently, enabling performance profiling.
- **Graceful STT fallback** — if the browser's Web Speech API is unavailable, audio is routed to a server-side Whisper transcription endpoint transparently.
- **Stateless API design** — each `/api/chat` and `/api/speak` call is independently deployable on Vercel's serverless edge functions.

---

## 📁 Project Structure

```
app/
  page.tsx              # Main voice interface & session state
  api/
    chat/route.ts       # Groq LLM streaming endpoint
    speak/route.ts      # ElevenLabs TTS audio endpoint
    transcribe/route.ts # Whisper STT fallback endpoint
components/
  ...                   # Reusable UI components
hooks/
  ...                   # Custom React hooks (mic, audio, state)
lib/
  personas.ts           # AI persona definitions & voice configuration
```

---

## 👤 About This Project

Built as a personal exploration of real-time voice AI pipelines, combining frontier LLMs with professional-grade TTS to create a genuinely useful facilitation tool. The focus was on minimizing latency at every stage while keeping the persona experience consistent and natural.

---

*This repository is for portfolio display purposes. Source code is proprietary.*
