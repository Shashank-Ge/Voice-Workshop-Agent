import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json()

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    stream: true,
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content: systemPrompt || `You are Sophie, a LEGO Serious Play workshop facilitator at Productive Play.
Keep responses conversational, warm, under 3 sentences, no bullet points, no markdown.`
      },
      ...messages
    ]
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    }
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}