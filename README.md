# templateSTR

Template starter untuk membangun sistem **website + REST API + WhatsApp automation** menggunakan Node.js.

Project ini menggabungkan **Express.js** sebagai backend, **Baileys** untuk koneksi WhatsApp, penyimpanan berbasis file JSON, sistem session/order, product management, serta integrasi payment gateway.

> **Status:** Development Template
> **Author:** [@dpwoffc](https://github.com/dpwoffc)

---

## ✨ Features

### 🌐 Web Server

* Express.js
* Static file serving
* JSON & URL-encoded request parser
* Cookie-based session
* REST API
* Custom 404 JSON response
* Environment-based port configuration

Default server:

```text
http://localhost:1000
```

Server menggunakan `PORT` dari environment jika tersedia, atau port `1000` sebagai default.

---

### 🤖 WhatsApp Bot

WhatsApp automation menggunakan:

* `@whiskeysockets/baileys`
* Multi-file authentication
* Pairing Code
* Automatic reconnect
* Bot start/stop
* Bot repair/restart
* Session deletion
* Message handler system
* Command-based interaction

Bot menggunakan folder:

```text
session/
```

untuk menyimpan credential WhatsApp.

---

### 📦 Product Management

Sistem product menyediakan:

* Menambahkan produk
* Mengubah data produk
* Mengubah thumbnail
* Menghapus produk
* Melihat seluruh produk
* Melihat detail produk
* Validasi harga
* Validasi nomor WhatsApp
* Validasi metode transaksi
* Pencegahan duplicate product name

Thumbnail mendukung:

```text
JPG
JPEG
PNG
```

dengan batas ukuran upload maksimal **5 MB**.

---

### 🛒 Order System

Project memiliki sistem order berbasis JSON yang menangani:

* Guest order session
* Product selection
* Customer name
* Order type
* Order status
* Order verification
* Order cancellation
* Order completion
* Pending orders
* Order notification melalui WhatsApp

Order disimpan pada:

```text
database/orderan.json
```

---

### 🔐 Authentication

Admin authentication menggunakan HTTP cookie.

Cookie session:

```text
hydro_session
```

Request yang membutuhkan authentication akan ditolak jika cookie tidak tersedia atau token tidak ditemukan pada database account.

---

### ⏱️ HyperToken Scheduler

Project memiliki scheduler yang berjalan otomatis setiap **10 detik**.

Scheduler digunakan untuk mendeteksi `hyperToken` yang sudah expired.

Ketika token expired:

1. Session dihapus.
2. Order dibuat dengan status `canceled`.
3. Data session diperbarui.
4. Data order diperbarui.

Scheduler dijalankan ketika server pertama kali start dan kemudian setiap 10 detik.

---

### 💳 Payment Integration

Tersedia wrapper untuk payment API yang menangani:

* Create payment
* Check payment
* Delete payment
* Update invoice alias
* Get transaction mutation

Implementasi payment menggunakan Axios dan credential API dari:

```text
database/credential.js
```

---

## 📁 Project Structure

```text
templateSTR/
│
├── database/
│   ├── assets/
│   ├── product/
│   ├── account.json
│   ├── orderan.json
│   ├── product.json
│   ├── session.json
│   └── credential.js
│
├── public/
│   └── ...
│
├── session/
│   └── WhatsApp authentication files
│
├── bot.js
├── case.js
├── index.js
├── payment.js
├── route.js
├── scheduler.js
│
├── nodemon.json
├── package.json
├── package-lock.json
└── README.md
```

---

## 🧩 Architecture

Secara sederhana, alur project:

```text
                    ┌─────────────────┐
                    │     Browser     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Express.js   │
                    │      index.js   │
                    └────────┬────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
       ┌───────────┐   ┌───────────┐   ┌───────────┐
       │ Products  │   │   Orders  │   │  Account  │
       │   JSON    │   │   JSON    │   │   JSON    │
       └───────────┘   └───────────┘   └───────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ WhatsApp Bot    │
                    │    Baileys      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ WhatsApp User   │
                    └─────────────────┘
```

---

## ⚙️ Requirements

Pastikan environment sudah memiliki:

* Node.js
* npm
* WhatsApp account untuk bot
* API key payment gateway jika fitur payment digunakan

Cek versi Node.js:

```bash
node -v
```

Cek npm:

```bash
npm -v
```

## 📥 Installation

### 📱 Termux — Fresh Setup

Jika menggunakan **Termux** dan belum pernah melakukan setup sebelumnya, jalankan perintah berikut dari awal.

#### 1. Update package Termux

```bash
pkg update -y && pkg upgrade -y
```

#### 2. Install dependencies dasar

```bash
pkg install -y git nodejs-lts
```

Cek instalasi:

```bash
node -v
npm -v
git --version
```

Jika ketiganya menampilkan versi, berarti environment sudah siap.

#### 3. Clone repository

```bash
git clone https://github.com/dpwoffc/templateSTR.git
```

Masuk ke directory:

```bash
cd templateSTR
```

#### 4. Install Node.js dependencies

```bash
npm install
```

#### 5. Configure credential

Buka file:

```bash
nano database/credential.js
```

Sesuaikan konfigurasi seperti nomor WhatsApp bot, owner, dan credential payment jika digunakan.

#### 6. Jalankan server

```bash
npm start
```

---

### 🔄 Jika Sebelumnya Pernah Clone Repository

Jika repository `templateSTR` sebelumnya sudah pernah di-clone, **disarankan menghapus directory lama terlebih dahulu** agar tidak terjadi konflik atau menggunakan source code versi lama.

Keluar dari directory repository jika sedang berada di dalamnya:

```bash
cd ..
```

Hapus repository lama:

```bash
rm -rf templateSTR
```

Clone ulang repository:

```bash
git clone https://github.com/dpwoffc/templateSTR.git
```

Masuk ke repository:

```bash
cd templateSTR
```

Install ulang dependencies:

```bash
npm install
```

Kemudian jalankan:

```bash
npm start
```

> **⚠️ Important:** Pastikan kamu tidak memiliki perubahan penting di directory repository lama sebelum menjalankan `rm -rf templateSTR`, karena seluruh file di directory tersebut akan dihapus.

---

### 🖥️ Linux / Ubuntu / Debian

Install Git dan Node.js terlebih dahulu:

```bash
sudo apt update
sudo apt install -y git nodejs npm
```

Cek versi:

```bash
node -v
npm -v
git --version
```

Clone repository:

```bash
git clone https://github.com/dpwoffc/templateSTR.git
cd templateSTR
```

Install dependencies:

```bash
npm install
```

Jalankan:

```bash
npm start
```

---

### 🪟 Windows

Pastikan sudah terinstall:

* Git
* Node.js LTS
* npm

Kemudian buka **PowerShell** atau **Command Prompt**:

```powershell
git clone https://github.com/dpwoffc/templateSTR.git
cd templateSTR
npm install
npm start
```

---

## 🔄 Updating an Existing Installation

Jika ingin mengambil versi terbaru dari repository dan tidak memiliki perubahan lokal yang perlu dipertahankan, cara paling bersih adalah menghapus repository lama lalu clone ulang:

```bash
cd ..
rm -rf templateSTR
git clone https://github.com/dpwoffc/templateSTR.git
cd templateSTR
npm install
npm start
```

Untuk Termux/Linux, perintah di atas dapat langsung digunakan.

> **⚠️ Backup terlebih dahulu** file konfigurasi, database JSON, credential, dan folder `session/` jika masih ingin mempertahankannya sebelum menghapus directory lama.


---

## 🔑 Configuration

Buat atau sesuaikan:

```text
database/credential.js
```

Contoh struktur:

```js
module.exports = {
    botNumber: "628xxxxxxxxxx",
    botName: "My Bot",
    ownerNumber: "628xxxxxxxxxx",
    payment_gateaway: "YOUR_API_KEY"
};
```

### Configuration

| Property           | Description                       |
| ------------------ | --------------------------------- |
| `botNumber`        | Nomor WhatsApp yang digunakan bot |
| `botName`          | Nama bot                          |
| `ownerNumber`      | Nomor owner                       |
| `payment_gateaway` | API key payment gateway           |

> Jangan commit credential/API key asli ke repository public.

---

## ▶️ Running

Development mode:

```bash
npm start
```

Script `npm start` menjalankan Nodemon terhadap `index.js`.

Jika berhasil:

```text
╔══════════════════════════════════════╗
║          HYDRO SERVER ONLINE         ║
╠══════════════════════════════════════╣
║ 🌐 Express : http://localhost:1000
║ 🍪 Cookie Parser : Enabled
║ ⚡ Status : Online
╚══════════════════════════════════════╝
```

---

# 🤖 WhatsApp Bot

Bot menggunakan sistem **Pairing Code**, sehingga tidak membutuhkan QR code pada terminal.

Saat credential WhatsApp belum terdaftar, bot akan meminta pairing code menggunakan nomor yang terdapat pada `credential.js`.

Setelah pairing berhasil, session akan tersimpan pada:

```text
session/
```

Jangan menghapus folder tersebut jika ingin mempertahankan koneksi WhatsApp.

---

## 📋 Bot Commands

Command menggunakan prefix:

```text
.
```

Contoh:

```text
.start
.listorder
.done <order_id>
.cancel <order_id>
.verif <token>
```

Command tertentu dibatasi untuk owner, sementara `.verif` dapat digunakan untuk proses verifikasi order.

### `.start`

Menampilkan informasi bot dan daftar command.

### `.listorder`

Menampilkan order yang sedang memiliki status:

```text
proses
```

### `.done`

Menandai order sebagai selesai.

```text
.done DPW-XXXXXXXX
```

### `.cancel`

Membatalkan order.

```text
.cancel DPW-XXXXXXXX
```

### `.verif`

Memverifikasi token order yang berasal dari website.

```text
.verif <token>
```

Setelah berhasil diverifikasi, order dimasukkan ke `orderan.json` dan owner mendapatkan notifikasi melalui WhatsApp.

---

# 🌐 API

Base URL:

```text
http://localhost:1000
```

## Products

### Get Products

```http
GET /api/product
```

Response:

```json
{
    "status": true,
    "data": []
}
```

### Product Detail

```http
POST /api/product/detail
```

Body:

```json
{
    "id": "PRODUCT_ID"
}
```

---

## Admin Product

### Add Product

```http
POST /api/admin/product/add
```

Authentication:

```text
hydro_session
```

Content-Type:

```text
multipart/form-data
```

Fields:

```text
nama
harga
deskripsi
adminWhatsapp
orderMethods
thumbnail
```

Metode transaksi yang tersedia:

```text
qris
whatsapp
```

---

### Update Product

```http
POST /api/admin/product/update/data
```

---

### Update Thumbnail

```http
POST /api/admin/product/update/thumbnail
```

Field:

```text
id
thumbnail
```

---

### Delete Product

```http
POST /api/admin/product/delete
```

Body:

```json
{
    "id": "PRODUCT_ID"
}
```

---

# 🛒 Order API

### Create Order

```http
POST /api/order/create
```

Body:

```json
{
    "productId": "PRODUCT_ID",
    "custName": "Customer",
    "orderType": "whatsapp"
}
```

`orderType` harus sesuai dengan metode transaksi yang tersedia pada product.

---

### Admin Order

```http
GET /api/admin/order
```

Endpoint ini membutuhkan authentication.

Response berisi:

```text
orders
pending
```

---

# 💳 Payment

Payment module menyediakan fungsi:

```js
createPayment(amount)
checkPayment(idtrx)
deletePayment(idtrx)
updateInvoiceAlias(password, invoice)
getMutasi(limit)
```

Module tersebut menggunakan API payment eksternal melalui Axios.

---

# 🗃️ Database

Project menggunakan file JSON sebagai storage sederhana.

### `account.json`

Menyimpan account/session authentication.

### `product.json`

Menyimpan data produk.

Contoh:

```json
{
    "id": "abc123",
    "name": "Example Product",
    "price": 10000,
    "description": "Example description",
    "image": "./product/example.png",
    "adminWhatsapp": "628xxxxxxxxxx",
    "orderMethods": [
        "whatsapp"
    ]
}
```

### `orderan.json`

Menyimpan order yang sudah diproses, selesai, atau dibatalkan.

### `session.json`

Menyimpan temporary order session dan `hyperToken`.

---

# 🔄 Order Flow

Secara umum proses order:

```text
Customer
   │
   ▼
Select Product
   │
   ▼
Create Order
   │
   ▼
Temporary Session
   │
   ▼
HyperToken
   │
   ├───────────────┐
   │               │
   ▼               ▼
Verified        Expired
   │               │
   ▼               ▼
Active Order    Canceled
   │
   ▼
WhatsApp Notification
   │
   ▼
Payment
   │
   ▼
Processing
   │
   ├───────┐
   ▼       ▼
 Done    Cancel
```

---

# 🛠️ Development

Untuk mengembangkan project:

```bash
npm start
```

Nodemon digunakan agar server melakukan restart otomatis ketika source code berubah.

File utama:

| File                     | Fungsi                   |
| ------------------------ | ------------------------ |
| `index.js`               | Entry point Express      |
| `route.js`               | REST API & routing       |
| `bot.js`                 | WhatsApp connection      |
| `case.js`                | WhatsApp command handler |
| `payment.js`             | Payment API wrapper      |
| `scheduler.js`           | Expired token scheduler  |
| `database/credential.js` | Configuration            |

---

# ⚠️ Important Notes

Project ini menggunakan **JSON file sebagai database**, sehingga lebih cocok untuk:

* Prototype
* Personal project
* Small-scale service
* Development
* Template/starter project

Untuk deployment dengan traffic tinggi, disarankan mengganti JSON storage dengan database seperti:

```text
SQLite
PostgreSQL
MySQL
MongoDB
```

Selain itu, credential WhatsApp dan payment API key sebaiknya tidak disimpan langsung dalam repository public.

---

# 🔒 Security

Sebelum production, pertimbangkan:

* Environment variables untuk secret/API key
* Secure cookie configuration
* CSRF protection
* Rate limiting
* Input validation yang lebih ketat
* Access control untuk endpoint admin
* File upload hardening
* Database transaction/locking
* Proper logging
* HTTPS
* Backup database
* Secret rotation

---

# 📄 License

Project menggunakan license:

```text
ISC
```

Lihat `package.json` untuk informasi package metadata dan dependency.

---

## 👤 Author

**dpwoffc**

GitHub:

https://github.com/dpwoffc

Repository:

https://github.com/dpwoffc/templateSTR

---

## ⭐ Support

Jika template ini membantu project kamu, kamu bisa memberikan ⭐ pada repository.

**templateSTR — Simple Website + WhatsApp Automation Template**
