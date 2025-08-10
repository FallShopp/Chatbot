document.addEventListener('DOMContentLoaded', () => {
    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeView = document.querySelector('.welcome-view');
    const suggestionChipsContainer = document.getElementById('suggestion-chips-container');
    
    // Tombol Fungsional
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const infoBtn = document.getElementById('info-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    // Elemen Sidebar
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const archivedChatsList = document.getElementById('archived-chats-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const themeSwitcher = document.getElementById('theme-switcher');

    // --- STATE APLIKASI ---
    let allChats = [];
    let currentChatId = null;
    let conversationHistory = [];
    let attachedFile = null;
    let isFirstMessage = true;

    // --- FUNGSI UTAMA ---

    const startNewChat = () => {
        currentChatId = null; conversationHistory = [];
        chatBox.innerHTML = '';
        chatBox.appendChild(welcomeView);
        welcomeView.style.display = 'flex';
        
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'message-date-separator';
        dateSeparator.textContent = 'Hari ini';
        chatBox.appendChild(dateSeparator);

        tampilkanPesan({ parts: [{text: "Nama saya Fall Moderators AI. Anggap saya sebagai asisten yang siap membantu Anda. Apa yang bisa saya bantu hari ini?"}] }, 'bot');
        renderSuggestionChips();
        isFirstMessage = true;
        updateSendButtonState();
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        if (isFirstMessage) {
            welcomeView.style.display = 'none';
            suggestionChipsContainer.style.display = 'none';
            // Hapus pesan selamat datang & separator default
            const messages = chatBox.querySelectorAll('.message, .message-date-separator');
            messages.forEach(msg => msg.remove());
            isFirstMessage = false;
        }

        const timestamp = new Date().toISOString();
        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });
        
        tampilkanPesan({ parts: userParts, sender: 'user', timestamp });
        
        // Simpan ke riwayat
        if (!currentChatId) { currentChatId = Date.now().toString(); }
        saveMessageToHistory(userParts, 'user', timestamp);

        userInput.value = ""; removeAttachedFile();
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<img src="https://files.catbox.moe/f2er59.jpg" class="message-avatar"><div class="message-content">...</div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const historyForAPI = conversationHistory.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: msg.parts }));
            const botResponse = await geminiChatAi(historyForAPI);
            const botTimestamp = new Date().toISOString();
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan({ parts: [{text: botResponse}], sender: 'bot', timestamp: botTimestamp });
            saveMessageToHistory([{text: botResponse}], 'bot', botTimestamp);
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan({ parts: [{text: `Maaf, terjadi kesalahan: ${error.message}`}], sender: 'bot' });
        }
    };

    const tampilkanPesan = (messageData, sender) => {
        const { parts, timestamp } = messageData;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        const avatarUrl = 'https://files.catbox.moe/f2er59.jpg';
        let contentInnerHtml = '';

        parts.forEach(part => {
            if (part.text) {
                contentInnerHtml += marked.parse(part.text);
            } else if (part.inlineData) {
                 if (part.inlineData.mimeType.startsWith('image/')) {
                    contentInnerHtml += `<div class="sent-file"><img src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" alt="Attached Image"></div>`;
                } else {
                    contentInnerHtml += `<div class="sent-file"><span>📁 File terlampir</span></div>`;
                }
            }
        });

        let messageHtml = `<img src="${avatarUrl}" class="message-avatar"><div class="message-content">${contentInnerHtml}</div>`;
        if (sender === 'user') {
            messageHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        }
        
        messageElement.innerHTML = messageHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const geminiChatAi = async (history) => { /* ... tidak berubah ... */ };

    // ... Sisa fungsi (sidebar, arsip, hapus, tema, dll) salin dari versi sebelumnya ...
    const updateSendButtonState = () => { sendButton.disabled = !(userInput.value.trim() !== '' || attachedFile !== null); };
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => { /* ... logika upload file ... */ });
    function displayFilePreview() { /* ... */ }
    function removeAttachedFile() { attachedFile = null; filePreviewContainer.innerHTML = ''; fileInput.value = ''; updateSendButtonState(); }
    const saveMessageToHistory = (parts, sender, timestamp) => { /* ... logika simpan riwayat ... */ };
    // ... dan semua fungsi lainnya ...

    // --- EVENT LISTENERS BARU ---
    menuToggleButton.addEventListener('click', () => { document.body.classList.toggle('sidebar-visible'); });
    sidebarOverlay.addEventListener('click', () => { document.body.classList.remove('sidebar-visible'); });
    infoBtn.addEventListener('click', () => { alert('Asisten AI ini dibuat oleh Fall Moderators menggunakan teknologi Google Gemini.'); });
    
    // --- INISIALISASI ---
    startNewChat();
});
