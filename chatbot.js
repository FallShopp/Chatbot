document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeView = document.querySelector('.welcome-view');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];

    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '';
    };

    const tampilkanPesan = (content, sender) => {
        if (welcomeView) { welcomeView.style.display = 'none'; }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        const senderName = sender === 'user' ? 'You' : 'Fall Asisten AI';

        messageElement.innerHTML = `
            <div class="message-header">${senderName}</div>
            <div class="message-content">${marked.parse(content)}</div>
        `;
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;

        tampilkanPesan(promptText, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: promptText }] });
        userInput.value = "";
        updateSendButtonState();
        
        // Indikator loading bisa ditambahkan di sini
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot-msg';
        loadingMessage.innerHTML = `<div class="message-header">Fall Asisten AI</div><div class="message-content">...</div>`;
        chatBox.appendChild(loadingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(loadingMessage); // Hapus loading
            tampilkanPesan(botResponse, 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(loadingMessage);
            tampilkanPesan(`Maaf, terjadi kesalahan: ${error.message}`, 'bot');
        }
    };

    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Error dari server: ${response.status}`); }
        const data = await response.json();
        return data.text;
    };
    
    // --- EVENT LISTENERS (SEMUA AKTIF) ---
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    userInput.addEventListener('input', updateSendButtonState);
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); }
    });
    newChatButton.addEventListener('click', () => {
        location.reload(); // Cara termudah untuk memulai chat baru
        document.body.classList.remove('sidebar-visible');
    });
    attachFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        alert(`File "${file.name}" dipilih! Logika untuk meng-handle file bisa ditambahkan di sini.`);
        // Di sini Anda bisa menambahkan kembali logika FileReader dari versi sebelumnya
    });
    
    // --- INISIALISASI ---
    updateSendButtonState();
});
