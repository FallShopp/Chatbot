document.addEventListener('DOMContentLoaded', () => {
    
    // --- SOLUSI LAYOUT PONSEl ---
    const setAppHeight = () => {
        document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    // --- SELEKSI ELEMEN DOM ---
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const welcomeView = document.querySelector('.welcome-view');
    
    // Tombol Fungsional
    const menuToggleButton = document.getElementById('menu-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatButton = document.getElementById('new-chat-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');

    // --- STATE & FUNGSI UTAMA ---
    let conversationHistory = [];
    let attachedFile = null;

    const updateSendButtonState = () => {
        sendButton.disabled = userInput.value.trim() === '' && !attachedFile;
    };

    const tampilkanPesan = (parts, sender) => {
        if (welcomeView) { welcomeView.style.display = 'none'; }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const avatarUrl = sender === 'user' ? null : 'https://files.catbox.moe/f2er59.jpg';
        const senderName = sender === 'user' ? 'You' : 'Fall Asisten AI';
        
        let contentInnerHtml = '';
        parts.forEach(part => {
            if (part.text) {
                contentInnerHtml += marked.parse(part.text);
            } else if (part.inlineData) {
                contentInnerHtml += `<div class="sent-file"><img src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" alt="File terlampir"></div>`;
            }
        });

        const messageBubbleHtml = `<div class="message-bubble"><div class="message-content">${contentInnerHtml}</div></div>`;
        let finalMessageHtml = `<div class="message-content-wrapper">
                                    <div class="sender-name">${senderName}</div>
                                    ${messageBubbleHtml}
                                </div>`;
        
        if (avatarUrl) {
            messageElement.innerHTML = `<img src="${avatarUrl}" class="message-avatar">` + finalMessageHtml;
        } else {
            messageElement.innerHTML = finalMessageHtml;
        }

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        updateSendButtonState();
        
        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });

        tampilkanPesan(userParts, 'user');
        conversationHistory.push({ role: 'user', parts: userParts });

        userInput.value = "";
        removeAttachedFile();
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `
            <div class="thinking-logo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg>
            </div>
        `;
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

    const geminiChatAi = async (history) => {
        const proxyUrl = '/api/gemini';
        const response = await fetch(proxyUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `Error dari server: ${response.status}`); }
        const data = await response.json();
        return data.text;
    };

    // --- LOGIKA UPLOAD FILE ---
    attachFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { alert('Ukuran file terlalu besar! Maksimal 4MB.'); fileInput.value = ''; return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = { geminiPart: { inlineData: { mimeType: file.type, data: base64Data } } };
            updateSendButtonState();
        };
        reader.readAsDataURL(file);
    });
    function removeAttachedFile() { attachedFile = null; fileInput.value = ''; updateSendButtonState(); }

    // --- EVENT LISTENERS ---
    menuToggleButton.addEventListener('click', () => document.body.classList.toggle('sidebar-visible'));
    sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-visible'));
    userInput.addEventListener('input', updateSendButtonState);
    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); }
    });
    newChatButton.addEventListener('click', () => location.reload()); // Cara mudah untuk chat baru
});
