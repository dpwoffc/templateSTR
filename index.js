const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const routes = require("./route");
const settings = require("./database/credential");

const app = express();
const PORT = process.env.PORT || 1000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.use(
    "/product",
    express.static(
        path.join(__dirname, "database", "product")
    )
);

app.use(
    "/assets",
    express.static(
        path.join(__dirname, "database", "assets")
    )
);

app.use("/", routes);

app.use((req, res) => {
    res.status(404).json({
        status: false,
        message: "Endpoint Not Found"
    });
});

const {
    checkExpiredHyperToken
} = require("./scheduler");

// Jalankan sekali saat server start
checkExpiredHyperToken();

// Lalu jalankan setiap 10 detik
setInterval(checkExpiredHyperToken, 10000);

app.listen(PORT, () => {
    console.clear();
    console.log(`
╔══════════════════════════════════════╗
║          HYDRO SERVER ONLINE         ║
╠══════════════════════════════════════╣
║ 🌐 Express : http://localhost:${PORT}
║ 🍪 Cookie Parser : Enabled
║ ⚡ Status : Online
╚══════════════════════════════════════╝
`);
});

process.on("beforeExit", (code) => {
    console.log("BEFORE EXIT:", code);
});

process.on("exit", (code) => {
    console.log("EXIT:", code);
});

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT:", err);
});

process.on("unhandledRejection", (err) => {
    console.error("REJECTION:", err);
});