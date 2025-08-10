document.addEventListener('DOMContentLoaded', () => {
    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeView = document.querySelector('.welcome-view');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const suggestionChipsContainer = document.getElementById('suggestion-chips-container');
    // ... elemen-elemen lain yang mungkin masih relevan dari versi sidebar ...
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');

    // --- STATE APLIKASI ---
    let conversationHistory = [];
    let isFirstMessage = true;

    // --- FUNGSI INTI ---

    const startNewChat = () => {
        conversationHistory = [];
        chatBox.innerHTML = ''; // Hapus semua pesan
        chatBox.appendChild(welcomeView); // Tampilkan hero section
        
        // Tambahkan separator tanggal
        const dateSeparator = document.createElement('div');
        dateSeparator.className = 'message-date-separator';
        dateSeparator.textContent = 'Hari ini';
        chatBox.appendChild(dateSeparator);

        // Tampilkan pesan selamat datang dari AI secara otomatis
        tampilkanPesan({
            text: "Nama saya Fall Moderators AI. Anggap saya sebagai asisten yang siap membantu Anda belajar, merencanakan, dan terhubung. Apa yang bisa saya bantu hari ini?"
        }, 'bot');

        // Tampilkan saran prompt
        renderSuggestionChips();
        isFirstMessage = true;
    };

    const tampilkanPesan = (content, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        // Asumsi logo ada di path yang sama
        const avatarUrl = sender === 'user' ? '' : 'https://files.catbox.moe/f2er59.jpg';
        
        let contentHtml = `<img src="${avatarUrl}" class="message-avatar">`;
        contentHtml += `<div class="message-content">${marked.parse(content.text)}</div>`;
        
        if (sender === 'user') {
            // Balik urutan untuk pesan user
            contentHtml = `<div class="message-content">${marked.parse(content.text)}</div>`;
            // Avatar pengguna bisa ditambahkan di sini jika diinginkan
        }
        
        messageElement.innerHTML = contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const promptText = userInput.value.trim();
        if (promptText === "") return;

        // Sembunyikan hero section dan saran jika ini pesan pertama
        if (isFirstMessage) {
            welcomeView.style.display = 'none';
            suggestionChipsContainer.style.display = 'none';
            isFirstMessage = false;
        }

        tampilkanPesan({ text: promptText }, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: promptText }] });
        userInput.value = "";

        // Indikator loading bisa ditambahkan di sini
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<img src="https://files.catbox.moe/f2er59.jpg" class="message-avatar"><div class="message-content">...</div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan({ text: botResponse }, 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan({ text: `Maaf, terjadi kesalahan: ${error.message}` }, 'bot');
        }
    };
    
    // Panggil backend proxy Anda (tidak berubah)
    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error dari server: ${response.status}`);
        }
        const data = await response.json();
        return data.text;
    };
    
    const renderSuggestionChips = () => {
        suggestionChipsContainer.innerHTML = '';
        const suggestions = ["Jelaskan tentang AI", "Buat resep makan malam", "Tulis sebuah puisi"];
        
        suggestions.forEach(text => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = text;
            chip.onclick = () => {
                userInput.value = text;
                kirimPesan();
            };
            suggestionChipsContainer.appendChild(chip);
        });
        suggestionChipsContainer.style.display = 'flex';
    };

    // --- EVENT LISTENERS ---
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    
    // Event listener untuk tombol fungsionalitas lain (jika masih digunakan)
    // menuToggleButton.addEventListener('click', ...);
    // attachFileBtn.addEventListener('click', ...);

    // --- INISIALISASI ---
    startNewChat();
});
