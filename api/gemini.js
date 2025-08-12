// File: /api/gemini.js
export const config = { runtime: 'edge' };
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const { history } = await req.json();
    if (!history) { throw new Error('History is required.')};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { throw new Error("API Key not configured on the server."); }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: history, 
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };

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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respon.";
    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
      }
