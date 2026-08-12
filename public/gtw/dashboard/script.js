document.addEventListener('DOMContentLoaded', () => {
    
    const LOGIN_URL = '/gtw'; 

    const btnLogout = document.getElementById('btnLogout');
    const toast = document.getElementById('toast');

    const elProduk = document.getElementById('totalProduk');
    const elPending = document.getElementById('orderPending');
    const elProses = document.getElementById('orderProses');
    const elSuccess = document.getElementById('orderSuccess');
    const elCancel = document.getElementById('orderCancel');

    async function init() {
        await checkSession();
        
        fetchStats();
        
        setInterval(() => {
            fetchStats();
        }, 10000); 
    }

    async function checkSession() {
        try {
            const res = await fetch('/api/admin/account/session');
            if (!res.ok) throw new Error("Not logged in");
            const data = await res.json();
            if (!data.authenticated) throw new Error("Not authenticated");
        } catch (error) {
            window.location.href = LOGIN_URL;
        }
    }

    async function fetchStats() {
        try {
            const resProduct = await fetch('/api/product');
            if (resProduct.ok) {
                const jsonProduct = await resProduct.json();
                if (jsonProduct.status && Array.isArray(jsonProduct.data)) {
                    elProduk.innerText = jsonProduct.data.length; 
                }
            }

            const resOrder = await fetch('/api/admin/order');
            if (resOrder.ok) {
                const jsonOrder = await resOrder.json();
                
                if (jsonOrder.status) {
                    let countPending = 0;
                    let countProses = 0;
                    let countSuccess = 0;
                    let countCancel = 0;

                    if (Array.isArray(jsonOrder.data)) {
                        jsonOrder.data.forEach(order => {
                            const status = order.status?.toLowerCase();
                            
                            if (status === 'canceled') {
                                countCancel++;
                            } else if (status === 'done' || status === 'success') {
                                countSuccess++;
                            } else if (status === 'proses' || status === 'processing') {
                                countProses++;
                            }
                        });
                    }

                    if (Array.isArray(jsonOrder.pending)) {
                        jsonOrder.pending.forEach(sessionGroup => {
                            Object.values(sessionGroup).forEach(orderArray => {
                                if (Array.isArray(orderArray)) {
                                    countPending += orderArray.length;
                                }
                            });
                        });
                    }

                    elPending.innerText = countPending;
                    elProses.innerText = countProses;
                    elSuccess.innerText = countSuccess;
                    elCancel.innerText = countCancel;
                }
            }

        } catch (error) {
            console.error("Gagal mengambil data statistik:", error);
            if(elProduk.innerText === "-") {
                elProduk.innerText = "0";
                elPending.innerText = "0";
                elProses.innerText = "0";
                elSuccess.innerText = "0";
                elCancel.innerText = "0";
            }
        }
    }

    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        const originalHtml = btnLogout.innerHTML;
        btnLogout.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Keluar...</span>`;
        btnLogout.style.pointerEvents = 'none';
        try {
            const res = await fetch('/api/admin/account/logout', { 
                method: 'POST' 
            });
            const data = await res.json();

            if (data.status) {
                window.location.href = LOGIN_URL;
            } else {
                showToast("Gagal logout", "toast-error");
                btnLogout.innerHTML = originalHtml;
                btnLogout.style.pointerEvents = 'auto';
            }
        } catch (error) {
            window.location.href = LOGIN_URL;
        }
    });
    let toastTimeout;
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `show ${type}`;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.className = ''; }, 3000);
    }
    init();
});