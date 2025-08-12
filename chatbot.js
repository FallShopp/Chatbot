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
    let conversationHistory = [];
    let allChats = [];
    let currentChatId = null;
    let attachedFile = null;

    // --- FUNGSI HALAMAN SELAMAT DATANG ---
    const createWelcomeScreen = () => {
        chatBox.innerHTML = `
            <div class="welcome-view">
                <h1 class="welcome-title">Ask Fall Asisten AI Anything</h1>
                <p class="welcome-subtitle">Powered by Google Gemini</p>
            </div>`;
    };

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
        // ... (Fungsi tampilkanPesan yang lengkap dari versi sebelumnya)
    };

    const kirimPesan = async () => {
        // ... (Fungsi kirimPesan yang lengkap dari versi sebelumnya)
    };
    
    const geminiChatAi = async (history, searchGoogle = false) => {
        // ... (Funggsi pemanggilan backend proxy yang lengkap)
    };
    
    const updateInputButtons = () => {
        const hasText = userInput.value.trim() !== '';
        if (hasText || attachedFile) {
            micBtn.classList.add('hidden');
            sendButton.classList.remove('hidden');
            sendButton.disabled = false;
        } else {
            micBtn.classList.remove('hidden');
            sendButton.classList.add('hidden');
            sendButton.disabled = true;
        }
    };

    // --- SEMUA FUNGSI FITUR LAINNYA ---
    // (Di sini, salin semua fungsi lengkap dari jawaban saya sebelumnya, yaitu:)
    // - loadChat
    // - saveMessageToHistory
    // - saveAllChatsToLocalStorage
    // - loadAllChatsFromLocalStorage
    // - renderChatHistory
    // - createChatListItem (termasuk tombol export)
    // - archiveChat, unarchiveChat, deleteChat, clearAllHistory
    // - exportChat
    // - applyTheme
    // - setupSpeechRecognition
    // - displayFilePreview, removeAttachedFile

    // --- EVENT LISTENERS (SEMUA AKTIF) ---
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', updateInputButtons);
    
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    newChatButton.addEventListener('click', startNewChat);
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => { /* ... logika upload file lengkap ... */ });
    themeSwitcher.addEventListener('change', () => { /* ... logika ganti tema ... */ });
    micBtn.addEventListener('click', () => { /* ... logika mic ... */ });

    // --- INISIALISASI ---
    loadAllChatsFromLocalStorage();
    renderChatHistory();
    // setupSpeechRecognition();
    applyTheme(localStorage.getItem('geminiChatTheme') || 'light');
    startNewChat();
});
