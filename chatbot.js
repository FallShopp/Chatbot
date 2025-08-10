document.addEventListener('DOMContentLoaded', () => {

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeGreeting = document.getElementById('welcome-greeting');
    const themeSwitcher = document.getElementById('theme-switcher');

    // Elemen Alat Bantu
    const summarizeInput = document.getElementById('summarize-input');
    const summarizeBtn = document.getElementById('summarize-btn');
    const emailTo = document.getElementById('email-to');
    const emailSubject = document.getElementById('email-subject');
    const emailPoints = document.getElementById('email-points');
    const emailBtn = document.getElementById('email-btn');

    // --- STATE APLIKASI ---
    let conversationHistory = []; // Menyimpan riwayat percakapan saat ini

    // --- FUNGSI INTI & TAMPILAN ---
    
    const setGreeting = () => {
        const hour = new Date().getHours();
        let greeting = "Selamat Datang!";
        if (hour < 11) greeting = "Selamat Pagi!";
        else if (hour < 15) greeting = "Selamat Siang!";
        else if (hour < 19) greeting = "Selamat Sore!";
        else greeting = "Selamat Malam!";
        welcomeGreeting.textContent = greeting;
    };

    const tampilkanPesan = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
        
        const avatarHtml = `<div class="message-avatar">${sender === 'user' ? 'U' : 'A'}</div>`;
        const contentHtml = `<div class="message-content">${marked.parse(text)}</div>`;
        
        messageElement.innerHTML = (sender === 'bot' ? avatarHtml : '') + contentHtml + (sender === 'user' ? avatarHtml : '');
        chatBox.appendChild(messageElement);

        messageElement.querySelectorAll('pre code').forEach(hljs.highlightElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async (prompt) => {
        if (!prompt || prompt.trim() === "") return;

        tampilkanPesan(prompt, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });
        userInput.value = "";

        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'message bot-msg';
        loadingIndicator.innerHTML = `<div class="message-avatar">A</div><div class="message-content">Sedang berpikir...</div>`;
        chatBox.appendChild(loadingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const botResponse = await geminiChatAi(conversationHistory);
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan(botResponse, 'bot');
            conversationHistory.push({ role: 'model', parts: [{ text: botResponse }] });
        } catch (error) {
            chatBox.removeChild(loadingIndicator);
            tampilkanPesan(`Maaf, terjadi kesalahan: ${error.message}`, 'bot');
        }
    };

    // --- PANGGILAN API (METODE AMAN VIA BACKEND PROXY) ---
    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini'; // Memanggil backend proxy kita

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: history }) // Mengirim riwayat ke backend
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error dari server: ${response.status}`);
        }
        
        const data = await response.json();
        return data.text;
    };
    
    // --- EVENT LISTENERS ---

    sendButton.addEventListener('click', () => kirimPesan(userInput.value));
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(userInput.value); } });

    summarizeBtn.addEventListener('click', () => {
        const textToSummarize = summarizeInput.value;
        if (!textToSummarize) return;
        const prompt = `Tolong ringkas teks berikut secara jelas dan padat:\n\n---\n${textToSummarize}\n---`;
        kirimPesan(prompt);
    });

    emailBtn.addEventListener('click', () => {
        const to = emailTo.value;
        const subject = emailSubject.value;
        const points = emailPoints.value;
        if(!to || !subject || !points) return;
        const prompt = `Buatkan draf email profesional.\nKepada: ${to}\nSubjek: ${subject}\nPoin-poin utama yang harus disampaikan:\n${points}\n\nPastikan gaya bahasanya formal dan sopan.`;
        kirimPesan(prompt);
    });

    const applyTheme = (theme) => {
        document.body.classList.toggle('light-mode', theme === 'light');
        document.getElementById('highlight-theme-light').disabled = theme !== 'light';
        localStorage.setItem('aiAssistantTheme', theme);
        themeSwitcher.checked = theme === 'light';
    };
    themeSwitcher.addEventListener('change', () => applyTheme(themeSwitcher.checked ? 'light' : 'dark'));

    // --- INISIALISASI ---
    setGreeting();
    applyTheme(localStorage.getItem('aiAssistantTheme') || 'dark');
});
