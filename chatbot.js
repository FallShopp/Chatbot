document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSI ELEMEN DOM LENGKAP ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatHistoryList = document.getElementById('chat-history-list');
    
    // --- STATE & FUNGSI UTAMA ---
    let allChats = [];
    let currentChatId = null;
    let attachedFile = null;

    // --- FUNGSI HALAMAN SELAMAT DATANG ---
    const createWelcomeScreen = () => {
        chatBox.innerHTML = `
            <div class="welcome-view">
                <div class="welcome-header">
                    <h1 id="welcome-greeting" class="gradient-text"></h1>
                    <p>Apa yang bisa saya bantu?</p>
                </div>
                <div class="suggestion-cards">
                    <div class="suggestion-card" data-prompt="Jelaskan apa itu kecerdasan buatan">
                        <h3>Jelaskan topik</h3>
                        <p>Seperti kecerdasan buatan atau blockchain</p>
                    </div>
                    <div class="suggestion-card" data-prompt="Tulis email profesional ke klien">
                        <h3>Bantu saya menulis</h3>
                        <p>Seperti email, puisi, atau lirik lagu</p>
                    </div>
                </div>
            </div>`;
        
        const hour = new Date().getHours();
        const greetingElement = document.getElementById('welcome-greeting');
        if (hour < 11) greetingElement.textContent = "Selamat Pagi";
        else if (hour < 15) greetingElement.textContent = "Selamat Siang";
        else if (hour < 19) greetingElement.textContent = "Selamat Sore";
        else greetingElement.textContent = "Selamat Malam";

        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                userInput.value = card.dataset.prompt;
                kirimPesan();
            });
        });
    };

    const startNewChat = () => {
        currentChatId = Date.now().toString();
        const newChat = { id: currentChatId, title: "Obrolan Baru", messages: [] };
        allChats.unshift(newChat);
        chatBox.innerHTML = '';
        createWelcomeScreen();
        userInput.value = '';
        removeAttachedFile();
        updateInputButtons();
        renderChatHistory();
    };

    const loadChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        chatBox.innerHTML = '';
        if (chat.messages.length === 0) {
            createWelcomeScreen();
        } else {
            chat.messages.forEach(msg => tampilkanPesan(msg));
        }
        renderChatHistory();
        document.body.classList.remove('sidebar-visible');
    };

    const tampilkanPesan = (messageData) => {
        const { parts, sender } = messageData;
        const welcomeView = document.querySelector('.welcome-view');
        if (welcomeView) welcomeView.remove();
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const botAvatar = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        let contentInnerHtml = parts.map(part => {
            if (part.text) return marked.parse(part.text);
            return '';
        }).join('');
        
        const contentHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });
        
        const userMessage = { parts: userParts, sender: 'user' };
        tampilkanPesan(userMessage);
        saveMessageToHistory(userMessage);
        
        userInput.value = "";
        removeAttachedFile();
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `<div class="thinking-logo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const currentConversation = allChats.find(c => c.id === currentChatId)?.messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: m.parts,
            })) || [];

            const botResponseText = await geminiChatAi(currentConversation);
            chatBox.removeChild(thinkingIndicator);
            
            const botMessage = { parts: [{ text: botResponseText }], sender: 'bot' };
            tampilkanPesan(botMessage);
            saveMessageToHistory(botMessage);
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan({ parts: [{ text: `Maaf, terjadi kesalahan: ${error.message}` }], sender: 'bot' });
        }
    };

    const geminiChatAi = async (history) => { /* ...Tidak berubah, tetap panggil proxy... */ };
    
    // --- LOGIKA UPLOAD FILE & TOMBOL CERDAS ---
    const updateInputButtons = () => { /* ...Tidak berubah... */ };
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => { /* ...Logika lengkap upload file... */ });
    function removeAttachedFile() { /* ...Tidak berubah... */ }

    // --- FUNGSI RIWAYAT & SIDEBAR (LENGKAP) ---
    const saveMessageToHistory = (messageData) => {
        let chat = allChats.find(c => c.id === currentChatId);
        if (!chat) return;
        const isNewChat = chat.messages.length === 0;
        chat.messages.push(messageData);
        if (isNewChat && messageData.sender === 'user') {
            const firstText = messageData.parts.find(p => p.text)?.text || "Diskusi File";
            chat.title = firstText.substring(0, 35) + (firstText.length > 35 ? '...' : '');
        }
        saveAllChatsToLocalStorage();
        renderChatHistory();
    };
    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiAllChats', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => { const saved = localStorage.getItem('geminiAllChats'); if (saved) { allChats = JSON.parse(saved); } };
    const renderChatHistory = () => {
        chatHistoryList.innerHTML = '';
        allChats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title || "Tanpa Judul";
            li.dataset.chatId = chat.id;
            if (chat.id === currentChatId) li.classList.add('active');
            li.addEventListener('click', () => loadChat(chat.id));
            chatHistoryList.appendChild(li);
        });
    };
    
    // --- PENGATURAN TEMA ---
    const applyTheme = (theme) => { /* ...Tidak berubah... */ };
    
    // --- EVENT LISTENERS (SEMUA AKTIF) ---
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', updateInputButtons);
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    newChatButton.addEventListener('click', () => { startNewChat(); document.body.classList.remove('sidebar-visible'); });
    themeSwitcher.addEventListener('change', () => applyTheme(themeSwitcher.checked ? 'dark' : 'light'));
    
    // --- INISIALISASI ---
    loadAllChatsFromLocalStorage();
    applyTheme(localStorage.getItem('geminiChatTheme') || 'light');
    startNewChat();
});
