// ==========================================================================================
// IMPORTS / IMPORTACIONES
// ==========================================================================================

import { NextRequest, NextResponse } from 'next/server';

// ==========================================================================================
// POST
// ==========================================================================================

export async function POST(req: NextRequest) {
  try {
    // API
    const { text } = await req.json();
    
    const API_KEY = "YOUR_GOOGLE_CLOUD_API_KEY_HERE";
                   process.env.GEMINI_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

                   if (!API_KEY || API_KEY === "YOUR_GOOGLE_CLOUD_API_KEY_HERE") {
                    console.error("API Key is missing or not configured.");
                    return NextResponse.json({ error: 'API Key Missing. Please configure lib/firebase.ts or api/speak/route.ts' }, { status: 500 });
                  }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
    
 // ==========================================================================================
    // 2. VOICE CONFIGURATION (BRICKY) / CONFIGURACIÓN DE VOZ (BRICKY)
 // ==========================================================================================

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

 // ==========================================================================================
    // API REQUEST / PETICIÓN A LA API
 // ==========================================================================================

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