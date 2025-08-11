// File: /api/gemini.js (Versi Final dengan Google Search)

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Ambil riwayat DAN status tombol searchGoogle dari frontend
    const { history, searchGoogle } = await req.json();

    if (!history || !Array.isArray(history) || history.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid request: history is required.' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key for Gemini is not configured on the server.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const systemInstruction = { /* ... tidak berubah ... */ };
    
    let requestBody = {
        systemInstruction: {
            parts: [{ text: "Anda adalah 'Fall Asisten AI', asisten AI yang canggih, ramah, dan profesional..." }]
        },
        contents: history, 
        safetySettings: [ /* ... tidak berubah ... */ ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    };
    
    // FITUR BARU: Tambahkan alat Google Search jika diminta oleh frontend
    if (searchGoogle) {
        requestBody.tools = [{ "Google Search": {} }];
    }

    const googleResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!googleResponse.ok) {
        const errorData = await googleResponse.json();
        throw new Error(errorData.error?.message || `Google API error!`);
    }

    const data = await googleResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat memberikan respon saat ini.";

    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in proxy function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
