document.addEventListener('DOMContentLoaded', () => {
    // --- SELEKSI ELEMEN DOM ---
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    
    // --- Tombol Sidebar ---
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyBtn = document.getElementById('history-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Tombol Aksi Input ---
    const researchBtn = document.querySelector('.action-buttons button'); // Tombol pertama
    const attachFileBtn = document.getElementById('attach-file-btn');

    // --- STATE & FUNGSI UTAMA ---
    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '';
    };

    const kirimPesan = () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;
        // Panggil fungsi untuk mengirim pesan ke AI di sini
        console.log("Mengirim pesan:", promptText);
        // ... (Tambahkan logika pengiriman pesan Anda dari versi sebelumnya)
        userInput.value = '';
        updateSendButtonState();
    };

    // --- EVENT LISTENERS ---

    // Tampilkan/sembunyikan sidebar
    menuToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-visible');
    });
    sidebarOverlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-visible');
    });

    // Cek input pengguna untuk mengaktifkan tombol kirim
    userInput.addEventListener('input', updateSendButtonState);

    // Kirim pesan
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            kirimPesan();
        }
    });

    // --- Event Listener untuk Tombol-tombol Fungsional (Placeholder) ---
    newChatBtn.addEventListener('click', () => alert('Fitur "New Chat" diklik!'));
    historyBtn.addEventListener('click', () => alert('Fitur "History" diklik!'));
    logoutBtn.addEventListener('click', () => alert('Fitur "Log Out" diklik!'));
    researchBtn.addEventListener('click', () => alert('Fitur "Research" diklik!'));
    attachFileBtn.addEventListener('click', () => alert('Fitur "Image/Attach" diklik!'));

    // --- INISIALISASI ---
    updateSendButtonState(); // Set keadaan awal tombol kirim
});
