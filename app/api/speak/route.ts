import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json()

  const selectedVoice = voiceId || process.env.ELEVENLABS_VOICE_ID

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return new Response(err, { status: res.status })
  }

  return new Response(res.body, {
    headers: { 'Content-Type': 'audio/mpeg' }
  })
}