document.addEventListener('DOMContentLoaded', () => {

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistoryList = document.getElementById('chat-history-list');
    const welcomeView = document.querySelector('.welcome-view');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- STATE APLIKASI ---
    let chatHistory = [];
    let currentChatId = null;

    // --- FUNGSI INTI ---

    const startNewChat = () => {
        currentChatId = null; // Set null agar pesan berikutnya membuat ID baru
        chatBox.innerHTML = '';
        chatBox.appendChild(welcomeView);
        userInput.value = '';
        userInput.focus();
        renderChatHistory();
    };

    const loadChat = (chatId) => {
        const chat = chatHistory.find(c => c.id === chatId);
        if (!chat) return;
        
        currentChatId = chatId;
        chatBox.innerHTML = '';
        chat.messages.forEach(msg => tampilkanPesan(msg.text, msg.sender));
        renderChatHistory();
        chatBox.scrollTop = chatBox.scrollHeight;
        // Sembunyikan sidebar di mobile setelah memilih chat
        if (window.innerWidth <= 768) {
            document.body.classList.remove('sidebar-visible');
        }
    };

    const tampilkanPesan = (text, sender) => {
        if (welcomeView.parentElement === chatBox) {
            chatBox.removeChild(welcomeView);
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        const avatarChar = sender === 'user' ? 'U' : 'G';
        const avatarHtml = `<div class="message-avatar">${avatarChar}</div>`;
        const contentHtml = `<div class="message-content">${marked.parse(text)}</div>`;
        
        messageElement.innerHTML = avatarHtml + contentHtml;
        chatBox.appendChild(messageElement);

        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            const preElement = block.parentElement;
            if (preElement.querySelector('.code-header')) return;
            
            const codeHeader = document.createElement('div');
            codeHeader.className = 'code-header';
            const langName = block.className.split(' ').find(cls => cls.startsWith('language-'))?.replace('language-', '') || 'code';
            const langSpan = document.createElement('span');
            langSpan.textContent = langName;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy</span>`;
            
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    copyBtn.querySelector('span').textContent = 'Disalin!';
                    setTimeout(() => { copyBtn.querySelector('span').textContent = 'Copy'; }, 2000);
                });
            });
            
            codeHeader.appendChild(langSpan);
            codeHeader.appendChild(copyBtn);
            preElement.insertBefore(codeHeader, block);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "") return;

        // Jika ini pesan pertama dalam sesi baru, buat ID chat baru
        if (!currentChatId) {
            currentChatId = Date.now().toString();
        }

        tampilkanPesan(messageText, 'user');
        saveMessageToHistory(messageText, 'user');
        userInput.value = "";
        userInput.style.height = 'auto';

        // Indikator mengetik yang baru
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<div class="message-avatar">G</div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(messageText);
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan(botResponse, 'bot');
            saveMessageToHistory(botResponse, 'bot');
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan("Maaf, terjadi kesalahan. Silakan coba lagi.", 'bot');
        }
    };

    const geminiChatAi = async (prompt) => {
        const apiKey = "MASUKKAN_API_KEY_GEMINI_ANDA_DI_SINI";
        if (apiKey === "MASUKKAN_API_KEY_GEMINI_ANDA_DI_SINI") {
            return "Kesalahan: API Key belum diatur. Silakan masukkan API Key Anda di file chatbot.js.";
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak dapat menghasilkan respon saat ini.";
    };

    // --- FUNGSI LOCAL STORAGE & RIWAYAT ---

    const saveMessageToHistory = (text, sender) => {
        let chat = chatHistory.find(c => c.id === currentChatId);
        const isNewChat = !chat;
        
        if (isNewChat) {
            chat = { id: currentChatId, title: text.substring(0, 40) + (text.length > 40 ? '...' : ''), messages: [] };
            chatHistory.unshift(chat);
        }
        
        chat.messages.push({ text, sender });
        saveChatHistoryToLocalStorage();
        if (isNewChat) renderChatHistory();
    };

    const saveChatHistoryToLocalStorage = () => localStorage.setItem('geminiChatHistory', JSON.stringify(chatHistory));
    const loadChatHistoryFromLocalStorage = () => {
        const savedHistory = localStorage.getItem('geminiChatHistory');
        if (savedHistory) chatHistory = JSON.parse(savedHistory);
    };

    const renderChatHistory = () => {
        chatHistoryList.innerHTML = '';
        chatHistory.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title;
            li.dataset.chatId = chat.id;
            if (chat.id === currentChatId) li.classList.add('active');
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-chat-btn';
            deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            };
            
            li.appendChild(deleteBtn);
            li.addEventListener('click', () => loadChat(chat.id));
            chatHistoryList.appendChild(li);
        });
    };
    
    const deleteChat = (chatId) => {
        if (confirm('Anda yakin ingin menghapus obrolan ini?')) {
            chatHistory = chatHistory.filter(c => c.id !== chatId);
            saveChatHistoryToLocalStorage();
            if (currentChatId === chatId) startNewChat();
            renderChatHistory();
        }
    };

    // --- EVENT LISTENERS ---

    sendButton.addEventListener('click', kirimPesan);
    newChatButton.addEventListener('click', startNewChat);

    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', () => { userInput.style.height = 'auto'; userInput.style.height = (userInput.scrollHeight) + 'px'; });

    // Event listener untuk tombol prompt card
    document.querySelectorAll('.prompt-card').forEach(card => {
        card.addEventListener('click', () => {
            userInput.value = card.dataset.prompt;
            kirimPesan();
        });
    });
    
    // Event listener untuk toggle menu mobile
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));

    // --- INISIALISASI ---
    loadChatHistoryFromLocalStorage();
    renderChatHistory();
    startNewChat();
});
