import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; 
import { collection, addDoc } from 'firebase/firestore'; 

// ====================================================================================================
// POST REQUEST CONTROLLER / CONTROLADOR DE PETICIÓN POST
// ====================================================================================================

export async function POST(req: NextRequest) {
  try {
    // ====================================================================================================
    // GEMINI CONFIGURATION / CONFIGURACIÓN DE GEMINI
    // ====================================================================================================
    const body = await req.json();
    
    const { position, addressContext, userId } = body; 

    // Credentials / Credenciales
    const API_KEY = "YOUR_GEMINI_API_KEY_HERE";
    const MODEL_ID = "gemini-3-pro-preview";

    const locationText = addressContext || `${position.lat}, ${position.lng}`;

    // ====================================================================================================
    // CONTENT GENERATION ENGINE (AI) / MOTOR DE GENERACIÓN DE CONTENIDO (IA)
    // ====================================================================================================
    
    // JSON
    const prompt = `
      You are an Expert Real Estate Investment Consultant.
      Analyze the location: ${locationText}.
      
      Generate a detailed investment analysis in ENGLISH.
      IMPORTANT: Respond ONLY with this valid JSON (no markdown):
      {
        "zona_nombre": "Area Name",
        "score": 85,
        "plusvalia_estimada": "High",
        "razonamiento_breve": "Short strategic reasoning in English.",
        "analisis_demografico": "Detailed demographic profile in English.",
        "analisis_competencia": "Nearby business analysis in English.",
        "recomendacion_negocio": { 
            "giro": "e.g. Specialty Coffee Shop", 
            "justificacion": "English explanation of why this works", 
            "target": "Specific audience description" 
        },
        "finanzas": { 
            "costo_m2_promedio": "$2,500 USD", 
            "renta_mensual_estimada": "$1,500 USD", 
            "inversion_total_estimada": "$50,000 USD", 
            "roi_retorno": "24 months", 
            "ticket_promedio": "$15 USD" 
        },
        "pros": ["Benefit 1", "Benefit 2"], 
        "contras": ["Risk 1", "Risk 2"],
        "ubicacion_coordenadas": { "lat": ${position.lat}, "lng": ${position.lng} }
      }
    `;

    // Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
                temperature: 0.2,
                response_mime_type: "application/json" 
            }
        })
    });

    // ====================================================================================================
    // RESPONSE PROCESSING AND VALIDATION / PROCESAMIENTO Y VALIDACIÓN DE RESPUESTA
    // ====================================================================================================

    const data = await response.json();

    if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message}`);
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
        throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(resultText);


    // ====================================================================================================
    // DATA PERSISTENCE LAYER / CAPA DE PERSISTENCIA DE DATOS 
    // ====================================================================================================
    
    if (userId) {
      await addDoc(collection(db, "analyses"), {
        userId: userId,
        ...result,
        createdAt: new Date().toISOString()
      });
    }

    // ====================================================================================================
    // CUSTOMER RESPONSE / RESPUESTA AL CLIENTE
    // ====================================================================================================
    
    return NextResponse.json({ result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}