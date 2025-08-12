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
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatHistoryList = document.getElementById('chat-history-list');

    // --- STATE & FUNGSI UTAMA ---
    let allChats = [];
    let currentChatId = null;

    // Fungsi untuk memulai atau memuat obrolan baru
    const startNewChat = () => {
        currentChatId = Date.now().toString();
        const newChat = { id: currentChatId, title: "Obrolan Baru", messages: [] };
        allChats.unshift(newChat); // Tambahkan ke awal
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
        chat.messages.forEach(msg => tampilkanPesan(msg.content, msg.sender));
        renderChatHistory();
        document.body.classList.remove('sidebar-visible');
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
        saveMessageToHistory(promptText, 'user');

        userInput.value = "";
        updateSendButtonState();
        
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'message bot-msg';
        loadingMessage.innerHTML = `<div class="message-header">Fall Asisten AI</div><div class="message-content typing-indicator">Sedang berpikir...</div>`;
        chatBox.appendChild(loadingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const currentConversation = allChats.find(c => c.id === currentChatId).messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const botResponse = await geminiChatAi(currentConversation);
            chatBox.removeChild(loadingMessage);
            tampilkanPesan(botResponse, 'bot');
            saveMessageToHistory(botResponse, 'bot');
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

    // --- FUNGSI RIWAYAT CHAT (LENGKAP & DIPERBAIKI) ---
    const saveMessageToHistory = (content, sender) => {
        let chat = allChats.find(c => c.id === currentChatId);
        const isNewChat = !chat || chat.messages.length === 0;

        if (!chat) { // Jika chat tidak ada sama sekali (kasus yang jarang terjadi)
             chat = { id: currentChatId, title: "Obrolan Error", messages: [] };
             allChats.unshift(chat);
        }

        chat.messages.push({ content, sender });
        
        // Jika ini pesan pertama, update judulnya
        if (isNewChat && sender === 'user') {
            chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
        }
        
        saveAllChatsToLocalStorage();
        renderChatHistory(); // Perbarui sidebar setiap ada pesan baru
    };

    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiAllChats', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => {
        const saved = localStorage.getItem('geminiAllChats');
        if (saved) {
            allChats = JSON.parse(saved);
        }
    };
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
    
    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '';
    };

    // --- EVENT LISTENERS (SEMUA AKTIF) ---
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    userInput.addEventListener('input', updateSendButtonState);
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    newChatButton.addEventListener('click', () => { startNewChat(); document.body.classList.remove('sidebar-visible'); });
    attachFileBtn.addEventListener('click', () => alert('Fitur upload file akan segera diaktifkan sepenuhnya!'));
    themeSwitcher.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('geminiChatTheme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // --- INISIALISASI ---
    loadAllChatsFromLocalStorage();
    const savedTheme = localStorage.getItem('geminiChatTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeSwitcher.checked = true;
    }
    startNewChat();
});
