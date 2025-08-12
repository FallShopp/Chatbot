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
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatHistoryList = document.getElementById('chat-history-list');

    // --- STATE & FUNGSI UTAMA ---
    let allChats = []; // Semua sesi chat dari localStorage
    let currentChatId = null; // ID dari chat yang sedang aktif

    const createWelcomeScreen = () => { /* ... (fungsi welcome screen lengkap) ... */ };

    const startNewChat = () => {
        currentChatId = null;
        chatBox.innerHTML = '';
        createWelcomeScreen();
        userInput.value = '';
        userInput.focus();
        updateInputButtons();
        renderChatHistory(); // Pastikan sidebar terupdate
    };

    const loadChat = (chatId) => {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        chatBox.innerHTML = '';
        chat.messages.forEach(msg => tampilkanPesan(msg, false)); // false = jangan animasi
        renderChatHistory();
        chatBox.scrollTop = chatBox.scrollHeight;
        updateInputButtons();
        document.body.classList.remove('sidebar-visible');
    };

    const tampilkanPesan = (messageData, animate = true) => {
        const { parts, sender } = messageData;
        const welcomeView = document.querySelector('.welcome-view');
        if (welcomeView) welcomeView.remove();
        
        const messageElement = document.createElement('div');
        if(animate) messageElement.style.animation = 'fadeIn 0.5s ease-out';
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const botAvatar = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        let contentInnerHtml = parts.map(part => part.text ? marked.parse(part.text) : '').join('');
        
        const contentHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;

        if (!currentChatId) { currentChatId = Date.now().toString(); }

        const userMessage = { parts: [{ text: promptText }], sender: 'user' };
        tampilkanPesan(userMessage, true);
        saveMessageToHistory(userMessage);
        
        userInput.value = "";
        updateInputButtons();
        
        const thinkingIndicator = document.createElement('div');
        // ... (kode indikator berpikir)
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const currentConversation = allChats.find(c => c.id === currentChatId).messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: m.parts,
            }));

            const botResponseText = await geminiChatAi(currentConversation);
            chatBox.removeChild(thinkingIndicator);
            
            const botMessage = { parts: [{ text: botResponseText }], sender: 'bot' };
            tampilkanPesan(botMessage, true);
            saveMessageToHistory(botMessage);
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan({ parts: [{ text: `Maaf, terjadi kesalahan: ${error.message}` }], sender: 'bot' }, true);
        }
    };
    
    // --- FUNGSI RIWAYAT CHAT (LENGKAP & DIPERBAIKI) ---
    const saveMessageToHistory = (messageData) => {
        let chat = allChats.find(c => c.id === currentChatId);
        const isNewChat = !chat;
        if (isNewChat) {
            const firstText = messageData.parts.find(p => p.text)?.text || "Diskusi Baru";
            chat = { id: currentChatId, title: firstText.substring(0, 30) + '...', messages: [] };
            allChats.unshift(chat);
        }
        chat.messages.push(messageData);
        saveAllChatsToLocalStorage();
        if (isNewChat) renderChatHistory();
    };
    const saveAllChatsToLocalStorage = () => localStorage.setItem('geminiAllChats', JSON.stringify(allChats));
    const loadAllChatsFromLocalStorage = () => {
        const saved = localStorage.getItem('geminiAllChats');
        if (saved) { allChats = JSON.parse(saved); }
    };
    const renderChatHistory = () => {
        chatHistoryList.innerHTML = '';
        allChats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title;
            li.dataset.chatId = chat.id;
            if (chat.id === currentChatId) li.classList.add('active');
            li.addEventListener('click', () => loadChat(chat.id));
            chatHistoryList.appendChild(li);
        });
    };
    
    // ... (Sisa fungsi dan event listener lengkap dari versi sebelumnya)
});
