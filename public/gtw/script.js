document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorAlert = document.getElementById('errorAlert');
    const DASHBOARD_URL = '/gtw/dashboard';
    checkSession();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        hideError();
        setLoading(true);
        try {
            const response = await fetch('/api/admin/account/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok && result.status === true) {
                window.location.href = DASHBOARD_URL;
            } else {
                showError(result.message || 'Email atau password salah.');
            }
        } catch (error) {
            console.error('Terjadi kesalahan:', error);
            showError('Tidak dapat terhubung ke server. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    });
    async function checkSession() {
        try {
            const response = await fetch('/api/admin/account/session');
            const result = await response.json();
            if (response.ok && result.authenticated === true) {
                window.location.href = DASHBOARD_URL;
            }
        } catch (error) {
            console.log('Tidak ada sesi yang aktif.');
        }
    }
    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }
    function hideError() {
        errorAlert.style.display = 'none';
        errorAlert.textContent = '';
    }
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memproses...';
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk';
        }
    }
});