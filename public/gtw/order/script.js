document.addEventListener('DOMContentLoaded', () => {

    const LOGIN_URL = '/login.html';
    
    // Objek untuk menyimpan data yang sudah dikategorikan
    let categorizedOrders = {
        pending: [],
        proses: [],
        done: [],
        cancel: []
    };

    // Objek untuk menyimpan referensi ID Produk ke Nama Produk
    let productMap = {};

    // DOM Elements
    const btnLogout = document.getElementById('btnLogout');
    const tableBody = document.getElementById('orderTableBody');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    let currentTab = 'pending'; // Tab aktif default

    // INIT
    async function init() {
        await checkSession();
        await fetchProducts(); // Ambil produk dulu agar bisa mapping ID ke Nama
        await fetchOrders();
        
        // Auto refresh tiap 10 detik
        setInterval(fetchOrders, 10000);
    }

    // ==========================================
    // 1. SESI & UTILITIES
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
        try { await fetch('/api/admin/account/logout', { method: 'POST' }); } catch(e) {}
        window.location.href = LOGIN_URL;
    });

    function formatRupiah(angka) {
        if (!angka) return "-";
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    }

    function formatDate(dateString) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        }).format(date);
    }

    // ==========================================
    // 2. FETCH MAPPING PRODUK
    // ==========================================
    // Tujuan: Mengubah "be5ad8915..." menjadi "Saldo Dana 10k" di tabel
    async function fetchProducts() {
        try {
            const res = await fetch('/api/product');
            const json = await res.json();
            if (json.status && Array.isArray(json.data)) {
                json.data.forEach(p => {
                    productMap[p.id] = p.name;
                });
            }
        } catch (error) {
            console.log("Gagal memuat mapping produk");
        }
    }

    // ==========================================
    // 3. FETCH & CATEGORIZE ORDERS
    // ==========================================
    async function fetchOrders() {
        try {
            const res = await fetch('/api/admin/order');
            const json = await res.json();

            if (json.status) {
                // Reset penampung
                categorizedOrders = { pending: [], proses: [], done: [], cancel: [] };

                // 1. Proses Array Utama (Proses, Done, Cancel)
                if (Array.isArray(json.data)) {
                    json.data.forEach(order => {
                        const status = order.status?.toLowerCase();
                        if (status === 'canceled') {
                            categorizedOrders.cancel.push(order);
                        } else if (status === 'done' || status === 'success') {
                            categorizedOrders.done.push(order);
                        } else if (status === 'proses' || status === 'processing') {
                            categorizedOrders.proses.push(order);
                        }
                    });
                }

                // 2. Proses Array Pending (Struktur Nested Hash Token)
                if (Array.isArray(json.pending)) {
                    json.pending.forEach(sessionGroup => {
                        Object.values(sessionGroup).forEach(orderArray => {
                            if (Array.isArray(orderArray)) {
                                orderArray.forEach(order => {
                                    categorizedOrders.pending.push(order);
                                });
                            }
                        });
                    });
                }

                // Update angka pada Tab Menu
                document.getElementById('countPending').innerText = categorizedOrders.pending.length;
                document.getElementById('countProses').innerText = categorizedOrders.proses.length;
                document.getElementById('countDone').innerText = categorizedOrders.done.length;
                document.getElementById('countCancel').innerText = categorizedOrders.cancel.length;

                // Render tabel sesuai tab yang sedang aktif
                renderTable(currentTab);
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:red;">Gagal terhubung ke server.</td></tr>`;
        }
    }

    // ==========================================
    // 4. TAB & RENDER LOGIC
    // ==========================================
    
    // Logic perpindahan tab
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Hapus class active dari semua tombol
            tabBtns.forEach(b => b.classList.remove('active'));
            // Tambahkan class active ke tombol yang diklik
            e.currentTarget.classList.add('active');
            
            // Render tabel sesuai target data
            currentTab = e.currentTarget.getAttribute('data-target');
            renderTable(currentTab);
        });
    });

    // Fungsi Render HTML
    function renderTable(category) {
        const dataToRender = categorizedOrders[category];
        tableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Tidak ada data orderan untuk kategori ini.</td></tr>`;
            return;
        }

        // Urutkan dari yang terbaru (opsional, mengandalkan tanggal)
        dataToRender.sort((a, b) => {
            const dateA = new Date(a.orderDate || a.hyperTokenCreateAt || 0);
            const dateB = new Date(b.orderDate || b.hyperTokenCreateAt || 0);
            return dateB - dateA;
        });

        dataToRender.forEach(o => {
            // Penyesuaian variabel karena struktur JSON pending dan data utama sedikit berbeda
            const id = o.orderId || o.orderID;
            const productId = o.productId || o.productID;
            const productName = productMap[productId] || productId; // Jika nama ketemu pakai nama, jika tidak tampilkan ID-nya
            const dateStr = o.orderDate || o.hyperTokenCreateAt;
            
            // Konfigurasi Badge Warna
            let badgeClass = 'bg-pending';
            let statusText = 'PENDING';
            if (category === 'proses') { badgeClass = 'bg-proses'; statusText = 'PROSES'; }
            if (category === 'done') { badgeClass = 'bg-done'; statusText = 'DONE'; }
            if (category === 'cancel') { badgeClass = 'bg-cancel'; statusText = 'CANCEL'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${id}</strong></td>
                <td>${formatDate(dateStr)}</td>
                <td>${o.custName || '-'}</td>
                <td>${productName}</td>
                <td><span style="text-transform: capitalize;">${o.orderType || '-'}</span></td>
                <td>${formatRupiah(o.price)}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    init();
});