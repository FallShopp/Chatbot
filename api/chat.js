// File: /api/chat.js (Backend Baru untuk OpenAI)

import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

// Inisialisasi OpenAI client dengan API Key dari Environment Variable
// PENTING: Nama variabel kini OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { history } = await req.json();
    if (!history) { throw new Error('History is required.') };

    // Transformasi format pesan dari format kita ke format yang dimengerti OpenAI
    // Gemini: { role: 'user', parts: [{ text: '...' }] }
    // OpenAI: { role: 'user', content: '...' }
    const messagesForOpenAI = history.map(message => ({
      role: message.role === 'model' ? 'assistant' : 'user', // OpenAI menggunakan 'assistant' untuk AI
      content: message.parts[0].text,
    }));

    // Menambahkan instruksi sistem yang konsisten
    const systemMessage = {
      role: 'system',
      content: "Anda adalah 'Fall Asisten AI', sebuah asisten AI yang ramah, canggih, dan selalu siap membantu."
    };

    // Panggil API OpenAI
    const chatCompletion = await openai.chat.completions.create({
        messages: [systemMessage, ...messagesForOpenAI],
        model: 'gpt-4o-mini', // Menggunakan model terbaru dan efisien dari OpenAI
    });

    const responseText = chatCompletion.choices[0].message.content;

    // Kirim kembali jawaban ke frontend
    return new Response(JSON.stringify({ text: responseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in OpenAI proxy function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
