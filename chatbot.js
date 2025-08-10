document.addEventListener('DOMContentLoaded', () => {

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const archivedChatsList = document.getElementById('archived-chats-list');
    const welcomeView = document.querySelector('.welcome-view');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const themeSwitcher = document.getElementById('theme-switcher');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const highlightThemeLight = document.getElementById('highlight-theme-light');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    // --- STATE APLIKASI ---
    let allChats = [];
    let currentChatId = null;
    let conversationHistory = [];
    let attachedFile = null; // Menyimpan data file yang akan dikirim

    // --- FUNGSI INTI & MANIPULASI DOM ---

    const startNewChat = () => {
        currentChatId = null; conversationHistory = [];
        chatBox.innerHTML = '';
        chatBox.appendChild(welcomeView);
        userInput.value = ''; userInput.focus();
        removeAttachedFile();
        renderChatHistory();
    };

    const loadChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId; conversationHistory = chat.messages;
        chatBox.innerHTML = '';
        removeAttachedFile();
        chat.messages.forEach(msg => tampilkanPesan(msg.parts, msg.sender, msg.timestamp));
        renderChatHistory();
        chatBox.scrollTop = chatBox.scrollHeight;
        if (window.innerWidth <= 768) document.body.classList.remove('sidebar-visible');
    };

    const tampilkanPesan = (parts, sender, timestamp) => {
        if (welcomeView.parentElement === chatBox) chatBox.removeChild(welcomeView);
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        const avatarHtml = `<div class="message-avatar">${sender === 'user' ? 'U' : 'A'}</div>`;
        const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        const timestampHtml = `<div class="message-timestamp">${formattedTime}</div>`;

        let contentInnerHtml = '';
        let textContent = '';
        parts.forEach(part => {
            if (part.text) {
                textContent += part.text;
            } else if (part.inlineData) {
                const mimeType = part.inlineData.mimeType;
                const data = part.inlineData.data;
                if (mimeType.startsWith('image/')) {
                    contentInnerHtml += `<div class="sent-file"><img src="data:${mimeType};base64,${data}" alt="Attached Image"></div>`;
                } else {
                    contentInnerHtml += `<div class="sent-file"><span>📁 File: ${mimeType}</span></div>`;
                }
            }
        });
        if (textContent) {
            contentInnerHtml += marked.parse(textContent);
        }

        const contentHtml = sender === 'user'
            ? `<div class="message-content-wrapper"><div class="message-content">${contentInnerHtml}</div>${timestampHtml}</div>`
            : `<div class="message-content">${contentInnerHtml}${timestampHtml}</div>`;
            
        messageElement.innerHTML = (sender === 'bot' ? avatarHtml : '') + contentHtml + (sender === 'user' ? avatarHtml : '');
        chatBox.appendChild(messageElement);

        messageElement.querySelectorAll('pre code').forEach(hljs.highlightElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- INTERAKSI API & LOGIKA UTAMA ---

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        sendButton.disabled = true;
        
        if (!currentChatId) { currentChatId = Date.now().toString(); conversationHistory = []; }

        const timestamp = new Date().toISOString();
        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });

        tampilkanPesan(userParts, 'user', timestamp);
        saveMessageToHistory(userParts, 'user', timestamp);
        
        userInput.value = ""; userInput.style.height = 'auto';
        removeAttachedFile();
        
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<div class="message-avatar">A</div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const historyForAPI = conversationHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: msg.parts,
            }));
            const botResponseText = await geminiChatAi(historyForAPI);
            const botTimestamp = new Date().toISOString();
            
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan([{ text: botResponseText }], 'bot', botTimestamp);
            saveMessageToHistory([{ text: botResponseText }], 'bot', botTimestamp);
        } catch (error) {
            console.error('Error saat menghubungi backend:', error);
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan([{ text: `Maaf, terjadi kesalahan: ${error.message}` }], 'bot', new Date().toISOString());
        } finally {
            sendButton.disabled = false;
        }
    };
    
    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Error dari server: ${response.status}`); }
        const data = await response.json();
        return data.text;
    };
    
    // --- LOGIKA UNTUK FITUR UPLOAD FILE ---

    attachFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Batasi ukuran file (misal, 4MB)
        if (file.size > 4 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 4MB.');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = {
                fileInfo: { name: file.name, type: file.type },
                geminiPart: { inlineData: { mimeType: file.type, data: base64Data } }
            };
            displayFilePreview();
        };
        reader.readAsDataURL(file);
    });

    function displayFilePreview() {
        if (!attachedFile) return;
        const fileInfo = attachedFile.fileInfo;
        const geminiPart = attachedFile.geminiPart;
        let previewHtml = '';

        if (fileInfo.type.startsWith('image/')) {
            previewHtml = `<img src="data:${fileInfo.type};base64,${geminiPart.inlineData.data}" alt="Image Preview">`;
        } else {
            previewHtml = `<span>📁 ${fileInfo.name}</span>`;
        }
        
        filePreviewContainer.innerHTML = `
            <div class="file-preview">
                ${previewHtml}
                <button class="remove-file-btn" aria-label="Hapus File">×</button>
            </div>
        `;
        filePreviewContainer.querySelector('.remove-file-btn').addEventListener('click', removeAttachedFile);
    }

    function removeAttachedFile() {
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
        fileInput.value = '';
    }

    // --- FUNGSI LOCAL STORAGE & RIWAYAT (tidak berubah) ---
    // ... (salin seluruh fungsi riwayat & arsip dari jawaban sebelumnya)
    const saveMessageToHistory = (parts, sender, timestamp) => {
        let chat = allChats.find(c => c.id === currentChatId);
        const isNewChat = !chat;
        if (isNewChat) {
            const firstText = parts.find(p => p.text)?.text || "Diskusi File";
            chat = { id: currentChatId, title: firstText.substring(0, 30) + '...', messages: [], isArchived: false };
            allChats.unshift(chat);
        }
        chat.messages.push({ parts, sender, timestamp });
        conversationHistory = chat.messages;
        saveAllChatsToLocalStorage();
        if (isNewChat) renderChatHistory();
    };
    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiChatHistory', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => { if (localStorage.getItem('geminiChatHistory')) { allChats = JSON.parse(localStorage.getItem('geminiChatHistory')).map(chat => ({...chat, isArchived: chat.isArchived || false})); } };
    const renderChatHistory = () => { chatHistoryList.innerHTML = ''; archivedChatsList.innerHTML = ''; const activeChats = allChats.filter(c => !c.isArchived); const archivedChats = allChats.filter(c => c.isArchived); activeChats.forEach(chat => createChatListItem(chat, chatHistoryList)); archivedChats.forEach(chat => createChatListItem(chat, archivedChatsList)); };
    const createChatListItem = (chat, listElement) => { const li = document.createElement('li'); li.textContent = chat.title; li.dataset.chatId = chat.id; if (chat.id === currentChatId) li.classList.add('active'); const buttonsWrapper = document.createElement('div'); const archiveBtn = document.createElement('button'); archiveBtn.className = 'archive-btn'; archiveBtn.innerHTML = chat.isArchived ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><polyline points="10 3 10 9 14 9 14 3"/><line x1="10" y1="9" x2="14" y2="9"/><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`; archiveBtn.onclick = (e) => { e.stopPropagation(); chat.isArchived ? unarchiveChat(chat.id) : archiveChat(chat.id); }; const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-chat-btn'; deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`; deleteBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); }; buttonsWrapper.appendChild(archiveBtn); buttonsWrapper.appendChild(deleteBtn); li.appendChild(buttonsWrapper); li.addEventListener('click', () => loadChat(chat.id)); listElement.appendChild(li); };
    const archiveChat = (chatId) => { const chat = allChats.find(c => c.id === chatId); if(chat) chat.isArchived = true; saveAllChatsToLocalStorage(); if(currentChatId === chatId) startNewChat(); renderChatHistory(); };
    const unarchiveChat = (chatId) => { const chat = allChats.find(c => c.id === chatId); if(chat) chat.isArchived = false; saveAllChatsToLocalStorage(); renderChatHistory(); };
    const deleteChat = (chatId) => { if (confirm('Anda yakin ingin menghapus obrolan ini secara permanen?')) { allChats = allChats.filter(c => c.id !== chatId); saveAllChatsToLocalStorage(); if (currentChatId === chatId) startNewChat(); renderChatHistory(); } };
    const clearAllHistory = () => { if (confirm('PERINGATAN: Hapus SEMUA riwayat obrolan? Aksi ini tidak dapat dibatalkan.')) { allChats = []; localStorage.removeItem('geminiChatHistory'); startNewChat(); } };
    const applyTheme = (theme) => { document.body.classList.toggle('light-mode', theme === 'light'); highlightThemeLight.disabled = theme !== 'light'; localStorage.setItem('geminiChatTheme', theme); themeSwitcher.checked = theme === 'light'; };
    
    // --- EVENT LISTENERS ---
    sendButton.addEventListener('click', kirimPesan);
    newChatButton.addEventListener('click', startNewChat);
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', () => { userInput.style.height = 'auto'; userInput.style.height = (userInput.scrollHeight) + 'px'; });
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    themeSwitcher.addEventListener('change', () => applyTheme(themeSwitcher.checked ? 'light' : 'dark'));

    // --- INISIALISASI APLIKASI ---
    loadAllChatsFromLocalStorage();
    renderChatHistory();
    applyTheme(localStorage.getItem('geminiChatTheme') || 'dark');
    startNewChat();
});
