<div align="center">

# 🧱 LEGO Workshop Voice Agent

### Real-time voice AI facilitation — powered by LLaMA 3.3 & ElevenLabs

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=for-the-badge)](https://groq.com)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Flash_TTS-6C3FC4?style=for-the-badge)](https://elevenlabs.io)

<br/>

> Speak naturally to AI-powered workshop personas — Facilitator, Coach, Creative Director — and hear them respond in a human voice, **with near-zero latency**, in real time.

</div>

---

## 🎯 What It Does

**LEGO Workshop Voice Agent** is a production-grade voice AI application that replaces static facilitation scripts with intelligent, responsive AI personas for LEGO Serious Play workshops. Speak a question or prompt — and within seconds you receive:

- 🧱 **3 distinct AI personas** — Workshop Facilitator, Team Coach, Creative Director — each with its own system prompt, tone, and facilitation style
- 🎙 **Fully voice-first** — no typing, no clicking submit — just speak and listen
- ⚡ **Sub-second response pipeline** — Groq's LPU inference + ElevenLabs Flash TTS deliver a complete voice turn in under a second
- 📊 **Live latency instrumentation** — STT, LLM, and TTS timings measured and displayed individually per turn
- 🔊 **5 switchable voices** — change the AI's voice mid-session without losing conversation context
- 📥 **Session transcript export** — download the full spoken conversation as a `.txt` file

The entire experience is **voice-in, voice-out** — it feels like talking to a real workshop facilitator, not using an app.

---

## ⚙️ Engineering Highlights

The decisions that separate this from a tutorial project:

| # | Decision | Why It Matters |
|---|----------|----------------|
| 1 | **Groq LPU for LLM inference** | Achieves ~500 tokens/sec — fast enough to feed TTS before the full response is generated, compressing perceived latency |
| 2 | **ElevenLabs Flash v2.5 TTS** | Optimised specifically for low-latency streaming — the AI starts speaking before the full text is ready |
| 3 | **Dual STT with transparent fallback** | Browser-native Web Speech API is used first; if unavailable, audio is silently routed to a server-side Whisper endpoint — no UX disruption |
| 4 | **Audio interruption on mic activation** | If the AI is mid-speech and the user activates the mic, playback is killed immediately and the `onended` callback is nullified first — preventing state collisions between the old and new response |
| 5 | **Persona-aware prompt architecture** | Each of the 3 personas carries a fully distinct system prompt — different vocabulary, facilitation philosophy, and conversational register — not just a name swap |
| 6 | **Stateless API route design** | `/api/chat` and `/api/speak` are fully stateless — independently deployable on Vercel's serverless edge with no shared state between requests |

---

## 🏗️ System Architecture

```
User Voice Input
      │
      ▼
Web Speech API  ──(browser unavailable)──▶  /api/transcribe  (Whisper via Groq)
      │
      ▼
POST /api/chat
      │
      ├── Persona system prompt (from lib/personas.ts)
      │
      └── Groq API (LLaMA 3.3 70B Versatile) ──▶ Streamed response text
                                                          │
                                                          ▼
                                               POST /api/speak
                                                          │
                                               ElevenLabs Flash v2.5 TTS
                                                          │
                                                          ▼
                                               Browser Audio Playback
```

Every privileged API key — Groq, ElevenLabs — lives **server-side only** inside Next.js API routes. The browser never touches them directly.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **LLM** | Groq SDK — LLaMA 3.3 70B Versatile |
| **TTS** | ElevenLabs Flash v2.5 |
| **STT** | Web Speech API + Whisper (server fallback) |
| **Deployment** | Vercel |

---

## 📂 Project Structure

```
voice-workshop-agent/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Groq LLM streaming endpoint
│   │   ├── speak/route.ts      # ElevenLabs TTS audio endpoint
│   │   └── transcribe/route.ts # Whisper STT fallback endpoint
│   ├── page.tsx                # Main voice interface & session state
│   ├── layout.tsx              # Root layout
│   └── globals.css
├── lib/
│   └── personas.ts             # AI persona definitions & voice configuration
```

---

## 🔐 Security Design

- All API keys (Groq, ElevenLabs) are stored as **environment variables** and accessed exclusively in server-side API routes — never exposed to the client bundle
- `.env.local` is globally gitignored — no credentials are ever committed to source control
- API routes act as a **secure proxy layer** — the browser only ever calls internal Next.js endpoints, never third-party APIs directly

---

## 💡 Skills Demonstrated

`Full-Stack Development` · `Voice AI Pipeline` · `LLM Integration` · `Text-to-Speech` · `Speech Recognition` · `TypeScript` · `Next.js App Router` · `Streaming APIs` · `Secure API Design` · `Real-time Audio` · `Prompt Engineering` · `System Architecture`

---

<div align="center">

<br/>

Built by **[Shashank Goel](https://github.com/Shashank-Ge)**

<br/>

</div>
