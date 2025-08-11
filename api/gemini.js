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
    
    const requestBody = {
        systemInstruction: {
            parts: [{ text: "Anda adalah 'Fall Moderators AI', asisten AI yang canggih, ramah, dan profesional..." }]
        },
        contents: history, 
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        generationConfig: {
            temperature: 0.8, // Sedikit lebih kreatif
            maxOutputTokens: 4096,
        }
    };
    
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