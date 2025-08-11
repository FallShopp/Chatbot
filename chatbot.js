document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSİ ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const googleSearchSwitcher = document.getElementById('google-search-switcher');
    // ... (Seleksi elemen lain seperti sidebar, attach button, dll)
    const menuToggleButton = document.getElementById('menu-toggle-btn');

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];

    const tampilkanPesan = (content, sender) => {
        // ... (Fungsi ini tidak berubah dari versi sebelumnya)
    };

    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;
        
        tampilkanPesan(promptText, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: promptText }] });
        userInput.value = "";
        updateInputButtons();
        
        const thinkingIndicator = document.createElement('div');
        // ... (Kode indikator berpikir tidak berubah)
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // Cek apakah toggle Google Search aktif
            const useGoogleSearch = googleSearchSwitcher.checked;
            
            // Kirim riwayat dan status toggle ke backend
            const botResponse = await geminiChatAi(conversationHistory, useGoogleSearch);
            
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan(botResponse, 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan(`Maaf, terjadi kesalahan: ${error.message}`, 'bot');
        }
    };

    // Panggilan API diperbarui untuk mengirim status searchGoogle
    const geminiChatAi = async (history, searchGoogle = false) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ history, searchGoogle }) // Kirim status toggle
        });
        if (!response.ok) { 
            const errorData = await response.json(); 
            throw new Error(errorData.error || `Error dari server: ${response.status}`); 
        }
        const data = await response.json();
        return data.text;
    };
    
    const updateInputButtons = () => {
        if (userInput.value.trim() !== '') {
            micBtn.classList.add('hidden');
            sendButton.classList.remove('hidden');
        } else {
            micBtn.classList.remove('hidden');
            sendButton.classList.add('hidden');
        }
    };

    // --- EVENT LISTENERS ---
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); }
    });
    userInput.addEventListener('input', updateInputButtons);

    // Aktifkan semua tombol lain di sini...
    // menuToggleButton.addEventListener('click', ...);
    
    // --- INISIALISASI ---
    updateInputButtons();
});
