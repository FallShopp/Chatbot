// File: chatbot.js (Versi Sederhana & Stabil)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SELEKSI ELEMEN DASAR ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeView = document.querySelector('.welcome-view');

    // Pastikan semua elemen ditemukan
    if (!chatBox || !userInput || !sendButton || !welcomeView) {
        console.error("Elemen penting tidak ditemukan! Periksa ID di HTML Anda.");
        return;
    }

    // --- 2. STATE APLIKASI ---
    let conversationHistory = [];

    // --- 3. FUNGSI UTAMA ---

    // Fungsi untuk menampilkan pesan di layar
    const tampilkanPesan = (text, sender) => {
        // Sembunyikan pesan selamat datang jika ada
        if (welcomeView.parentElement === chatBox) {
            chatBox.removeChild(welcomeView);
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const avatarUrl = 'https://files.catbox.moe/f2er59.jpg';
        let contentHtml = '';
        
        if (sender === 'bot') {
            contentHtml = `<img src="${avatarUrl}" class="message-avatar">`;
        }
        
        // Menggunakan Marked.js untuk mem-parse markdown
        contentHtml += `<div class="message-content">${marked.parse(text)}</div>`;
        
        messageElement.innerHTML = contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // Fungsi untuk memanggil backend proxy Anda
    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        try {
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error dari server: ${response.status}`);
            }
            
            const data = await response.json();
            return data.text;
        } catch (error) {
            console.error("Fetch error:", error);
            // Kembalikan pesan error yang akan ditampilkan di chat
            return `Terjadi kesalahan jaringan atau server: ${error.message}`;
        }
    };

    // Fungsi yang dijalankan saat tombol kirim diklik
    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;

        // Tampilkan pesan pengguna
        tampilkanPesan(promptText, 'user');
        // Simpan pesan pengguna ke riwayat
        conversationHistory.push({ role: 'user', parts: [{ text: promptText }] });
        userInput.value = ""; // Kosongkan input

        // Tampilkan indikator loading
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<img src="https://files.catbox.moe/f2er59.jpg" class="message-avatar"><div class="message-content">...</div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Kirim riwayat ke AI dan tunggu jawaban
        const botResponse = await geminiChatAi(conversationHistory);

        // Hapus indikator loading
        chatBox.removeChild(loadingIndicator);
        
        // Tampilkan jawaban AI
        tampilkanPesan(botResponse, 'bot');
        // Simpan jawaban AI ke riwayat
        conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
    };

    // --- 4. EVENT LISTENERS ---

    // Klik tombol kirim
    sendButton.addEventListener('click', kirimPesan);

    // Tekan 'Enter' untuk mengirim
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            kirimPesan();
        }
    });

    console.log("Asisten AI siap.");
});
