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
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const highlightThemeLight = document.getElementById('highlight-theme-light');
    const chatHistoryList = document.getElementById('chat-history-list');
    
    // --- STATE & FUNGSI UTAMA ---
    let allChats = []; // Semua sesi chat dari localStorage
    let currentChatId = null; // ID dari chat yang sedang aktif
    let recognition = null; // untuk Voice-to-Text
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
                    <div class="suggestion-card" data-prompt="Jelaskan konsep relativitas Einstein dengan analogi sederhana">
                        <h3>Jelaskan topik rumit</h3>
                        <p>Seperti relativitas atau black hole</p>
                    </div>
                    <div class="suggestion-card" data-prompt="Tulis sebuah puisi tentang hujan di malam hari">
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
        currentChatId = null;
        createWelcomeScreen();
        userInput.value = '';
        userInput.focus();
        removeAttachedFile();
        updateInputButtons();
        renderChatHistory();
    };

    const tampilkanPesan = (messageData, animate = true) => {
        const { id, parts, sender } = messageData;
        const welcomeView = document.querySelector('.welcome-view');
        if (welcomeView) welcomeView.remove();
        
        // Buat wrapper utama untuk pesan dan tombol aksi
        const messageWrapper = document.createElement('div');
        messageWrapper.className = 'message-wrapper';
        messageWrapper.dataset.messageId = id; // Beri ID pada wrapper

        const messageElement = document.createElement('div');
        if(animate) messageElement.style.animation = 'fadeIn 0.5s ease-out';
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const botAvatar = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        let contentInnerHtml = parts.map(part => part.text ? marked.parse(part.text) : '').join('');
        
        const contentHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        
        // Tambahkan elemen pesan dan tombol aksi ke wrapper
        messageWrapper.appendChild(messageElement);
        chatBox.appendChild(messageWrapper);
        
        // Buat dan tambahkan tombol aksi setelah pesan
        createMessageActions(messageWrapper, messageData);
        
        messageElement.querySelectorAll('pre code').forEach(hljs.highlightElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        // ... (Fungsi kirimPesan tidak perlu diubah, tetap sama seperti versi final sebelumnya)
    };
    
    // ... (Fungsi geminiChatAi, logika upload file & tombol cerdas, tidak berubah)
    
    // --- SEMUA FUNGSI FITUR BARU ---

    const createMessageActions = (wrapper, messageData) => {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message-actions';
        const { id, sender } = messageData;

        if (sender === 'bot') {
            actionsContainer.innerHTML = `
                <button class="action-btn tts-btn" data-message-id="${id}" aria-label="Bacakan">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77"/></svg>
                </button>
                <button class="action-btn copy-btn" data-message-id="${id}" aria-label="Salin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2m0 16H8V7h11z"/></svg>
                </button>
                <button class="action-btn regen-btn" data-message-id="${id}" aria-label="Buat Ulang">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"/></svg>
                </button>
            `;
        } else { // sender === 'user'
             actionsContainer.innerHTML = `
                <button class="action-btn edit-btn" data-message-id="${id}" aria-label="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"/></svg>
                </button>
            `;
        }
        wrapper.appendChild(actionsContainer);
    };

    const handleMessageActions = (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;
        // Logika untuk setiap tombol aksi
    };

    // --- EVENT LISTENERS ---
    chatBox.addEventListener('click', handleMessageActions);
    // ... (Semua event listener lain dari versi sebelumnya)
});
