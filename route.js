const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const routes = express.Router();

const {
    startBot,
    stopBot,
    repairBot,
    deleteSession,
    getBotStatus
} = require("./bot");
const {
    createPayment,
    checkPayment,
    deletePayment,
    updateInvoiceAlias,
    getMutasi
} = require("./payment");

const ACCOUNT = path.join(__dirname, "database", "account.json");
const ORDER_DATABASE = path.join(__dirname, "database", "orderan.json");
const PRODUCT_DATABASE = path.join(__dirname, "database", "product.json");
const SESSION_DATABASE = path.join(__dirname, "database", "session.json");

const PRODUCT_IMAGE = path.join(
    __dirname,
    "database",
    "product"
);

if (!fs.existsSync(PRODUCT_IMAGE)) {
    fs.mkdirSync(PRODUCT_IMAGE, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./database/product");
    },

    filename: (req, file, cb) => {

        if (!req.body.nama) {
            return cb(new Error("Nama produk wajib diisi"), false);
        }

        const ext = path.extname(file.originalname).toLowerCase();

        const productName = req.body.nama
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9-_]/g, "");

        cb(null, `${productName}${ext}`);
    }
});


const fileFilter = (req, file, cb) => {
    const allowedExt = [
        ".jpg",
        ".jpeg",
        ".png"
    ];
    const allowedMime = [
        "image/jpeg",
        "image/png"
    ];
    const ext = path.extname(file.originalname)
        .toLowerCase();
    if (
        allowedExt.includes(ext) &&
        allowedMime.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Thumbnail hanya boleh JPG, JPEG, atau PNG"
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

function readSession() {
    try {
        return JSON.parse(
            fs.readFileSync(SESSION_DATABASE, "utf8")
        );
    } catch {
        return [];
    }
}

function writeSession(data) {
    fs.writeFileSync(
        SESSION_DATABASE,
        JSON.stringify(data, null, 4)
    );
}

function randomString(length = 32) {
    return crypto
        .randomBytes(length)
        .toString("hex");
}

function readAccount() {
    try {
        const data = fs.readFileSync(ACCOUNT, "utf8");
        return JSON.parse(data);
    }
    catch (err) {
        console.error("Error reading account.json:", err);
        return [];
    }
}

function writeAccount(data) {
    try {
        fs.writeFileSync(ACCOUNT, JSON.stringify(data, null, 4), "utf8");
    } catch (err) {
        console.error("Error writing to account.json:", err);
    }
}

function auth(req, res, next) {
    const token = req.cookies?.hydro_session;

    if (!token) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized"
        });
    }

    const accounts = readAccount();

    const account = accounts.find(v => v.token === token);

    if (!account) {
        return res.status(401).json({
            status: false,
            message: "Invalid session"
        });
    }

    req.account = account;
    next();
}

function readOrder() {
    try {
        const data = fs.readFileSync(ORDER_DATABASE, "utf8");
        return JSON.parse(data);
    }
    catch (err) {
        console.error("Error reading orderan.json:", err);
        return [];
    }
}

function writeOrder(data) {
    try {
        fs.writeFileSync(ORDER_DATABASE, JSON.stringify(data, null, 4), "utf8");
    } catch (err) {
        console.error("Error writing to orderan.json:", err);
    }
}

function readProduct() {
    try {
        const data = fs.readFileSync(PRODUCT_DATABASE, "utf8");
        return JSON.parse(data);
    }
    catch (err) {
        console.error("Error reading product.json:", err);
        return [];
    }
}

function writeProduct(data) {
    try {
        fs.writeFileSync(PRODUCT_DATABASE, JSON.stringify(data, null, 4), "utf8");
    } catch (err) {
        console.error("Error writing to product.json:", err);
    }
}

function normalizeFileName(text){
    return text
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9\-]/g, "");
}

