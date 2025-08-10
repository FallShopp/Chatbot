// Konfigurasi ini memberitahu Vercel untuk menjalankan kode ini di Edge Network mereka yang cepat.
export const config = {
  runtime: 'edge',
};

// Ini adalah fungsi utama yang akan menangani permintaan
export default async function handler(req) {
  // Hanya izinkan metode POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { history } = await req.json();

    // --- PENYEMPURNAAN #4: Validasi Input ---
    // Memastikan 'history' adalah array yang tidak kosong.
    if (!history || !Array.isArray(history) || history.length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid request: history is required.' }), {
            status: 400, // Bad Request
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API Key for Gemini is not configured on the server.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // --- PENYEMPURNAAN #1: Instruksi Sistem ---
    // Memberi "jiwa" dan peran pada AI Anda. AI akan selalu mengikuti arahan ini.
    const systemInstruction = {
        role: "system",
        parts: [{
            text: "Anda adalah asisten AI yang canggih, ramah, dan profesional. Nama Anda adalah 'Asisten Gemini'. Selalu berikan jawaban yang terstruktur, informatif, dan mudah dimengerti. Jika Anda tidak tahu jawabannya, katakan terus terang. Jangan memberikan informasi yang berbahaya atau tidak etis."
        }]
    };
    
    const requestBody = {
        // Gabungkan instruksi sistem dengan riwayat percakapan dari pengguna
        contents: [systemInstruction, ...history], 
        
        // --- PENYEMPURNAAN #2: Pengaturan Keamanan ---
        // Blokir konten yang tidak pantas pada tingkat medium ke atas.
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        
        // --- PENYEMPURNAAN #3: Konfigurasi Generate ---
        generationConfig: {
            temperature: 0.7, // Kontrol kreativitas (0.0 - 1.0). 0.7 adalah nilai seimbang.
            maxOutputTokens: 2048, // Batasi panjang maksimal jawaban AI.
        }
    };

    // Kirim permintaan ke Google Gemini dari server
    const googleResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!googleResponse.ok) {
        const errorData = await googleResponse.json();
        console.error("Error from Google API:", errorData);
        // Jika diblokir oleh safety settings, beri pesan yang jelas
        if (errorData.promptFeedback?.blockReason) {
            throw new Error(`Permintaan diblokir karena alasan keamanan: ${errorData.promptFeedback.blockReason}`);
        }
        throw new Error(errorData.error?.message || `Google API error! status: ${googleResponse.status}`);
    }

    const data = await googleResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat memberikan respon saat ini.";

    // Kirim kembali respon teks dari AI ke frontend
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in proxy function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
