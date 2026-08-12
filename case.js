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
╭━━━〔 🤖 *LUFFY BOTZ* 〕━━━╮ 
┃ 
┃ 📡 Status : *Online* 🟢 
┃ ⚡ Engine : *Baileys* ⚙️ 
┃ 🌐 Mode : *Website Asisten* 💻 
┃ 
╰━━━━━━━━━━━━━━━━━━╯ 

📋 *DAFTAR MENU COMMAND* 📋
──────────────────
🔸 *.listorder*
   _Melihat daftar pesanan yang sedang diproses_

🔸 *.done <ID Order>*
   _Menandai pesanan telah selesai & info ke user_

🔸 *.cancel <ID Order>*
   _Membatalkan pesanan yang ada di database_

🔸 *.verif <Token>*
   _Verifikasi pesanan baru dari website_
──────────────────

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

case "listorder": {
    const orders = read(ORDER);
    const pending = orders.filter(
        v => v.status === "proses"
    );

    if (pending.length === 0) {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "📭 *KOSONG*\nSaat ini tidak ada order yang sedang diproses."
            }
        );
    }

    let text = "📦 *DAFTAR ORDER AKTIF* 📦\n──────────────────\n\n";
    pending.forEach((v, i) => {
        text +=
`*#${i + 1}*
🆔 *ID Order* : ${v.orderId}
👤 *Customer* : ${v.custName}
📦 *Produk*   : ${v.productId}
💰 *Harga*    : Rp ${Number(v.price).toLocaleString("id-ID")}
🛒 *Tipe*     : ${v.orderType}
📌 *Status*   : _${v.status}_
──────────────────\n`;
    });
    await sock.sendMessage(
        m.key.remoteJid,
        { text }
    );
}
break;

case "cancel": {
    const id = args[1];
    if (!id) {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "⚠️ *Format Salah!*\n\nContoh penggunaan:\n*.cancel DPW-XXXXXXXX*"
            }
        );
    }

    const orders = read(ORDER);
    const index = orders.findIndex(
        v => v.orderId.toUpperCase() === id.toUpperCase()
    );

    if (index === -1) {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "❌ *Gagal!* Order tidak ditemukan. Silakan cek kembali ID Order Anda."
            }
        );
    }

    if (orders[index].status === "cancel") {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "⚠️ *Peringatan!* Order ini sudah dibatalkan sebelumnya."
            }
        );
    }
    orders[index].status = "cancel";
    orders[index].cancelDate = new Date().toISOString();
    write(ORDER, orders);
    await sock.sendMessage(
        m.key.remoteJid,
        {
            text:
`✅ *ORDER DIBATALKAN*
──────────────────
🆔 *ID Order* : ${orders[index].orderId}

Pesanan ini telah sukses dibatalkan oleh sistem. 🚫`
        }
    );
}
break;