const uploadThumbnailUpdate = multer({
    storage: multer.diskStorage({

        destination:(req,file,cb)=>{
            cb(null,"./database/product");
        },


        filename:(req,file,cb)=>{

            const id = req.body.id;


            if(!id){
                return cb(
                    new Error("ID product wajib diisi"),
                    false
                );
            }


            const products = readProduct();


            const product = products.find(
                p=>p.id === id
            );


            if(!product){
                return cb(
                    new Error("Product tidak ditemukan"),
                    false
                );
            }


            const ext = path.extname(
                file.originalname
            ).toLowerCase();


            const fileName =
                normalizeFileName(product.name)
                + ext;


            cb(null,fileName);

        }

    })
});

// PRODUCT ROUTES
routes.get("/api/product", (req, res) => {
    const products = readProduct();
    res.json({
        status: true,
        data: products
    });
});

routes.post("/api/admin/product/add", auth, upload.single("thumbnail"), (req, res) => {
    try {
        const {
            nama,
            harga,
            deskripsi,
            adminWhatsapp,
            orderMethods
        } = req.body;

        // Validasi data wajib
        if (
            !nama ||
            !harga ||
            !deskripsi ||
            !adminWhatsapp ||
            !orderMethods
        ) {
            return res.status(400).json({
                status: false,
                message: "Data tidak lengkap"
            });
        }

        // Validasi harga
        if (isNaN(harga) || Number(harga) <= 0) {
            return res.status(400).json({
                status: false,
                message: "Harga tidak valid"
            });
        }

        // Validasi nomor WhatsApp
        if (!/^62\d{8,15}$/.test(adminWhatsapp)) {
            return res.status(400).json({
                status: false,
                message: "Nomor WhatsApp admin tidak valid"
            });
        }

        // Validasi metode transaksi
        const methods = Array.isArray(orderMethods)
            ? orderMethods
            : [orderMethods];

        const validMethods = [
            "qris",
            "whatsapp"
        ];

        if (!methods.every(v => validMethods.includes(v))) {
            return res.status(400).json({
                status: false,
                message: "Metode transaksi tidak valid"
            });
        }

        const products = readProduct();

        // Normalisasi nama produk
        const normalize = text =>
            String(text)
                .trim()
                .replace(/\s+/g, " ")
                .toLowerCase();

        // Cek nama produk sudah ada
        const exists = products.some(
            product =>
                normalize(product.name) === normalize(nama)
        );

        if (exists) {
            return res.status(409).json({
                status: false,
                message: "Nama produk sudah digunakan"
            });
        }

        const id = crypto
            .randomBytes(8)
            .toString("hex");

        let image = null;

        if (req.file) {
            image = `./product/${req.file.filename}`;
        }

        const product = {
            id,
            name: nama.trim(),
            price: Number(harga),
            description: deskripsi.trim(),
            image,
            adminWhatsapp,
            orderMethods: methods
        };

        products.push(product);

        writeProduct(products);

        return res.json({
            status: true,
            message: "Product berhasil ditambahkan",
            data: product
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

routes.post("/api/admin/product/update/data", auth, upload.none(), (req, res) => {
        try {
            const {
                id,
                nama,
                harga,
                deskripsi,
                adminWhatsapp,
                orderMethods
            } = req.body;
            if (!id) {
                return res.status(400).json({
                    status: false,
                    message: "ID product wajib diisi"
                });
            }
            const products = readProduct();
            const index = products.findIndex(
                p => p.id === id
            );
            if (index === -1) {
                return res.status(404).json({
                    status: false,
                    message: "Product tidak ditemukan"
                });
            }
            const product = products[index];
            if (nama && nama.trim() !== product.name) {
                const normalize = nama
                    .trim()
                    .replace(/\s+/g, " ")
                    .toLowerCase();
                const exists = products.some(
                    p =>
                        p.id !== id &&
                        p.name
                            .trim()
                            .replace(/\s+/g, " ")
                            .toLowerCase() === normalize
                );
                if (exists) {
                    return res.status(409).json({
                        status: false,
                        message: "Nama produk sudah digunakan"
                    });
                }
                if (product.image) {
                    const oldPath = path.join(
                        __dirname,
                        "database",
                        product.image.replace("./", "")
                    );
                    if (fs.existsSync(oldPath)) {
                        const ext = path.extname(oldPath);
                        const newName =
                            normalizeFileName(nama) + ext;
                        const newPath = path.join(
                            __dirname,
                            "database",
                            "product",
                            newName
                        );
                        if (oldPath !== newPath) {
                            fs.renameSync(oldPath, newPath);
                        }
                        product.image = `./product/${newName}`;
                    }
                }
                product.name = nama;
            }
            if (harga !== undefined && harga !== "") {
                product.price = Number(harga);
            }
            if (deskripsi !== undefined) {
                product.description = deskripsi;
            }
            if (adminWhatsapp !== undefined) {
                product.adminWhatsapp = adminWhatsapp;
            }
            if (orderMethods !== undefined) {
                let methods;
                if (Array.isArray(orderMethods)) {
                    methods = orderMethods;
                } else {
                    methods = String(orderMethods)
                        .split(",")
                        .map(v => v.trim().toLowerCase())
                        .filter(Boolean);
                }
                const validMethods = [
                    "qris",
                    "whatsapp"
                ];
                if (!methods.every(v => validMethods.includes(v))) {
                    return res.status(400).json({
                        status: false,
                        message: "Order method tidak valid"
                    });
                }
                product.orderMethods = methods;
            }
            products[index] = product;
            writeProduct(products);
            return res.json({
                status: true,
                message: "Data product berhasil diperbarui",
                data: product
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: false,
                message: err.message
            });
        }
    }
);

routes.post("/api/admin/product/update/thumbnail", auth, uploadThumbnailUpdate.single("thumbnail"), (req, res) => {
        try {
            const { id } = req.body;
            if (!id) {
                return res.status(400).json({
                    status: false,
                    message: "ID product wajib diisi"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    status: false,
                    message: "Thumbnail wajib diupload"
                });
            }

            const products = readProduct();
            const index = products.findIndex(
                p => p.id === id
            );

            if (index === -1) {
                return res.status(404).json({
                    status: false,
                    message: "Product tidak ditemukan"
                });
            }

            const product = products[index];
            const newImage = `./product/${req.file.filename}`;

            // hapus thumbnail lama jika berbeda
            if (product.image && product.image !== newImage) {

                const oldPath = path.join(
                    __dirname,
                    "database",
                    product.image.replace("./", "")
                );
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            product.image = newImage;
            products[index] = product;
            writeProduct(products);

            return res.json({
                status: true,
                message: "Thumbnail berhasil diperbarui",
                data: product
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({
                status: false,
                message: err.message
            });
        }
    }
);

routes.post("/api/admin/product/delete", auth, (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "ID product wajib diisi"
            });
        }

        const products = readProduct();

        const index = products.findIndex(
            product => product.id === id
        );

        if (index === -1) {
            return res.status(404).json({
                status: false,
                message: "Product tidak ditemukan"
            });
        }

        const product = products[index];

        // Hapus thumbnail jika ada
        if (product.image) {

            const imagePath = path.join(
                __dirname,
                "database",
                product.image.replace("./", "")
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

        }

        // Hapus data produk
        products.splice(index, 1);

        writeProduct(products);

        return res.json({
            status: true,
            message: "Product berhasil dihapus",
            data: product
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            status: false,
            message: err.message
        });

    }
});

routes.get("/api/product/detail", (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({
                status: false,
                message: "ID product wajib diisi"
            });
        }
        const products = readProduct();
        const product = products.find(
            p => p.id === id
        );
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product tidak ditemukan"
            });
        }
        return res.json({
            status: true,
            data: product
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

// ORDER ROUTES
routes.get("/api/admin/order", auth, (req, res) => {
    const orders = readOrder();
    res.json({
        status: true,
        data: orders
    });
});

routes.post("/api/order/create", (req, res) => {
    try {

        const {
            productId,
            custName,
            orderType
        } = req.body;

        if (
            !productId ||
            !custName ||
            !orderType
        ) {
            return res.status(400).json({
                status: false,
                message: "Data tidak lengkap"
            });
        }

        const products = readProduct();

        const product = products.find(
            p => p.id === productId
        );

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product tidak ditemukan"
            });
        }

        const methods = product.orderMethods.map(v =>
            v.toLowerCase()
        );

        if (
            !methods.includes(
                orderType.toLowerCase()
            )
        ) {
            return res.status(400).json({
                status: false,
                message: "Metode transaksi tidak tersedia pada product ini"
            });
        }

        const cookie = req.cookies?.hydro_session;

        if (!cookie) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized"
            });
        }

        const sessions = readSession();

        const orderID = crypto
            .randomBytes(8)
            .toString("hex");

        const hyperToken = randomString(32);

        const createdAt = new Date();

        const expiredAt = new Date(
            createdAt.getTime() +
            10 * 60 * 1000
        );

        const sessionOrder = {
            orderID,
            productID: product.id,
            custName,
            orderType,
            status: "pending",
            hyperToken,
            hyperTokenCreateAt: createdAt.toISOString(),
            hyperTokenExpiredAt: expiredAt.toISOString()
        };

        const index = sessions.findIndex(obj =>
            Object.keys(obj)[0] === cookie
        );

        if (index !== -1) {

            sessions[index][cookie].push(
                sessionOrder
            );

        } else {

            sessions.push({
                [cookie]: [
                    sessionOrder
                ]
            });

        }

        writeSession(sessions);

        return res.json({
            status: true,
            message: "Order berhasil dibuat",
            data: {
                orderID,
                hyperToken,
                expiredAt: expiredAt.toISOString()
            }
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            status: false,
            message: err.message
        });

    }
});


