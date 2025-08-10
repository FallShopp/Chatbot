// File: /api/generate-image.js

// Import library yang diperlukan untuk berinteraksi dengan model gambar
// Catatan: Ini adalah contoh konseptual. Di Vercel, Anda mungkin perlu menginstal package.
// Namun, untuk Gemini, kita akan menggunakan fetch API ke endpoint yang sesuai.

export const config = {
  runtime: 'edge',
};

// Fungsi ini akan menggunakan model 'gemini-pro-vision' atau model gambar lainnya
// Untuk saat ini, kita akan simulasikan dengan API yang ada, dengan prompt khusus
// Di masa depan, ini bisa diganti dengan API Image Generation yang sebenarnya.

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Invalid request: prompt is required.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Untuk membuat gambar, kita akan menggunakan model yang berbeda, misalnya Imagen.
    // Di sini kita akan menggunakan model Gemini yang sama tetapi dengan prompt yang dimodifikasi
    // untuk menghasilkan deskripsi gambar yang sangat detail, yang kemudian bisa kita gunakan
    // sebagai sumber gambar (misalnya dari Unsplash atau API gambar lainnya).
    // Ini adalah pendekatan sementara. Untuk pembuatan gambar nyata, Anda akan memanggil
    // endpoint API gambar.
    // Mari kita asumsikan kita punya akses ke API yang bisa membuat gambar dari teks.
    
    // Di sini, kita akan gunakan pendekatan yang lebih realistis dengan Gemini:
    // Minta Gemini untuk membuat deskripsi gambar yang sangat detail, lalu gunakan
    // deskripsi itu untuk mencari gambar atau (seperti yang akan kita lakukan)
    // langsung menggunakan API pembuatan gambar jika tersedia.

    // Untuk contoh ini, kita akan membuat placeholder gambar dengan prompt di atasnya
    // karena memanggil API gambar eksternal dari serverless function bisa kompleks.
    // Sebagai alternatif, mari kita gunakan pendekatan yang lebih canggih.

    // Pendekatan Final: Mari kita asumsikan Google menyediakan endpoint untuk ini
    // melalui API yang sama (seperti model `imagen`). Kita akan panggil itu.
    // Karena kita tidak memiliki akses langsung, kita akan minta Gemini untuk
    // *mendeskripsikan* URL gambar yang cocok.

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API Key for Gemini is not configured on the server.");
    }
    
    // Kita akan memodifikasi prompt untuk meminta URL gambar
    const imageSearchPrompt = `Saya butuh URL ke sebuah gambar yang mewakili deskripsi berikut: "${prompt}". Berikan hanya URL langsung (direct link) ke file gambar (berakhiran .jpg, .png, .webp). Jangan berikan penjelasan apa pun, hanya URL. Gunakan Unsplash API atau sumber gambar bebas royalti lainnya. Contoh: https://images.unsplash.com/photo-12345.jpg`;
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{ parts: [{ text: imageSearchPrompt }] }],
      generationConfig: {
        temperature: 0.4,
      }
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
    let imageUrl = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Bersihkan jawaban AI untuk memastikan hanya URL yang tersisa
    imageUrl = imageUrl.trim().split('\n')[0];
    
    if (!imageUrl.startsWith('http')) {
        // Jika AI gagal memberikan URL, kita cari di Unsplash sebagai fallback
        imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(prompt)}`;
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in image generation proxy:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
