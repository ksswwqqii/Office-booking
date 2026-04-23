// Проверь, чтобы эти строки были САМЫМИ ПЕРВЫМИ в файле
const SUPABASE_URL = 'https://egudqhxfqpjnqajswpgc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GUhBHSWaVw9BeNe5gtHA2w_ayxKPClg';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Проверка входа при загрузке
window.onload = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) { 
        showApp(session.user.email); 
    }
};

function showAuth() { 
    document.getElementById('auth-modal').classList.remove('hidden'); 
}

function toggleAuth(isReg) {
    document.getElementById('login-box').classList.toggle('hidden', isReg);
    document.getElementById('reg-box').classList.toggle('hidden', !isReg);
}

async function showApp(email) {
    document.getElementById('welcome-section').classList.add('hidden');
    document.getElementById('auth-modal').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = email;
    initApp();
    loadMyBookings();
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

async function register() {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    
    const { data, error } = await _supabase.auth.signUp({ email, password });
    
    if (error) { 
        alert("Ошибка регистрации: " + error.message); 
    } else { 
        alert("Успешно! Теперь попробуйте войти."); 
        toggleAuth(false); 
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;
    
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
        alert("Ошибка входа: " + error.message); 
    } else { 
        showApp(data.user.email); 
    }
}

function initApp() {
    const map = document.getElementById('office-map');
    if (!map) return;
    map.innerHTML = "";
    
    const rooms = ["Комната 1", "Комната 2", "Комната 3", "Комната 4", "Комната 5"];
    
    for (let f = 1; f <= 8; f++) {
        const row = document.createElement('div');
        row.className = 'floor-row';
        row.setAttribute('data-floor', `${f} ЭТАЖ`);
        
        rooms.forEach((rName, i) => {
            row.innerHTML += `
                <div class="room-card">
                    <h4>${rName}</h4>
                    <p>Мест: ${(i + 1) * 2}</p>
                    <button class="select-btn" onclick="openBooking('${rName}', ${f})">Выбрать</button>
                </div>`;
        });
        map.appendChild(row);
    }
}

let selectedRoomData = {};

function openBooking(room, floor) {
    selectedRoomData = { room, floor };
    document.getElementById('target-room-name').innerText = `${room}, этаж ${floor}`;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('res-date').value = today;
    document.getElementById('booking-form-container').classList.remove('hidden');
    document.getElementById('booking-form-container').scrollIntoView({ behavior: 'smooth' });
}

function closeBooking() { 
    document.getElementById('booking-form-container').classList.add('hidden'); 
}

document.getElementById('res-form').onsubmit = async function(e) {
    e.preventDefault();
    const { data: { user } } = await _supabase.auth.getUser();
    
    const booking = {
        user_id: user.id,
        room: selectedRoomData.room,
        floor: selectedRoomData.floor,
        date: document.getElementById('res-date').value,
        time_range: `${document.getElementById('res-start').value} - ${document.getElementById('res-end').value}`
    };
    
    const { error } = await _supabase.from('bookings').insert([booking]);
    
    if (error) { 
        alert("Ошибка базы данных: " + error.message); 
    } else { 
        alert("Забронировано!"); 
        closeBooking(); 
        loadMyBookings(); 
    }
};

async function loadMyBookings() {
    const container = document.getElementById('res-list');
    const { data: bookings, error } = await _supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });
        
    if (error) { 
        console.error(error); 
        return; 
    }
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="empty-msg">У вас пока нет активных броней</p>';
        return;
    }
    
    container.innerHTML = bookings.map(b => `
        <div class="booking-item">
            <div style="font-weight: bold; color: #4B3621;">${b.room}, этаж ${b.floor}</div>
            <div style="font-size: 0.9em; color: #666;">
                ${b.date.split('-').reverse().join('.')} | <strong>${b.time_range}</strong>
            </div>
        </div>
    `).join('');
}
