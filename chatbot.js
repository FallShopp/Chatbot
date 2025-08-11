document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSİ ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const welcomeView = document.querySelector('.welcome-view');
    // ... (Elemen lain dari sidebar/fitur sebelumnya bisa ditambahkan di sini jika ingin diaktifkan)

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];

    // Tampilkan pesan dengan gaya baru (tanpa nama pengirim)
    const tampilkanPesan = (content, sender) => {
        if (welcomeView) { welcomeView.style.display = 'none'; }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const botAvatar = `<div class="message-avatar">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg>
                           </div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        const contentHtml = `<div class="message-content">${marked.parse(content)}</div>`;
        
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // Fungsi Kirim Pesan dengan Indikator "Berpikir"
    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;
        
        tampilkanPesan(promptText, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: promptText }] });
        userInput.value = "";
        updateInputButtons();
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `
            <div class="thinking-logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg>
            </div>
            <span class="thinking-text">Harap tunggu...</span>
        `;
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan(botResponse, 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan(`Maaf, terjadi kesalahan: ${error.message}`, 'bot');
        }
    };

    // Panggilan API (tidak berubah)
    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Error dari server: ${response.status}`); }
        const data = await response.json();
        return data.text;
    };
    
    // --- LOGIKA UI BARU UNTUK INPUT ---
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

    // Placeholder untuk tombol lain yang ingin diaktifkan
    // document.getElementById('attach-file-btn').addEventListener('click', () => { /* ... logika upload ... */ });
    // document.getElementById('menu-toggle-btn').addEventListener('click', () => { /* ... logika sidebar ... */ });
    
    // --- INISIALISASI ---
    updateInputButtons(); // Set kondisi awal tombol
});
