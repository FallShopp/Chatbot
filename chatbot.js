document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const googleSearchSwitcher = document.getElementById('google-search-switcher');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    
    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = []; // Riwayat chat sesi ini saja
    let allChats = []; // Semua sesi chat dari localStorage
    let currentChatId = null;
    let attachedFile = null;
    let recognition = null;

    // --- FUNGSI HALAMAN SELAMAT DATANG ---
    const createWelcomeScreen = () => {
        chatBox.innerHTML = `
            <div class="welcome-view">
                <div class="welcome-header">
                    <h1 id="welcome-greeting"></h1>
                    <p>Apa yang bisa saya bantu?</p>
                </div>
                <div class="suggestion-cards">
                    <div class="suggestion-card" data-prompt="Jelaskan konsep relativitas Einstein dengan analogi sederhana">
                        <h3>Jelaskan topik rumit</h3>
                        <p>Seperti relativitas atau black hole</p>
                        <div class="icon">🚀</div>
                    </div>
                    <div class="suggestion-card" data-prompt="Buatkan saya itinerary 3 hari di Tokyo untuk solo traveler">
                        <h3>Rencanakan perjalanan</h3>
                        <p>Untuk liburan atau perjalanan bisnis</p>
                        <div class="icon">✈️</div>
                    </div>
                    <div class="suggestion-card" data-prompt="Tulis sebuah puisi tentang hujan di malam hari">
                        <h3>Bantu saya menulis</h3>
                        <p>Seperti email, puisi, atau lirik lagu</p>
                        <div class="icon">✍️</div>
                    </div>
                    <div class="suggestion-card" data-prompt="Berikan 5 ide resep masakan sehat untuk makan malam">
                        <h3>Berikan ide kreatif</h3>
                        <p>Untuk resep, hadiah, atau nama proyek</p>
                        <div class="icon">💡</div>
                    </div>
                </div>
            </div>`;
        
        // Atur sapaan dinamis
        const hour = new Date().getHours();
        const greetingElement = document.getElementById('welcome-greeting');
        if (hour < 11) greetingElement.textContent = "Selamat Pagi";
        else if (hour < 15) greetingElement.textContent = "Selamat Siang";
        else if (hour < 19) greetingElement.textContent = "Selamat Sore";
        else greetingElement.textContent = "Selamat Malam";

        // Tambahkan event listener untuk kartu saran
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                userInput.value = card.dataset.prompt;
                kirimPesan();
            });
        });
    };

    // --- Sisa Fungsi Lengkap dari Versi Sebelumnya ---
    // (termasuk startNewChat, loadChat, tampilkanPesan, kirimPesan, geminiChatAi,
    // updateInputButtons, semua logika upload file, suara, riwayat, arsip, tema, dll.)
    
    // Contoh `startNewChat` yang diperbarui
    const startNewChat = () => {
        currentChatId = null;
        conversationHistory = [];
        createWelcomeScreen(); // Panggil fungsi welcome screen baru
        userInput.value = '';
        userInput.focus();
        removeAttachedFile();
        renderChatHistory();
        updateSendButtonState();
    };
    
    // (Salin sisa file chatbot.js LENGKAP dari jawaban saya sebelumnya)
});