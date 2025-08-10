// Mengambil elemen-elemen dari HTML
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('pesan');
const sendButton = document.getElementById('kirim-btn');
const typingIndicator = document.getElementById('typing-indicator');

// --- FUNGSI UTAMA UNTUK MENGIRIM PESAN ---
// Kita menggunakan 'async' agar bisa memakai 'await' untuk menunggu respon dari API
async function kirimPesan() {
    const messageText = userInput.value.trim();

    if (messageText === "") {
        return; // Jangan kirim pesan kosong
    }

    // 1. Tampilkan pesan pengguna di UI
    tampilkanPesan(messageText, 'user');
    userInput.value = "";
    
    // 2. Tampilkan indikator "sedang mengetik"
    tampilkanIndikatorMengetik(true);

    try {
        // 3. Panggil API Gemini dan tunggu hasilnya (menggunakan await)
        const botResponse = await geminiChatAi(messageText);

        // 4. Setelah dapat jawaban, tampilkan di UI
        tampilkanPesan(botResponse, 'bot');

    } catch (error) {
        // Jika terjadi error saat memanggil API
        console.error("Gagal menghubungi API Gemini:", error);
        tampilkanPesan("Maaf, terjadi kesalahan. Tidak bisa terhubung ke AI saat ini.", 'bot');
    } finally {
        // 5. Apapun hasilnya (sukses atau gagal), sembunyikan indikator "mengetik"
        tampilkanIndikatorMengetik(false);
    }
}

// --- FUNGSI UNTUK MENGHUBUNGI GEMINI API ---
async function geminiChatAi(prompt) {
    // PENTING: Ganti "api_KEY" dengan API Key Anda yang sebenarnya.
    const apiKey = "api_KEY"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            // Menangani error HTTP seperti 404 atau 500
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Cek struktur data balasan dari Gemini
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // Jika balasan ada tapi tidak sesuai format yang diharapkan
            console.error("API response format tidak valid:", data);
            return "Maaf, saya menerima respon yang tidak valid dari AI.";
        }
    } catch (error) {
        // Menangkap error jaringan atau error dari 'throw new Error' di atas
        console.error("Error dalam fetch ke Gemini API:", error);
        // Melempar error lagi agar bisa ditangkap oleh blok catch di fungsi kirimPesan()
        throw error; 
    }
}


// --- FUNGSI-FUNGSI BANTUAN UNTUK UI ---

// Fungsi untuk menampilkan pesan di UI
function tampilkanPesan(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
    messageElement.textContent = text;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Fungsi untuk menampilkan atau menyembunyikan indikator mengetik
function tampilkanIndikatorMengetik(show) {
    typingIndicator.style.display = show ? 'block' : 'none';
    if (show) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Event listener untuk mengirim pesan dengan menekan tombol 'Enter'
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        kirimPesan();
    }
});
