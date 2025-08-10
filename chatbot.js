// --- BAGIAN ASLI: LOGIKA CHATBOT GEMINI (TIDAK BERUBAH) ---

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('pesan');
const sendButton = document.getElementById('kirim-btn');
// Kita pindahkan typingIndicator ke atas agar bisa diakses oleh fungsi baru
const typingIndicator = document.querySelector('.typing-indicator'); 

async function kirimPesan() {
    // Sembunyikan welcome screen jika ada saat pesan pertama dikirim
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    const messageText = userInput.value.trim();
    if (messageText === "") return;

    tampilkanPesan(messageText, 'user');
    userInput.value = "";
    userInput.style.height = 'auto'; // Reset tinggi textarea

    tampilkanIndikatorMengetik(true);

    try {
        const botResponse = await geminiChatAi(messageText);
        tampilkanPesan(botResponse, 'bot');
    } catch (error) {
        console.error("Gagal menghubungi API Gemini:", error);
        tampilkanPesan("Maaf, terjadi kesalahan. Tidak bisa terhubung ke AI saat ini.", 'bot');
    } finally {
        tampilkanIndikatorMengetik(false);
    }
}

async function geminiChatAi(prompt) {
    const apiKey = "api_KEY"; // Ganti dengan API Key Anda
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("API response format tidak valid:", data);
            return "Maaf, saya menerima respon yang tidak valid dari AI.";
        }
    } catch (error) {
        console.error("Error dalam fetch ke Gemini API:", error);
        throw error;
    }
}

function tampilkanPesan(text, sender) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', sender === 'user' ? 'user-msg' : 'bot-msg');
    
    const messageParagraph = document.createElement('p');
    messageParagraph.textContent = text;
    
    messageContainer.appendChild(messageParagraph);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function tampilkanIndikatorMengetik(show) {
    typingIndicator.style.display = show ? 'flex' : 'none';
    if (show) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) { // Kirim dengan Enter, baris baru dengan Shift+Enter
        event.preventDefault();
        kirimPesan();
    }
});


// --- KODE BARU: MEMBUAT SEMUA TOMBOL BERFUNGSI ---

document.addEventListener('DOMContentLoaded', () => {

    // 1. Fitur Textarea Auto-Resize
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto'; // Reset tinggi ke default
        userInput.style.height = (userInput.scrollHeight) + 'px'; // Atur tinggi sesuai konten
    });

    // 2. Seleksi semua tombol yang belum berfungsi
    const menuBtn = document.querySelector('.chat-header .icon-btn');
    const appTitleBtn = document.querySelector('.app-title');
    const plansBtn = document.querySelector('.plans-btn');
    const callBtn = document.querySelector('.live-call-promo button');
    const actionButtons = document.querySelectorAll('.action-buttons button');

    // 3. Tambahkan event listener untuk setiap tombol

    // Tombol Menu Hamburger
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            alert('Fitur "Menu" belum diimplementasikan.');
        });
    }

    // Tombol Judul Aplikasi (BLACKBOXAI)
    if (appTitleBtn) {
        appTitleBtn.addEventListener('click', () => {
            alert('Fitur "Dropdown Judul" belum diimplementasikan.');
        });
    }

    // Tombol PLANS
    if (plansBtn) {
        plansBtn.addEventListener('click', () => {
            alert('Fitur "Plans" belum diimplementasikan.');
        });
    }
    
    // Tombol Call
    if (callBtn) {
        callBtn.addEventListener('click', () => {
            alert('Fitur "Live Call" belum diimplementasikan.');
        });
    }

    // Tombol Aksi di bagian bawah (Research, Image, dll.)
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Mengambil teks dari tombol, atau dari ikon jika tidak ada teks
            const buttonText = button.textContent.trim() || button.querySelector('svg').constructor.name;
            alert(`Fitur "${buttonText}" belum diimplementasikan.`);
        });
    });

    console.log('Semua tombol kini telah aktif dan siap dikembangkan.');
});
