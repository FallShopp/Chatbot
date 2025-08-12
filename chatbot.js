document.addEventListener('DOMContentLoaded', () => {
    
    const setAppHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    window.addEventListener('resize', setAppHeight);
    setAppHeight();

    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('pesan-input');
    const sendButton = document.getElementById('kirim-btn');
    const micBtn = document.getElementById('mic-btn');
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    let conversationHistory = [];
    let attachedFile = null;

    const createWelcomeScreen = () => {
        chatBox.innerHTML = `
            <div class="welcome-view">
                <div class="welcome-header">
                    <h1 id="welcome-greeting" class="gradient-text"></h1>
                    <p>Apa yang bisa saya bantu?</p>
                </div>
                <div class="suggestion-cards">
                    <div class="suggestion-card" data-prompt="Jelaskan apa itu kecerdasan buatan">
                        <h3>Jelaskan topik</h3>
                        <p>Seperti kecerdasan buatan atau blockchain</p>
                    </div>
                    <div class="suggestion-card" data-prompt="Tulis email profesional ke klien">
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

    const tampilkanPesan = (parts, sender) => {
        const welcomeView = document.querySelector('.welcome-view');
        if (welcomeView) welcomeView.remove();
        
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');

        const botAvatar = `<div class="message-avatar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
        const userAvatar = `<div class="message-avatar">U</div>`;
        
        let contentInnerHtml = parts.map(part => {
            if (part.text) return marked.parse(part.text);
            if (part.inlineData) return `<img src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" style="max-width: 200px; border-radius: 8px;">`;
            return '';
        }).join('<br>');
        
        const contentHtml = `<div class="message-content">${contentInnerHtml}</div>`;
        messageElement.innerHTML = (sender === 'bot' ? botAvatar : userAvatar) + contentHtml;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = async () => {
        const messageText = userInput.value.trim();
        if (messageText === "" && !attachedFile) return;

        const userParts = [];
        if (attachedFile) userParts.push(attachedFile.geminiPart);
        if (messageText) userParts.push({ text: messageText });
        
        tampilkanPesan(userParts, 'user');
        conversationHistory.push({ role: 'user', parts: userParts });
        userInput.value = "";
        removeAttachedFile();
        
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.className = 'thinking-indicator';
        thinkingIndicator.innerHTML = `<div class="thinking-logo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.29 5.71a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm3 9.58a1.29 1.29 0 1 1-1.29 1.29 1.29 1.29 0 0 1 1.29-1.29Zm-6-5a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9.29 12.29Z"/></svg></div>`;
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
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            attachedFile = { geminiPart: { inlineData: { mimeType: file.type, data: base64Data } } };
            displayImagePreview(reader.result);
            updateInputButtons();
        };
        reader.readAsDataURL(file);
    });

    function displayImagePreview(imageDataUrl) {
        filePreviewContainer.innerHTML = `<div class="image-preview"><img src="${imageDataUrl}" alt="Preview"><button class="remove-image-btn">&times;</button></div>`;
        filePreviewContainer.querySelector('.remove-image-btn').addEventListener('click', removeAttachedFile);
    }
    function removeAttachedFile() { attachedFile = null; filePreviewContainer.innerHTML = ''; fileInput.value = ''; updateInputButtons(); }

    sendButton.addEventListener('click', kirimPesan);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirimPesan(); } });
    userInput.addEventListener('input', updateInputButtons);
    
    startNewChat();
});
