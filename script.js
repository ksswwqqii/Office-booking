const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxPl9GYfq-nuGutdGgCmlbBdmiQYMVWST4bjZxYQLTsnsPHVLEq4w-vBMLCUGGy96j7iQ/exec";

// 1. ПРОВЕРКА СЕССИИ (Чтобы не вылетало при обновлении)
window.onload = function() {
    const savedName = localStorage.getItem('user_full_name');
    const savedEmail = localStorage.getItem('user_email');

    if (savedName && savedEmail) {
        document.getElementById('welcome-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('user-display').innerText = savedName;
        initApp();
        loadMyBookings();
    }
};

// 2. МАСКА ТЕЛЕФОНА
const phoneInput = document.getElementById('reg-phone');
if (phoneInput) {
    phoneInput.addEventListener('focus', () => { if (!phoneInput.value) phoneInput.value = '+7 ('; });
    phoneInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.startsWith('7')) v = v.slice(1);
        let r = '+7 (';
        if (v.length > 0) r += v.substring(0, 3);
        if (v.length > 3) r += ') ' + v.substring(3, 6);
        if (v.length > 6) r += '-' + v.substring(6, 8);
        if (v.length > 8) r += '-' + v.substring(8, 10);
        e.target.value = r;
    });
}

// 3. АВТОРИЗАЦИЯ И ВЫХОД
function showAuth() { document.getElementById('auth-modal').classList.remove('hidden'); }
function toggleAuth(isReg) {
    document.getElementById('login-box').classList.toggle('hidden', isReg);
    document.getElementById('reg-box').classList.toggle('hidden', !isReg);
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!email || !pass) return alert("Заполните все поля!");
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`);
        const data = await response.json();
        if (data.result === 'success') {
            localStorage.setItem('user_full_name', `${data.name} ${data.surname}`);
            localStorage.setItem('user_email', email);
            location.reload();
        } else {
            alert("Неверный логин или пароль!");
        }
    } catch (e) { alert("Ошибка связи с сервером"); }
}

async function register() {
    const data = {
        action: 'register',
        lastName: document.getElementById('reg-lastname').value.trim(),
        firstName: document.getElementById('reg-firstname').value.trim(),
        phone: phoneInput.value,
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-pass').value.trim()
    };
    if (data.phone.length < 18) return alert("Введите полный номер телефона!");
    
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
    alert("Регистрация успешна! Теперь войдите.");
    toggleAuth(false);
}

// 4. ИНИЦИАЛИЗАЦИЯ КАРТЫ (40 КОМНАТ)
function initApp() {
    const map = document.getElementById('office-map');
    if (!map) return;
    map.innerHTML = "";
    
    const rooms = [
        {id:"R1", n:"Комната 1", c:2}, {id:"R2", n:"Комната 2", c:4},
        {id:"R3", n:"Комната 3", c:6}, {id:"R4", n:"Комната 4", c:12},
        {id:"R5", n:"Комната 5", c:20}
    ];

    for (let f = 1; f <= 8; f++) {
        const row = document.createElement('div');
        row.className = 'floor-row';
        row.setAttribute('data-floor', `${f} ЭТАЖ`);
        rooms.forEach(r => {
            row.innerHTML += `
                <div class="room-card">
                    <h4>${r.n}</h4>
                    <p>Мест: ${r.c}</p>
                    <button class="select-btn" onclick="openBooking('${r.n} (эт. ${f})', '${f}${r.id}')">Выбрать</button>
                </div>`;
        });
        map.appendChild(row);
    }
}

// 5. ПОЛУЧЕНИЕ БРОНЕЙ (ИСПРАВЛЕНО: БЕРЕМ ТЕКСТ КАК ЕСТЬ)
async function loadMyBookings() {
    const email = localStorage.getItem('user_email');
    const container = document.getElementById('res-list');
    if (!container) return;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=get_my_bookings&email=${encodeURIComponent(email)}`);
        const bookings = await response.json();
        
        if (bookings.length === 0) {
            container.innerHTML = '<p class="empty-msg">У вас пока нет активных бронирований</p>';
            return;
        }

        container.innerHTML = bookings.map(b => {
            const floor = b.roomCode.charAt(0);
            const roomNum = b.roomCode.slice(-1); 

            // Мы НЕ создаем объект new Date(), просто выводим строку b.start и b.end
            return `
                <div class="booking-item">
                    <div style="font-weight: bold; color: #4B3621;">Комната ${roomNum}, этаж ${floor}</div>
                    <div style="font-size: 0.9em; color: #666;">
                        ${b.date} | <strong>${b.start} — ${b.end}</strong>
                    </div>
                </div>`;
        }).join('');
    } catch (e) { container.innerHTML = "Ошибка загрузки списка"; }
}

// 6. ОФОРМЛЕНИЕ БРОНИ
let currentRoomId = "";
function openBooking(name, id) {
    currentRoomId = id;
    document.getElementById('target-room-name').innerText = name;
    
    // Ставим сегодняшнюю дату как минимальную
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('res-date').setAttribute('min', today);
    document.getElementById('res-date').value = today; // Чтобы дата сразу стояла 

    document.getElementById('booking-form-container').classList.remove('hidden');
    document.getElementById('booking-form-container').scrollIntoView({ behavior: 'smooth' });
}

function closeBooking() { document.getElementById('booking-form-container').classList.add('hidden'); }

document.getElementById('res-form').onsubmit = async (e) => {
    e.preventDefault();
    const start = document.getElementById('res-start').value;
    const end = document.getElementById('res-end').value;

    if (start >= end) return alert("Время начала должно быть раньше времени окончания!");

    const b = {
        action: 'book',
        clientId: localStorage.getItem('user_email'),
        roomId: currentRoomId,
        date: document.getElementById('res-date').value,
        start: start,
        end: end
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(b) });
        alert("Забронировано успешно!");
        closeBooking();
        loadMyBookings();
    } catch (err) { alert("Ошибка при бронировании"); }
};