case "done": {
    const id = args[1];

    if (!id) {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "⚠️ *Format Salah!*\n\nContoh penggunaan:\n*.done DPW-XXXXXXXX*"
            }
        );
    }

    const orders = read(ORDER);

    const index = orders.findIndex(
        v => v.orderId.toUpperCase() === id.toUpperCase()
    );

    if (index === -1) {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "❌ *Gagal!* Order tidak ditemukan. Silakan cek kembali ID Order Anda."
            }
        );
    }

    const order = orders[index];

    if (order.status === "done") {
        return await sock.sendMessage(
            m.key.remoteJid,
            {
                text: "⚠️ *Peringatan!* Order ini sudah diselesaikan sebelumnya."
            }
        );
    }

    order.status = "done";
    order.doneDate = new Date().toISOString();

    write(ORDER, orders);

    // Kirim ke customer jika nomor tersedia
    if (order.customerWhatsapp) {
        try {
            await sock.sendMessage(
                `${order.customerWhatsapp}@s.whatsapp.net`,
                {
                    text:
`🎉 *ORDER SELESAI* 🎉
──────────────────
Halo *${order.custName}*,

Terima kasih telah mempercayai layanan kami! 💖

🆔 *ID Order* : ${order.orderId}
📦 Pesanan Anda telah selesai diproses oleh admin.

Semoga Anda puas dengan pelayanan kami.
Sampai jumpa di transaksi berikutnya! 🙏✨`
                }
            );
        } catch (err) {
            console.log("Gagal mengirim pesan ke customer:", err.message);
        }
    }

    await sock.sendMessage(
        m.key.remoteJid,
        {
            text:
`✅ *ORDER DISELESAIKAN*
──────────────────
🆔 *ID Order* : ${order.orderId}

Sistem telah menandai pesanan ini sebagai Selesai. 🎯`
        }
    );
}
break;
/*
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
                    customerWhatsapp: sender,
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

                try {
    await sock.sendMessage(
        `${ownerNumber}@s.whatsapp.net`,
        {
            text:
`🔔 *PESANAN BARU*

Ada pesanan baru yang telah berhasil diverifikasi.

🆔 ID Order: DPW-${token.substring(0, 8).toUpperCase()}
👤 Customer: ${order.custName}
📦 Produk: ${product.name}
💰 Total: Rp ${product.price.toLocaleString("id-ID")}
🛒 Metode: ${order.orderType}
📌 Status: PROSES

Gunakan *.listorder* untuk melihat seluruh pesanan.`
        }
    );

} catch (err) {
    console.log("Gagal mengirim notifikasi ke owner:", err.message);
}

                await sock.sendMessage(m.key.remoteJid, {
                    text:
`✅ *ORDER TERVERIFIKASI*

ID : DPW-${token.substring(0, 8).toUpperCase()}
Produk : ${product.name}
Atas Nama : ${order.custName}
total harga : Rp ${product.price.toLocaleString("id-ID")}

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
*/
case "verif": {
    const token = args[1];

    if (!token) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: "❌ Format salah! Gunakan: *.verif <token>*"
        });
    }

    const sessions = read(SESSION);

    let sessionOwner = null;
    let order = null;
    let sessionKey = null;

    // Cari token pada session.json
    for (const account of sessions) {
        for (const key in account) {
            const orderArray = account[key];

            if (Array.isArray(orderArray) && orderArray.length > 0) {
                if (orderArray[0].hyperToken === token) {
                    sessionOwner = account;
                    sessionKey = key;
                    order = orderArray[0];
                    break;
                }
            }
        }

        if (order) break;
    }

    if (!order) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: "❌ Token verifikasi tidak ditemukan atau sudah digunakan!"
        });
    }

    if (
        order.hyperTokenExpiredAt &&
        new Date(order.hyperTokenExpiredAt) <= new Date()
    ) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: "❌ Token verifikasi sudah kadaluarsa!"
        });
    }

    const products = read(PRODUCT);

    const product = products.find(
        p => String(p.id) === String(order.productID)
    );

    if (!product) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: `❌ Produk dengan ID (${order.productID}) tidak ditemukan di database!`
        });
    }

    const orders = read(ORDER);

    orders.push({
        orderId: "DPW-" + token.substring(0, 8).toUpperCase(),
        productId: order.productID,
        price: product.price,
        custName: order.custName,
        orderType: order.orderType,
        customerWhatsapp: sender,
        status: "proses",
        orderDate: new Date().toISOString()
    });

    write(ORDER, orders);

    // Hapus session yang sudah digunakan
    delete sessionOwner[sessionKey];

    const cleanedSessions = sessions.filter(
        account => Object.keys(account).length > 0
    );

    write(SESSION, cleanedSessions);
                try {
    await sock.sendMessage(
        `${ownerNumber}@s.whatsapp.net`,
        {
            text:
`🔔 *PESANAN BARU*

Ada pesanan baru yang telah berhasil diverifikasi.

🆔 ID Order: DPW-${token.substring(0, 8).toUpperCase()}
👤 Customer: ${order.custName}
📦 Produk: ${product.name}
💰 Total: Rp ${product.price.toLocaleString("id-ID")}
🛒 Metode: ${order.orderType}
📌 Status: PROSES

Gunakan *.listorder* untuk melihat seluruh pesanan.`
        }
    );

} catch (err) {
    console.log("Gagal mengirim notifikasi ke owner:", err.message);
}
    // Pesan pertama
    await sock.sendMessage(m.key.remoteJid, {
        text:
`✅ *ORDER TERVERIFIKASI*

ID : DPW-${token.substring(0, 8).toUpperCase()}
Produk : ${product.name}
Atas Nama : ${order.custName}
Total Harga : Rp ${product.price.toLocaleString("id-ID")}

Silakan lanjutkan ke pembayaran.`
    });

    await delay(2000);

    // Pesan kedua (Tanpa QRIS)
    await sock.sendMessage(m.key.remoteJid, {
        text:
`╭───〔 💸 PAYMENT INFO 〕───╮

Silakan lakukan pembayaran melalui
salah satu metode berikut.

📲 DANA / GOPAY
👤 Nama : dpwoffc / DPW
📞 Nomor : 085786335575

📲 ShopeePay
👤 Nama : Dwi Putra Wibowo
📞 Nomor : 901228687803

╰───〔 🧾 TERIMA KASIH 〕───╯

📸 Setelah pembayaran berhasil,
silakan kirim bukti transfer kepada admin.

⏳ Pesanan akan diproses setelah
pembayaran berhasil diverifikasi.`
    });

    break;
}

        }
    } catch (err) {
        console.error("Terjadi kesalahan pada sistem:", err);
    }
};