import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    
    const apiKey = process.env.GOOGLE_API_KEY || 
                   process.env.GEMINI_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Missing' }, { status: 500 });
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    // VOICE
    const body = {
      input: { text },
      voice: { 
        languageCode: 'en-US', 
        name: 'en-US-Standard-C', 
        ssmlGender: 'FEMALE'
      },
      audioConfig: { 
        audioEncoding: 'MP3',
        pitch: 4.0, 
        speakingRate: 1.05
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("TTS API FAIL:", data);
        return NextResponse.json({ error: data.error?.message || 'TTS API failed' }, { status: 500 });
    }

    return NextResponse.json({ audioContent: data.audioContent });

  } catch (error: any) {
    console.error("TTS SERVER FAIL:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}