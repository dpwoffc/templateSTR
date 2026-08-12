document.addEventListener('DOMContentLoaded', () => {
    
    const LOGIN_URL = '/login.html'; // Sesuaikan file login kamu

    // DOM - Control
    const badgeStatus = document.getElementById('botStatusBadge');
    const btnStart = document.getElementById('btnStart');
    const btnRepair = document.getElementById('btnRepair');
    const btnDelete = document.getElementById('btnDelete');
    
    // DOM - Settings
    const inpBotName = document.getElementById('inpBotName');
    const inpBotNumber = document.getElementById('inpBotNumber');
    const inpOwnerNumber = document.getElementById('inpOwnerNumber');
    
    const btnUpdateName = document.getElementById('btnUpdateName');
    const btnUpdateBotNum = document.getElementById('btnUpdateBotNum');
    const btnUpdateOwnerNum = document.getElementById('btnUpdateOwnerNum');
    
    // DOM - Utilities
    const btnLogout = document.getElementById('btnLogout');
    const toast = document.getElementById('toast');

    // Inisialisasi
    async function init() {
        await checkSession();
        fetchBotStatus();
        fetchBotSettings();
        
        // Auto-refresh status bot setiap 10 detik
        setInterval(fetchBotStatus, 10000); 
    }

    // ==========================================
    // 1. SESI & LOGOUT
    // ==========================================
    async function checkSession() {
        try {
            const res = await fetch('/api/admin/account/session');
            const data = await res.json();
            if (!res.ok || !data.authenticated) throw new Error("Unauth");
        } catch (error) {
            window.location.href = LOGIN_URL;
        }
    }

    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/admin/account/logout', { method: 'POST' });
        } catch(e) {}
        window.location.href = LOGIN_URL;
    });

    // ==========================================
    // 2. BOT STATUS & CONTROL
    // ==========================================
    async function fetchBotStatus() {
        try {
            const res = await fetch('/api/admin/bot/status');
            const data = await res.json();
            
            if (res.ok && data.status) {
                badgeStatus.className = 'status-badge online';
                badgeStatus.innerText = 'ONLINE';
                btnStart.disabled = true; // Bot hidup, disable start
            } else {
                badgeStatus.className = 'status-badge offline';
                badgeStatus.innerText = 'OFFLINE';
                btnStart.disabled = false;
            }
        } catch (error) {
            badgeStatus.className = 'status-badge offline';
            badgeStatus.innerText = 'ERROR / OFFLINE';
            btnStart.disabled = false;
        }
    }

    async function sendBotControlAction(url, btnElement, loadingText) {
        const originalText = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}...`;

        try {
            const res = await fetch(url, { method: 'POST' });
            const data = await res.json();

            if (res.ok && data.status) {
                showToast(data.message, 'toast-success');
            } else {
                showToast(data.message || 'Action failed', 'toast-error');
            }
        } catch (error) {
            showToast('Koneksi ke server terputus', 'toast-error');
        } finally {
            btnElement.innerHTML = originalText;
            btnElement.disabled = false;
            fetchBotStatus(); 
        }
    }

    btnStart.addEventListener('click', () => sendBotControlAction('/api/admin/bot/start', btnStart, 'Starting'));
    
    btnRepair.addEventListener('click', () => {
        if(confirm("Yakin ingin repair bot?")) sendBotControlAction('/api/admin/bot/repair', btnRepair, 'Repairing');
    });

    btnDelete.addEventListener('click', () => {
        if(confirm("AWAS! Yakin hapus session? Bot perlu scan ulang.")) sendBotControlAction('/api/admin/bot/delete-session', btnDelete, 'Deleting');
    });

    // ==========================================
    // 3. BOT SETTINGS (CREDENTIALS)
    // ==========================================
    async function fetchBotSettings() {
        try {
            const res = await fetch('/api/admin/bot/settings');
            const json = await res.json();
            
            if (res.ok && json.status && json.data) {
                // Populate input value dengan data dari backend credential.js
                inpBotName.value = json.data.botName || "";
                inpBotNumber.value = json.data.botNumber || ""; 
                inpOwnerNumber.value = json.data.ownerNumber || "";
            }
        } catch (error) {
            console.error("Gagal memuat pengaturan bot");
        }
    }

    // Fungsi Reusable untuk update setting
    async function updateSetting(url, payload, btnElement) {
        const originalText = btnElement.innerText;
        btnElement.disabled = true;
        btnElement.innerText = 'Menyimpan...';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.status) {
                showToast(data.message, 'toast-success');
            } else {
                showToast(data.message || 'Gagal update', 'toast-error');
            }
        } catch (error) {
            showToast('Terjadi kesalahan jaringan', 'toast-error');
        } finally {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    }

    // Event Listener untuk Tombol Update
    btnUpdateName.addEventListener('click', () => {
        if (!inpBotName.value.trim()) return showToast('Nama bot tidak boleh kosong', 'toast-error');
        updateSetting('/api/admin/bot/edit/botName', { botName: inpBotName.value }, btnUpdateName);
    });

    btnUpdateBotNum.addEventListener('click', () => {
        if (!inpBotNumber.value.trim()) return showToast('Nomor bot tidak boleh kosong', 'toast-error');
        // Note: Field di route API kamu adalah 'bottNumber' dengan double 't'
        updateSetting('/api/admin/bot/edit/bottNumber', { bottNumber: inpBotNumber.value }, btnUpdateBotNum);
    });

    btnUpdateOwnerNum.addEventListener('click', () => {
        if (!inpOwnerNumber.value.trim()) return showToast('Nomor owner tidak boleh kosong', 'toast-error');
        updateSetting('/api/admin/bot/edit/ownerNumber', { ownerNumber: inpOwnerNumber.value }, btnUpdateOwnerNum);
    });

    // ==========================================
    // 4. UI UTILITIES
    // ==========================================
    let toastTimeout;
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `show ${type}`;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.className = ''; }, 3000);
    }

    // Jalankan skrip saat dimuat
    init();
});