// ADMIN AUTHENTICATION ROUTES
routes.post("/api/admin/account/login", (req, res) => {

    const { email, password } = req.body;

    const accounts = readAccount();

    const account = accounts.find(v =>
        v.email === email &&
        v.password === password
    );

    if (!account) {
        return res.status(401).json({
            status: false,
            message: "Invalid email or password"
        });
    }

    const token = crypto.randomBytes(48).toString("hex");

    account.token = token;

    writeAccount(accounts);

    res.cookie("hydro_session", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.json({
        status: true,
        message: "Login successful",
        data: {
            username: account.username,
            email: account.email,
            role: account.role
        }
    });

});

routes.post("/api/admin/account/logout", auth, (req, res) => {

    const accounts = readAccount();

    const account = accounts.find(v =>
        v.token === req.cookies.hydro_session
    );

    if (account) {
        delete account.token;
        writeAccount(accounts);
    }

    res.clearCookie("hydro_session");

    res.json({
        status: true,
        message: "Logout successful"
    });

});

routes.get("/api/admin/account/session", auth, (req, res) => {

    res.json({
        status: true,
        authenticated: true,
        data: {
            username: req.account.username,
            email: req.account.email,
            role: req.account.role
        }
    });

});

// BOT CONTROL ROUTES
routes.post("/api/admin/bot/start", auth, async (req, res) => {
    try {
        if (getBotStatus()) {
            return res.json({
                status: false,
                message: "Bot already running"
            });
        }
        await startBot();
        res.json({
            status: true,
            message: "Bot started"
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

routes.post("/api/admin/bot/repair", auth, async (req, res) => {
    try {
        await repairBot();
        res.json({
            status: true,
            message: "Bot repairing"
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

routes.post("/api/admin/bot/delete-session", auth, async (req, res) => {
    try {
        await deleteSession();
        res.json({
            status: true,
            message: "Session deleted"
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

routes.get("/api/admin/bot/status", auth, async (req, res) => {
    try {
        res.json({
            status: true,
            online: getBotStatus()
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});

module.exports = routes;