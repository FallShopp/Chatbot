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
    const themeSwitcher = document.getElementById('theme-switcher');

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];
    let attachedFile = null;

    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '' && !attachedFile;
    };

    const tampilkanPesan = (parts, sender) => {
        if (welcomeView) { welcomeView.style.display = 'none'; }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const avatarUrl = sender === 'user' ? null : 'https://files.catbox.moe/f2er59.jpg';
        const senderName = sender === 'user' ? 'You' : 'Fall Asisten AI';
        
        let contentInnerHtml = '';
        parts.forEach(part => {
            if (part.text) { contentInnerHtml += marked.parse(part.text); }
            // Logika untuk menampilkan file/gambar
            else if (part.inlineData) {
                contentInnerHtml += `<p><em>[File terlampir: ${part.inlineData.mimeType}]</em></p>`;
            }
        });

        const finalMessageHtml = `
            <div class="message-content-wrapper">
                <div class="sender-name">${senderName}</div>
                <div class="message-content">${contentInnerHtml}</div>
            </div>`;
        
        messageElement.innerHTML = (avatarUrl ? `<img src="${avatarUrl}" class="message-avatar">` : '') + finalMessageHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });

        tampilkanPesan(userParts, 'user');
        conversationHistory.push({ role: 'user', parts: userParts });

        userInput.value = "";
        // Hapus pratinjau file setelah dikirim
        // removeAttachedFile();
        updateSendButtonState();
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `
            <img src="https://files.catbox.moe/f2er59.jpg" class="message-avatar">
            <div class="message-content-wrapper">
                <div class="sender-name">Fall Asisten AI</div>
                <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan([{ text: botResponse }], 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan([{ text: `Maaf, terjadi kesalahan: ${error.message}` }], 'bot');
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
        location.reload();
    });
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        alert(`File "${file.name}" dipilih! Logika untuk handle file ada di sini.`);
        // Tambahkan kembali logika FileReader untuk pratinjau dan pengiriman
        updateSendButtonState();
    });
    themeSwitcher.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        // Simpan preferensi tema
    });

    // --- INISIALISASI ---
    updateSendButtonState();
});
