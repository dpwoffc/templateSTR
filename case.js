const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
    ownerNumber,
    botNumber
} = require("./database/credential");

const SESSION = path.join(__dirname, "database/session.json");
const ORDER = path.join(__dirname, "database/orderan.json");
const PRODUCT = path.join(__dirname, "database/product.json");

function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function read(file){
    if(!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
}

function write(file, data){
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
}

module.exports = async (sock, m) => {
    try {
        // --- TAMBAHKAN INI UNTUK DEBUGGING ---
        const cekPesan = m.message?.conversation || m.message?.extendedTextMessage?.text || m.body || "kosong";
        const cekSender = (m.key.participant || m.key.remoteJid).split("@")[0];

        const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text || m.body || "";
        const body = messageContent.trim();
        // ... lanjutan kode ...

        // 2. UPDATE: Abaikan pesan jika tidak memiliki awalan titik (.) atau kosong
        if (!body || !body.startsWith(".")) return;

        const args = body.split(/\s+/);

        const command = args[0]
            .replace(".", "")
            .toLowerCase();

        const sender = (
            m.key.participant ||
            m.key.remoteJid
        ).split("@")[0];

        // 3. Filter Hak Akses: Selain owner hanya boleh .verif
        if (
            sender !== ownerNumber &&
            command !== "verif"
        ) {
            return;
        }

        switch (command) {
            case "start": {
                const thumbnail = fs.readFileSync(
                    path.join(__dirname, "./database/assets/favicon.jpg")
                );
  
                await sock.sendMessage(m.key.remoteJid, {
                    text:`
╭━━━〔 🤖 LUFFY BOTZ 〕━━━╮ 
┃ 
┃ 📡 Status : Online 
┃ ⚡ Engine : Baileys 
┃ 🌐 Mode : Website Asisten 
┃ 
╰━━━━━━━━━━━━━━━━━━╯ 
> System made by @itcsneka 🚀`, 
                    contextInfo: {
                        quotedMessage: {
                            conversation: "⚓ Luffy Botz System"
                        },
                        participant: "0@s.whatsapp.net",
                        isForwarded: true,
                        forwardingScore: 999,
                        externalAdReply: {
                            title: "🤖 Luffy Botz",
                            body: "WhatsApp Automation System",
                            mediaType: 1,
                            thumbnail: thumbnail,
                            sourceUrl: "https://wa.me/6285786335575",
                            renderLargerThumbnail: true,
                            showAdAttribution: true
                        }
                    }
                });
                break;
            }

case "verif": {
                const token = args[1];

                if (!token) {
                    return await sock.sendMessage(m.key.remoteJid, { text: "❌ Format salah! Gunakan: *.verif <token>*" });
                }

                const sessions = read(SESSION);

                let sessionOwner = null;
                let order = null;
                let sessionKey = null;

                // UPDATE: Cara baca DB disesuaikan dengan struktur baru
                for (const account of sessions) {
                    for (const key in account) {
                        const orderArray = account[key];
                        // Pastikan isinya adalah Array dan ada isinya
                        if (Array.isArray(orderArray) && orderArray.length > 0) {
                            // Cek apakah hyperToken di dalam array cocok dengan input
                            if (orderArray[0].hyperToken === token) {
                                sessionOwner = account;
                                sessionKey = key; // Simpan key (bc940b23...) untuk dihapus nanti
                                order = orderArray[0];
                                break;
                            }
                        }
                    }
                    if (order) break; // Jika ketemu, hentikan pencarian
                }

                if (!order) {
                    return await sock.sendMessage(m.key.remoteJid, { text: "❌ Token verifikasi tidak ditemukan atau sudah digunakan!" });
                }

                if (order.hyperTokenExpiredAt && new Date(order.hyperTokenExpiredAt) <= new Date()) {
                    return await sock.sendMessage(m.key.remoteJid, { text: "❌ Token verifikasi sudah kadaluarsa!" });
                }

                const products = read(PRODUCT);
                const product = products.find(p => String(p.id) === String(order.productID));

                if (!product) {
                    return await sock.sendMessage(m.key.remoteJid, { text: `❌ Produk dengan ID (${order.productID}) tidak ditemukan di database!` });
                }

                const orders = read(ORDER);

                orders.push({
                    orderId: "DPW-" + token.substring(0, 8).toUpperCase(),
                    productId: order.productID,
                    price: product.price,
                    custName: order.custName,
                    orderType: order.orderType,
                    status: "proses",
                    orderDate: new Date().toISOString()
                });

                write(ORDER, orders);
                
                // Hapus data order dari object
                delete sessionOwner[sessionKey];

                // Bersihkan object yang sudah kosong {} dari dalam array
                const cleanedSessions = sessions.filter(account => Object.keys(account).length > 0);

                // Simpan array yang sudah bersih
                write(SESSION, cleanedSessions);

                await sock.sendMessage(m.key.remoteJid, {
                    text:
`✅ *ORDER TERVERIFIKASI*

ID : DPW-${token.substring(0, 8).toUpperCase()}
Produk : ${product.name}
Atas Nama : ${order.custName}

Silahkan lanjutkan ke pembayaran.`
                });

                await delay(2000);

                const qrisPath = path.join(__dirname, "database/assets/qris.jpg");
                
                if (fs.existsSync(qrisPath)) {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: fs.readFileSync(qrisPath),
                        caption:
`╭───〔 💸 PAYMENT INFO 〕───╮
📦 Metode Pembayaran:

📲 DANA / GOPAY
👤 Nama: dpwoffc/DPW
📞 Nomor: 085786335575

📲 Shopee Pay
👤 Nama: Dwi Putra Wibowo 
📞 Nomor: 901228687803

📦 Keterangan: Transfer langsung atau via QR

╰───〔 🧾 Terima kasih! 〕───╯
💬 Jika sudah transfer, segera konfirmasi ke admin 💼
🎁 Transaksi aman, cepat, dan terpercaya!`
                    });
                } else {
                    await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Berhasil diverifikasi, namun gambar QRIS tidak ditemukan di server." });
                }
                
                break;
            
            }
        }
    } catch (err) {
        console.error("Terjadi kesalahan pada sistem:", err);
    }
};