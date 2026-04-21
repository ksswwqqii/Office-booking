// 1. ПРОВЕРКА АВТОРИЗАЦИИ ПРИ ЗАГРУЗКЕ
window.onload = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        showApp(currentUser.name);
    }
};

// Вспомогательные функции переключения экранов
function showAuth() { document.getElementById('auth-modal').classList.remove('hidden'); }
function toggleAuth(isReg) {
    document.getElementById('login-box').classList.toggle('hidden', isReg);
    document.getElementById('reg-box').classList.toggle('hidden', !isReg);
}

function showApp(name) {
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = name;
    initApp();
    loadMyBookings();
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// 2. РЕГИСТРАЦИЯ (Данные сохраняются в localStorage)
function register() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    const name = document.getElementById('reg-firstname').value;
    const surname = document.getElementById('reg-lastname').value;

    if (!email || !password || !name) return alert("Заполните основные поля");

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) return alert("Такой пользователь уже существует");

    users[email] = { name: name, surname: surname, password: password, bookings: [] };
    localStorage.setItem('users', JSON.stringify(users));
    
    alert("Регистрация успешна! Теперь войдите.");
    toggleAuth(false);
}

// 3. ВХОД
function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[email] && users[email].password === password) {
        const userData = { email: email, name: users[email].name };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        showApp(userData.name);
    } else {
        alert("Неверный email или пароль");
    }
}

// 4. КАРТА ОФИСА (40 КОМНАТ)
function initApp() {
    const map = document.getElementById('office-map');
    map.innerHTML = "";
    const rooms = ["Комната 1", "Комната 2", "Комната 3", "Комната 4", "Комната 5"];

    for (let f = 1; f <= 8; f++) {
        const row = document.createElement('div');
        row.className = 'floor-row';
        row.setAttribute('data-floor', `${f} ЭТАЖ`);
        rooms.forEach((rName, index) => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <h4>${rName}</h4>
                <p>Мест: ${(index + 1) * 2}</p>
                <button class="select-btn" onclick="openBooking('${rName}', ${f})">Выбрать</button>
            `;
            row.appendChild(card);
        });
        map.appendChild(row);
    }
}

// 5. БРОНИРОВАНИЕ
let selectedRoomData = {};

function openBooking(room, floor) {
    selectedRoomData = { room, floor };
    document.getElementById('target-room-name').innerText = `${room}, этаж ${floor}`;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('res-date').value = today;
    document.getElementById('booking-form-container').classList.remove('hidden');
    document.getElementById('booking-form-container').scrollIntoView({ behavior: 'smooth' });
}

function closeBooking() { document.getElementById('booking-form-container').classList.add('hidden'); }

document.getElementById('res-form').onsubmit = function(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users'));
    
    const newBooking = {
        room: selectedRoomData.room,
        floor: selectedRoomData.floor,
        date: document.getElementById('res-date').value,
        start: document.getElementById('res-start').value,
        end: document.getElementById('res-end').value
    };

    users[currentUser.email].bookings.push(newBooking);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert("Забронировано успешно!");
    closeBooking();
    loadMyBookings();
};

// 6. ОТОБРАЖЕНИЕ БРОНЕЙ
function loadMyBookings() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users'));
    const container = document.getElementById('res-list');
    const myBookings = users[currentUser.email].bookings;

    if (myBookings.length === 0) {
        container.innerHTML = '<p class="empty-msg">У вас пока нет броней</p>';
        return;
    }

    container.innerHTML = myBookings.map(b => `
        <div class="booking-item">
            <div style="font-weight: bold; color: #4B3621;">${b.room}, этаж ${b.floor}</div>
            <div style="font-size: 0.9em; color: #666;">${b.date.split('-').reverse().join('.')} | <strong>${b.start} — ${b.end}</strong></div>
        </div>
    `).reverse().join('');
}