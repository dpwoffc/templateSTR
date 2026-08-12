document.addEventListener('DOMContentLoaded', () => {

    const LOGIN_URL = '/login.html';
    let isEditMode = false;

    // DOM Elements - Table & Layout
    const tableBody = document.getElementById('productTableBody');
    const btnLogout = document.getElementById('btnLogout');
    const toast = document.getElementById('toast');

    // DOM Elements - Modal
    const modalOverlay = document.getElementById('modalOverlay');
    const btnShowAddModal = document.getElementById('btnShowAddModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const productForm = document.getElementById('productForm');
    const modalTitle = document.getElementById('modalTitle');
    const btnSaveProduct = document.getElementById('btnSaveProduct');
    const reqThumbIndicator = document.getElementById('reqThumbIndicator');
    const thumbHint = document.getElementById('thumbHint');

    // DOM Elements - Inputs
    const inpId = document.getElementById('productId');
    const inpNama = document.getElementById('inpNama');
    const inpHarga = document.getElementById('inpHarga');
    const inpDeskripsi = document.getElementById('inpDeskripsi');
    const inpWa = document.getElementById('inpWa');
    const inpThumbnail = document.getElementById('inpThumbnail');

    // INIT
    async function init() {
        await checkSession();
        fetchProducts();
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

    let toastTimeout;
    function showToast(message, type) {
        toast.textContent = message;
        toast.className = `show ${type}`;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.className = ''; }, 3000);
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    }

    // ==========================================
    // 2. FETCH & RENDER PRODUK
    // ==========================================
    async function fetchProducts() {
        try {
            const res = await fetch('/api/product');
            const json = await res.json();

            if (json.status && Array.isArray(json.data)) {
                renderTable(json.data);
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data</td></tr>`;
        }
    }

    function renderTable(products) {
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada produk.</td></tr>`;
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            
            // Format URL Gambar (hapus './' di awal string jika ada)
            let imgSrc = p.image ? p.image.replace('./', '/') : ''; 
            
            tr.innerHTML = `
                <td>
                    ${imgSrc ? `<img src="${imgSrc}" class="thumb-img" alt="${p.name}">` : `<div class="thumb-img" style="display:flex;align-items:center;justify-content:center;font-size:0.7rem;">No Img</div>`}
                </td>
                <td><strong>${p.name}</strong></td>
                <td>${formatRupiah(p.price)}</td>
                <td>${p.orderMethods ? p.orderMethods.map(m => m.toUpperCase()).join(', ') : '-'}</td>
                <td class="action-btns">
                    <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-delete" onclick="deleteProduct('${p.id}', '${p.name}')"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ==========================================
    // 3. HANDLE MODAL (ADD & EDIT)
    // ==========================================
    btnShowAddModal.addEventListener('click', () => {
        isEditMode = false;
        productForm.reset();
        inpId.value = '';
        modalTitle.innerText = "Tambah Produk Baru";
        
        // Kewajiban upload thumbnail
        inpThumbnail.required = true;
        reqThumbIndicator.style.display = 'inline';
        thumbHint.style.display = 'none';
        
        modalOverlay.style.display = 'flex';
    });

    btnCancelModal.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    // Buka Modal Edit (Dipanggil dari tombol edit di tabel)
    window.editProduct = async (id) => {
        isEditMode = true;
        modalTitle.innerText = "Edit Produk";
        productForm.reset();
        
        // Thumbnail tidak wajib saat edit
        inpThumbnail.required = false;
        reqThumbIndicator.style.display = 'none';
        thumbHint.style.display = 'block';

        try {
            const res = await fetch('/api/product/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await res.json();

            if (json.status && json.data) {
                const p = json.data;
                inpId.value = p.id;
                inpNama.value = p.name;
                inpHarga.value = p.price;
                inpDeskripsi.value = p.description;
                inpWa.value = p.adminWhatsapp;

                // Centang checkbox orderMethods
                const checkboxes = document.querySelectorAll('input[name="orderMethod"]');
                checkboxes.forEach(cb => {
                    if (p.orderMethods && p.orderMethods.includes(cb.value)) {
                        cb.checked = true;
                    }
                });

                modalOverlay.style.display = 'flex';
            } else {
                showToast("Data tidak ditemukan", "toast-error");
            }
        } catch (error) {
            showToast("Gagal mengambil detail produk", "toast-error");
        }
    };

    // ==========================================
    // 4. SUBMIT FORM (ADD / UPDATE)
    // ==========================================
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ambil checked checkboxes
        const checkedMethods = Array.from(document.querySelectorAll('input[name="orderMethod"]:checked')).map(cb => cb.value);
        if (checkedMethods.length === 0) {
            return showToast("Pilih minimal 1 metode transaksi", "toast-error");
        }

        const btnOriginalText = btnSaveProduct.innerText;
        btnSaveProduct.innerText = "Menyimpan...";
        btnSaveProduct.disabled = true;

        try {
            if (!isEditMode) {
                // --- PROSES TAMBAH PRODUK ---
                const formData = new FormData();
                formData.append("nama", inpNama.value);
                formData.append("harga", inpHarga.value);
                formData.append("deskripsi", inpDeskripsi.value);
                formData.append("adminWhatsapp", inpWa.value);
                formData.append("thumbnail", inpThumbnail.files[0]);
                checkedMethods.forEach(method => formData.append("orderMethods", method));

                const res = await fetch('/api/admin/product/add', { method: 'POST', body: formData });
                const json = await res.json();

                if (res.ok && json.status) {
                    showToast(json.message, "toast-success");
                    modalOverlay.style.display = 'none';
                    fetchProducts();
                } else {
                    showToast(json.message, "toast-error");
                }

            } else {
                // --- PROSES EDIT PRODUK ---
                // 1. Update Data Teks (API upload.none())
                const dataForm = new FormData();
                dataForm.append("id", inpId.value);
                dataForm.append("nama", inpNama.value);
                dataForm.append("harga", inpHarga.value);
                dataForm.append("deskripsi", inpDeskripsi.value);
                dataForm.append("adminWhatsapp", inpWa.value);
                checkedMethods.forEach(method => dataForm.append("orderMethods", method));

                const resData = await fetch('/api/admin/product/update/data', { method: 'POST', body: dataForm });
                const jsonData = await resData.json();

                if (!resData.ok || !jsonData.status) throw new Error(jsonData.message || "Gagal update data");

                // 2. Update Thumbnail JIKA ADA file yang diupload
                if (inpThumbnail.files.length > 0) {
                    const thumbForm = new FormData();
                    thumbForm.append("id", inpId.value);
                    thumbForm.append("thumbnail", inpThumbnail.files[0]);

                    const resThumb = await fetch('/api/admin/product/update/thumbnail', { method: 'POST', body: thumbForm });
                    const jsonThumb = await resThumb.json();
                    
                    if (!resThumb.ok || !jsonThumb.status) throw new Error(jsonThumb.message || "Gagal update thumbnail");
                }

                showToast("Produk berhasil diperbarui", "toast-success");
                modalOverlay.style.display = 'none';
                fetchProducts();
            }

        } catch (error) {
            showToast(error.message || "Terjadi kesalahan", "toast-error");
        } finally {
            btnSaveProduct.innerText = btnOriginalText;
            btnSaveProduct.disabled = false;
        }
    });

    // ==========================================
    // 5. DELETE PRODUK
    // ==========================================
    window.deleteProduct = async (id, name) => {
        if (!confirm(`Hapus produk "${name}" secara permanen?`)) return;

        try {
            const res = await fetch('/api/admin/product/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await res.json();

            if (res.ok && json.status) {
                showToast(json.message, "toast-success");
                fetchProducts(); // Refresh tabel
            } else {
                showToast(json.message, "toast-error");
            }
        } catch (error) {
            showToast("Gagal menghapus produk", "toast-error");
        }
    };

    init();
});