document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSI ELEMEN DOM LENGKAP ---
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
    const filePreviewContainer = document.getElementById('file-preview-container');
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatHistoryList = document.getElementById('chat-history-list');

    // --- STATE & FUNGSI UTAMA ---
    let allChats = [];
    let currentChatId = null;
    let attachedFile = null;

    const startNewChat = () => {
        currentChatId = Date.now().toString();
        const newChat = { id: currentChatId, title: "Obrolan Baru", messages: [] };
        allChats.unshift(newChat);
        chatBox.innerHTML = '';
        chatBox.appendChild(welcomeView);
        welcomeView.style.display = 'block';
        updateSendButtonState();
        renderChatHistory();
    };

    const loadChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        chatBox.innerHTML = '';
        chat.messages.forEach(msg => tampilkanPesan(msg.parts, msg.sender));
        renderChatHistory();
        document.body.classList.remove('sidebar-visible');
    };

    const tampilkanPesan = (parts, sender) => {
        if (welcomeView) { welcomeView.style.display = 'none'; }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        const senderName = sender === 'user' ? 'You' : 'Fall Asisten AI';
        let contentInnerHtml = '';

        parts.forEach(part => {
            if (part.text) {
                contentInnerHtml += marked.parse(part.text);
            } else if (part.inlineData) {
                contentInnerHtml += `<p><em>[File terlampir: ${part.inlineData.mimeType}]</em></p>`;
            }
        });

        messageElement.innerHTML = `
            <div class="message-header">${senderName}</div>
            <div class="message-content">${contentInnerHtml}</div>
        `;
        
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
        saveMessageToHistory(userParts, 'user');

        userInput.value = "";
        removeAttachedFile();
        
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot-msg';
        loadingMessage.innerHTML = `<div class="message-header">Fall Asisten AI</div><div class="message-content typing-indicator">Sedang berpikir...</div>`;
        chatBox.appendChild(loadingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const currentConversation = allChats.find(c => c.id === currentChatId).messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: m.parts,
            }));

            const botResponse = await geminiChatAi(currentConversation);
            chatBox.removeChild(loadingMessage);
            tampilkanPesan([{ text: botResponse }], 'bot');
            saveMessageToHistory([{ text: botResponse }], 'bot');
        } catch (error) {
            chatBox.removeChild(loadingMessage);
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

    // --- FUNGSI UPLOAD FILE & RIWAYAT (LENGKAP) ---
    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '' && !attachedFile;
    };

    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { alert('Ukuran file terlalu besar! Maksimal 4MB.'); fileInput.value = ''; return; }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = { geminiPart: { inlineData: { mimeType: file.type, data: base64Data } }, fileInfo: { name: file.name, type: file.type } };
            displayFilePreview(reader.result);
            updateSendButtonState();
        };
        reader.readAsDataURL(file);
    });

    function displayFilePreview(imageDataUrl) {
        let previewHtml = `<img src="${imageDataUrl}" alt="Preview">`;
        filePreviewContainer.innerHTML = `<div class="file-preview">${previewHtml}<button class="remove-file-btn" aria-label="Hapus File">×</button></div>`;
        filePreviewContainer.querySelector('.remove-file-btn').addEventListener('click', removeAttachedFile);
    }
    function removeAttachedFile() { attachedFile = null; filePreviewContainer.innerHTML = ''; fileInput.value = ''; updateSendButtonState(); }

    const saveMessageToHistory = (parts, sender) => {
        let chat = allChats.find(c => c.id === currentChatId);
        const isNewChat = !chat || chat.messages.length === 0;

        if (!chat) {
             chat = { id: currentChatId, title: "Obrolan Baru", messages: [] };
             allChats.unshift(chat);
        }
        
        chat.messages.push({ parts, sender });
        if (isNewChat && sender === 'user') {
            const firstText = parts.find(p => p.text)?.text || "Diskusi File";
            chat.title = firstText.substring(0, 30) + (firstText.length > 30 ? '...' : '');
        }
        saveAllChatsToLocalStorage();
        renderChatHistory();
    };
    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiAllChats', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => { const saved = localStorage.getItem('geminiAllChats'); if (saved) { allChats = JSON.parse(saved); } };
    const renderChatHistory = () => {
        chatHistoryList.innerHTML = '';
        allChats.forEach(chat => {
            if(!chat) return;
            const li = document.createElement('li');
            li.textContent = chat.title || "Tanpa Judul";
            li.dataset.chatId = chat.id;
            if (chat.id === currentChatId) li.classList.add('active');
            li.addEventListener('click', () => loadChat(chat.id));
            chatHistoryList.appendChild(li);
        });
    };

    // --- EVENT LISTENERS (SEMUA AKTIF) ---
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    userInput.addEventListener('input', updateSendButtonState);
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    newChatButton.addEventListener('click', () => { startNewChat(); document.body.classList.remove('sidebar-visible'); });
    themeSwitcher.addEventListener('change', () => { document.body.classList.toggle('dark-mode'); });

    // --- INISIALISASI ---
    loadAllChatsFromLocalStorage();
    startNewChat();
});
