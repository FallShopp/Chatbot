document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const pesanInput = document.getElementById('pesan-input');
    const kirimBtn = document.getElementById('kirim-btn');
    const newChatSidebarBtn = document.getElementById('new-chat-sidebar-btn');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const allButtons = document.querySelectorAll('button');

    // --- FUNGSI UTAMA ---

    const tampilkanPesan = (message, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender === 'user' ? 'user-message' : 'bot-message');
        
        const avatarInitial = sender === 'user' ? 'ME' : 'AI';

        messageDiv.innerHTML = `
            <div class="avatar">${avatarInitial}</div>
            <div class="message-content">${message}</div>
        `;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const kirimPesan = () => {
        const pesan = pesanInput.value.trim();
        if (pesan) {
            tampilkanPesan(pesan, 'user');
            pesanInput.value = '';
            
            // Tampilkan loading/typing indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('chat-message', 'bot-message');
            loadingDiv.innerHTML = `
                <div class="avatar">AI</div>
                <div class="message-content">...</div>
            `;
            chatBox.appendChild(loadingDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
            
            // Simulasi respons AI
            setTimeout(() => {
                chatBox.removeChild(loadingDiv); // Hapus loading
                tampilkanPesan('Ini adalah respons otomatis. Fitur AI yang sebenarnya perlu dihubungkan.', 'bot');
            }, 1500);
        }
    };
    
    // --- EVENT LISTENERS ---

    kirimBtn.addEventListener('click', kirimPesan);
    pesanInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            kirimBtn.click();
        }
    });

    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    };

    openSidebarBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    newChatSidebarBtn.addEventListener('click', () => {
        chatBox.innerHTML = ''; // Kosongkan chat
        tampilkanPesan('Memulai chat baru...', 'bot');
        toggleSidebar();
    });

    // Tambahkan notifikasi untuk semua tombol lain yang belum berfungsi
    allButtons.forEach(button => {
        if (!button.id || !['kirim-btn', 'open-sidebar-btn', 'close-sidebar-btn', 'new-chat-sidebar-btn'].includes(button.id)) {
            button.addEventListener('click', (e) => {
                const buttonText = e.currentTarget.textContent.trim();
                if (buttonText) {
                    alert(`Fitur "${buttonText}" belum diimplementasikan.`);
                }
            });
        }
    });
});
