document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const pesanInput = document.getElementById('pesan-input');
    const kirimBtn = document.getElementById('kirim-btn');
    const newChatSidebarBtn = document.getElementById('new-chat-sidebar-btn');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const generateButtons = document.querySelectorAll('.generate-btn');
    const llmDropdownToggle = document.getElementById('llm-dropdown');
    const llmDropdownMenu = document.querySelector('.dropdown-menu');
    const llmDropdownItems = document.querySelectorAll('.dropdown-item');

    // Fungsi untuk menampilkan pesan bot
    const tampilkanPesanBot = (message) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', 'bot-message');
        messageDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="message-content">${message}</div>
        `;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // Event listener untuk mengirim pesan
    kirimBtn.addEventListener('click', () => {
        const pesan = pesanInput.value.trim();
        if (pesan) {
            const userMessageDiv = document.createElement('div');
            userMessageDiv.classList.add('chat-message', 'user-message');
            userMessageDiv.innerHTML = `
                <div class="avatar">U</div>
                <div class="message-content">${pesan}</div>
            `;
            chatBox.appendChild(userMessageDiv);
            pesanInput.value = '';
            // Ganti ini dengan panggilan API Gemini/OpenAI Anda yang sebenarnya
            setTimeout(() => {
                tampilkanPesanBot('Ini adalah respons otomatis. Fitur AI belum terhubung.');
            }, 1000);
        }
    });

    pesanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            kirimBtn.click();
        }
    });

    // Toggle sidebar
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.style.display = 'block';
        setTimeout(() => sidebarOverlay.classList.add('open'), 10);
    });

    const closeSidebar = () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('open');
        setTimeout(() => sidebarOverlay.style.display = 'none', 300);
    };

    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Event listener untuk tombol "Chat Baru" di sidebar
    newChatSidebarBtn.addEventListener('click', () => {
        chatBox.innerHTML = `
            <div class="chat-message bot-message">
                <div class="avatar">AI</div>
                <div class="message-content">Memulai chat baru...</div>
            </div>
        `;
        closeSidebar();
    });

    // Event listeners untuk tombol-tombol generate media
    generateButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert(`Fitur ${button.textContent.trim()} akan segera hadir!`);
        });
    });

    // Dropdown LLM
    llmDropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        llmDropdownMenu.classList.toggle('show');
    });

    llmDropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            llmDropdownToggle.childNodes[1].textContent = ` ${e.target.textContent} `;
        });
    });

    window.addEventListener('click', (e) => {
        if (!llmDropdownToggle.contains(e.target)) {
            llmDropdownMenu.classList.remove('show');
        }
    });
});
