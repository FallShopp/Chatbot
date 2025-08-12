document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSİ ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    // ... (Elemen lain yang fungsional)
    
    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];
    let attachedFile = null;

    const startNewChat = () => {
        // ... (Fungsi ini tidak berubah dari versi sebelumnya)
    };

    const tampilkanPesan = (parts, sender) => {
        // ... (Fungsi ini tidak berubah)
    };

    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "" && !attachedFile) return;
        
        const userParts = [];
        if (attachedFile) {
            userParts.push(attachedFile.geminiPart);
        }
        if (promptText) {
            userParts.push({ text: promptText });
        }
        
        tampilkanPesan(userParts, 'user');
        conversationHistory.push({ role: 'user', parts: userParts });
        userInput.value = "";
        removeAttachedFile(); // Hapus pratinjau setelah dikirim
        
        const thinkingIndicator = document.createElement('div');
        // ... (Kode indikator berpikir)
        chatBox.appendChild(thinkingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan([{ text: botResponse }], 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(thinkingIndicator);
            tampilkanPesan([{ text: `Maaf, terjadi kesalahan: ${error.message}` }], 'bot');
        }
    };

    // Panggilan API (tidak berubah)
    const geminiChatAi = async (history) => { /* ... */ };
    
    // --- LOGIKA UI BARU UNTUK INPUT & UPLOAD ---
    const updateInputButtons = () => {
        const hasText = userInput.value.trim() !== '';
        if (hasText || attachedFile) {
            micBtn.classList.add('hidden');
            sendButton.classList.remove('hidden');
        } else {
            micBtn.classList.remove('hidden');
            sendButton.classList.add('hidden');
        }
    };

    attachFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Batasi hanya untuk gambar agar sesuai dengan pratinjau
        if (!file.type.startsWith('image/')) {
            alert('Saat ini hanya mendukung file gambar.');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = { 
                geminiPart: { inlineData: { mimeType: file.type, data: base64Data } }
            };
            displayImagePreview(reader.result); // Panggil fungsi pratinjau
            updateInputButtons();
        };
        reader.readAsDataURL(file);
    });

    // FUNGSI BARU UNTUK MENAMPILKAN PRATINJAU
    function displayImagePreview(imageDataUrl) {
        filePreviewContainer.innerHTML = `
            <div class="image-preview">
                <img src="${imageDataUrl}" alt="Image Preview">
                <button class="remove-image-btn" aria-label="Hapus Gambar">&times;</button>
            </div>
        `;
        // Tambahkan event listener ke tombol hapus yang baru dibuat
        filePreviewContainer.querySelector('.remove-image-btn').addEventListener('click', removeAttachedFile);
    }

    // FUNGSI DIPERBARUI UNTUK MENGHAPUS PRATINJAU
    function removeAttachedFile() {
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
        fileInput.value = ''; // Reset input agar bisa upload file yang sama lagi
        updateInputButtons();
    }
    
    // --- EVENT LISTENERS & INISIALISASI ---
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', updateInputButtons);
    // ... (event listener lain yang sudah fungsional)
    
    updateInputButtons();
});
