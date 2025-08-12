document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl & INISIALISASI ---
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
    const googleSearchSwitcher = document.getElementById('google-search-switcher');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const chatHistoryList = document.getElementById('chat-history-list');

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = []; // Riwayat chat sesi ini
    let allChats = []; // Semua sesi chat dari localStorage
    let currentChatId = null;
    let attachedFile = null;
    let recognition = null; // untuk Voice-to-Text

    const createWelcomeScreen = () => { /* ... (fungsi ini tidak berubah) ... */ };

    const startNewChat = () => {
        currentChatId = null;
        conversationHistory = [];
        createWelcomeScreen();
        userInput.value = '';
        userInput.focus();
        removeAttachedFile();
        renderChatHistory();
        updateInputButtons();
    };

    const tampilkanPesan = (messageData) => {
        const { id, parts, sender } = messageData;
        if (document.querySelector('.welcome-view')) {
             document.querySelector('.welcome-view').remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        messageElement.dataset.id = id;

        const botAvatar = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        let contentInnerHtml = '';
        parts.forEach(part => {
            if (part.text) { contentInnerHtml += marked.parse(part.text); }
            // ... (logika render file)
        });
        
        const contentHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        if (!currentChatId) { currentChatId = Date.now().toString(); conversationHistory = []; }
        
        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });

        const messageId = Date.now();
        tampilkanPesan({ id: messageId, parts: userParts }, 'user');
        saveMessageToHistory({ id: messageId, parts: userParts, sender: 'user' });
        
        userInput.value = "";
        removeAttachedFile();
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `<div class="thinking-logo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const useGoogleSearch = googleSearchSwitcher.checked;
            const botResponse = await geminiChatAi(conversationHistory, useGoogleSearch);
            const botMessageId = Date.now() + 1;
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan({ id: botMessageId, parts: [{ text: botResponse }] }, 'bot');
            saveMessageToHistory({ id: botMessageId, parts: [{ text: botResponse }], sender: 'bot' });
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan({ id: Date.now() + 1, parts: [{ text: `Maaf, terjadi kesalahan: ${error.message}` }] }, 'bot');
        }
    };
    
    // ... Sisa file JS dari versi sebelumnya, termasuk semua fungsi dan event listener yang sudah lengkap ...
});
