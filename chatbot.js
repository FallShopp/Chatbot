document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI DEFINITIF UNTUK MASALAH TINGGI LAYAR DI PONSEl ---
    const setAppHeight = () => {
        const doc = document.documentElement;
        doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight(); // Panggil saat pertama kali dimuat

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const archivedChatsList = document.getElementById('archived-chats-list');
    const welcomeView = document.querySelector('.welcome-view');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const themeSwitcher = document.getElementById('theme-switcher');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const highlightThemeLight = document.getElementById('highlight-theme-light');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const micBtn = document.getElementById('mic-btn');

    // --- STATE APLIKASI ---
    let allChats = [];
    let currentChatId = null;
    let conversationHistory = [];
    let attachedFile = null;
    let recognition = null;

    // --- FUNGSI INTI & MANIPULASI DOM (tidak berubah) ---
    // ... (salin seluruh fungsi inti dari jawaban sebelumnya)
    const startNewChat = () => { currentChatId = null; conversationHistory = []; chatBox.innerHTML = ''; chatBox.appendChild(welcomeView); userInput.value = ''; userInput.focus(); removeAttachedFile(); renderChatHistory(); updateSendButtonState(); };
    const loadChat = (chatId) => { const chat = allChats.find(c => c.id === chatId); if (!chat) return; currentChatId = chatId; conversationHistory = chat.messages; chatBox.innerHTML = ''; removeAttachedFile(); chat.messages.forEach(msg => tampilkanPesan(msg.parts, msg.sender, msg.timestamp)); renderChatHistory(); chatBox.scrollTop = chatBox.scrollHeight; updateSendButtonState(); if (window.innerWidth <= 768) document.body.classList.remove('sidebar-visible'); };
    const tampilkanPesan = (parts, sender, timestamp) => {
        if (welcomeView.parentElement === chatBox) chatBox.removeChild(welcomeView);
        const messageElement = document.createElement('div'); messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        const avatarHtml = `<div class="message-avatar">${sender === 'user' ? 'U' : 'A'}</div>`;
        const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
        const timestampHtml = `<div class="message-timestamp">${formattedTime}</div>`;
        let contentInnerHtml = ''; let textContent = '';
        parts.forEach(part => {
            if (part.text) { textContent += part.text; } 
            else if (part.inlineData) {
                const mimeType = part.inlineData.mimeType; const data = part.inlineData.data;
                if (mimeType.startsWith('image/')) { contentInnerHtml += `<div class="sent-file"><img src="data:${mimeType};base64,${data}" alt="Attached Image"></div>`; } 
                else { contentInnerHtml += `<div class="sent-file"><span>📁 File: ${mimeType}</span></div>`; }
            }
        });
        if (textContent) { contentInnerHtml += marked.parse(textContent); }
        const contentHtml = `<div class="message-content-wrapper"><div class="message-content">${contentInnerHtml}</div>${timestampHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? avatarHtml : '') + contentHtml;
        chatBox.appendChild(messageElement);
        messageElement.querySelectorAll('pre code').forEach(hljs.highlightElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // --- INTERAKSI API & LOGIKA UTAMA (DENGAN INDIKATOR BARU) ---
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
        loadingIndicator.innerHTML = `<div class="message-avatar">A</div><div class="message-content-wrapper"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const historyForAPI = conversationHistory.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: msg.parts }));
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
            updateSendButtonState();
        }
    };
    const geminiChatAi = async (history) => { /* ... fungsi ini tidak berubah, tetap aman ... */ 
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Error dari server: ${response.status}`); }
        const data = await response.json();
        return data.text;
    };
    
    // --- LOGIKA UNTUK UPLOAD FILE & TOMBOL CERDAS ---
    const updateSendButtonState = () => { sendButton.disabled = !(userInput.value.trim() !== '' || attachedFile !== null); };
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { alert('Ukuran file terlalu besar! Maksimal 4MB.'); fileInput.value = ''; return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = { fileInfo: { name: file.name, type: file.type }, geminiPart: { inlineData: { mimeType: file.type, data: base64Data } } };
            displayFilePreview();
            updateSendButtonState();
        };
        reader.readAsDataURL(file);
    });
    function displayFilePreview() {
        if (!attachedFile) return;
        const fileInfo = attachedFile.fileInfo;
        const geminiPart = attachedFile.geminiPart;
        let previewHtml = fileInfo.type.startsWith('image/') ? `<img src="data:${fileInfo.type};base64,${geminiPart.inlineData.data}" alt="Preview">` : `<span>📁 ${fileInfo.name}</span>`;
        filePreviewContainer.innerHTML = `<div class="file-preview">${previewHtml}<button class="remove-file-btn" aria-label="Hapus File">×</button></div>`;
        filePreviewContainer.querySelector('.remove-file-btn').addEventListener('click', removeAttachedFile);
    }
    function removeAttachedFile() { attachedFile = null; filePreviewContainer.innerHTML = ''; fileInput.value = ''; updateSendButtonState(); }

    // --- LOGIKA UNTUK DIKTE SUARA (VOICE-TO-TEXT) ---
    const setupSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { micBtn.style.display = 'none'; return; }
        recognition = new SpeechRecognition();
        recognition.continuous = false; recognition.lang = 'id-ID'; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognition.onstart = () => micBtn.classList.add('mic-btn-recording');
        recognition.onresult = (event) => { userInput.value += (userInput.value.length > 0 ? ' ' : '') + event.results[0][0].transcript; userInput.focus(); updateSendButtonState(); userInput.dispatchEvent(new Event('input')); };
        recognition.onspeechend = () => recognition.stop();
        recognition.onend = () => micBtn.classList.remove('mic-btn-recording');
        recognition.onerror = (event) => { console.error("Speech recognition error:", event.error); micBtn.classList.remove('mic-btn-recording'); };
    };
    micBtn.addEventListener('click', () => { if (recognition && !micBtn.classList.contains('mic-btn-recording')) { recognition.start(); } });

    // --- FUNGSI LOCAL STORAGE & RIWAYAT (tidak berubah) ---
    // ... (salin seluruh fungsi riwayat & arsip dari jawaban sebelumnya)
    const saveMessageToHistory = (parts, sender, timestamp) => { let chat = allChats.find(c => c.id === currentChatId); const isNewChat = !chat; if (isNewChat) { const firstText = parts.find(p => p.text)?.text || "Diskusi File"; chat = { id: currentChatId, title: firstText.substring(0, 30) + '...', messages: [], isArchived: false }; allChats.unshift(chat); } chat.messages.push({ parts, sender, timestamp }); conversationHistory = chat.messages; saveAllChatsToLocalStorage(); if (isNewChat) renderChatHistory(); };
    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiChatHistory', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => { if (localStorage.getItem('geminiChatHistory')) { allChats = JSON.parse(localStorage.getItem('geminiChatHistory')).map(chat => ({...chat, isArchived: chat.isArchived || false})); } };
    const renderChatHistory = () => { chatHistoryList.innerHTML = ''; archivedChatsList.innerHTML = ''; const activeChats = allChats.filter(c => !c.isArchived); const archivedChats = allChats.filter(c => c.isArchived); activeChats.forEach(chat => createChatListItem(chat, chatHistoryList)); archivedChats.forEach(chat => createChatListItem(chat, archivedChatsList)); };
    const createChatListItem = (chat, listElement) => { const li = document.createElement('li'); li.textContent = chat.title; li.dataset.chatId = chat.id; if (chat.id === currentChatId) li.classList.add('active'); const btns = document.createElement('div'); const archiveBtn = document.createElement('button'); archiveBtn.className = 'archive-btn'; archiveBtn.innerHTML = chat.isArchived ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><polyline points="10 3 10 9 14 9 14 3"/><line x1="10" y1="9" x2="14" y2="9"/><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`; archiveBtn.onclick = (e) => { e.stopPropagation(); chat.isArchived ? unarchiveChat(chat.id) : archiveChat(chat.id); }; const delBtn = document.createElement('button'); delBtn.className = 'delete-chat-btn'; delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`; delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.id); }; btns.appendChild(archiveBtn); btns.appendChild(delBtn); li.appendChild(btns); li.addEventListener('click', () => loadChat(chat.id)); listElement.appendChild(li); };
    const archiveChat = (id) => { const chat = allChats.find(c => c.id === id); if(chat) chat.isArchived = true; saveAllChatsToLocalStorage(); if(currentChatId === id) startNewChat(); renderChatHistory(); };
    const unarchiveChat = (id) => { const chat = allChats.find(c => c.id === id); if(chat) chat.isArchived = false; saveAllChatsToLocalStorage(); renderChatHistory(); };
    const deleteChat = (id) => { if (confirm('Hapus obrolan ini permanen?')) { allChats = allChats.filter(c => c.id !== id); saveAllChatsToLocalStorage(); if (currentChatId === id) startNewChat(); renderChatHistory(); } };
    const clearAllHistory = () => { if (confirm('HAPUS SEMUA riwayat obrolan? Aksi ini tidak bisa dibatalkan.')) { allChats = []; localStorage.removeItem('geminiChatHistory'); startNewChat(); } };
    const applyTheme = (theme) => { document.body.classList.toggle('light-mode', theme === 'light'); highlightThemeLight.disabled = theme !== 'light'; localStorage.setItem('geminiChatTheme', theme); themeSwitcher.checked = theme === 'light'; };
    
    // --- EVENT LISTENERS ---
    sendButton.addEventListener('click', kirimPesan);
    newChatButton.addEventListener('click', startNewChat);
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', () => { userInput.style.height = 'auto'; userInput.style.height = (userInput.scrollHeight) + 'px'; updateSendButtonState(); });
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    themeSwitcher.addEventListener('change', () => applyTheme(themeSwitcher.checked ? 'light' : 'dark'));

    // --- INISIALISASI APLIKASI ---
    loadAllChatsFromLocalStorage();
    renderChatHistory();
    applyTheme(localStorage.getItem('geminiChatTheme') || 'dark');
    setupSpeechRecognition();
    startNewChat();
});
