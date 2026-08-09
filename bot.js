const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const handler = require("./case");

const oldConsoleLog = console.log;
const oldConsoleError = console.error;
const oldConsoleWarn = console.warn;
const oldConsoleInfo = console.info;

const ignoredLogs = [
    "Closing session",
    "Closing open session",
    "Decrypted message with closed session",
    "Failed to decrypt message with any known session",
    "Session error",
    "Bad MAC",
    "Failed to decrypt message"
];

function shouldIgnore(args) {
    try {
        const text = args
            .map(v => {
                if (typeof v === "object") {
                    return JSON.stringify(v);
                }
                return String(v);
            })
            .join(" ");

        return ignoredLogs.some(x => text.includes(x));

    } catch {
        return false;
    }
}


console.log = (...args) => {
    if (!shouldIgnore(args)) {
        oldConsoleLog(...args);
    }
};

console.error = (...args) => {
    if (!shouldIgnore(args)) {
        oldConsoleError(...args);
    }
};

console.warn = (...args) => {
    if (!shouldIgnore(args)) {
        oldConsoleWarn(...args);
    }
};

console.info = (...args) => {
    if (!shouldIgnore(args)) {
        oldConsoleInfo(...args);
    }
};

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

let botSocket = null;
let starting = false;

async function startBot() {

  if (botSocket) {
    console.log("⚠️ Bot already running");
    return botSocket;
  }

  if(starting){
    console.log("⏳ Bot starting...");
    return;
  }

  starting = true;

  let reconnecting = false;
  let hasConnected = false;
  let pairingRequested = false;

  const credential = require("./database/credential");

  let phoneNumber = credential.botNumber;

  const SESSION_PATH = path.join(
    __dirname,
    "session"
  );

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ["Windows", "Chrome", "123.0.0.0"],
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    getMessage: async () => undefined
  });

  botSocket = sock;
  starting = false;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    try {
      if (connection === "connecting" && !state.creds.registered && !pairingRequested) {
        pairingRequested = true;

        setTimeout(async () => {
          try {
            const custom = "STRSITES";
            const code = await sock.requestPairingCode(phoneNumber, custom);

            console.log(
              "🔗 Pairing Code:",
              code?.match(/.{1,4}/g)?.join("-") || code
            );
            console.log("📱 Masukkan kode di WhatsApp > Perangkat tertaut");
          } catch (err) {
            console.error("❌ Pairing failed:", err.message);
            process.exit(1);
          }
        }, 3000);
      }

      if (connection === "open") {
          reconnecting = false;
          pairingRequested = false;

          if (state.creds.registered) {
              hasConnected = true;
              console.log(`✅ Bot connected successfully [${credential.botName}]`);
          } else {
              console.log("⌛ Menunggu konfirmasi pairing dari HP...");
          }
      }

      if (connection === "close") {
          const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

          console.log("Connection closed:", reason);

          botSocket = null;

          if (reason === DisconnectReason.loggedOut || reason === 401) {
              console.log(`[SESSION INVALID]`);

              if (fs.existsSync(SESSION_PATH)) {
                  fs.rmSync(SESSION_PATH, {
                      recursive: true,
                      force: true
                  });
              }

              return;
          }


          // khusus pairing restart
          if (reason === 515) {
              console.log("🔄 Restart socket after pairing...");

              setTimeout(() => {
                  startBot();
              }, 2000);

              return;
          }


          if (!reconnecting) {
              reconnecting = true;

              setTimeout(() => {
                  startBot();
              }, 3000);
          }
      }
    } catch (err) {
      console.error("EVENT ERROR:", err);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    try {
      if (type !== "notify") return;

      const m = messages?.[0];
      if (!m?.message) return;
      // skip history sync
      if (m.key?.id?.startsWith("BAE5") && !m.key.fromMe) return;

      // hanya proses pesan realtime
      if (m.messageTimestamp) {
          const now = Math.floor(Date.now() / 1000);

          if (now - Number(m.messageTimestamp) > 10) {
              return;
          }
      }

      // --- DEEP INTERCEPT CONVERT @LID TO PHONE JID ---
      let detectedPhoneJid = null;

      if (m.key?.remoteJidAlt?.endsWith("@s.whatsapp.net")) detectedPhoneJid = m.key.remoteJidAlt;
      if (!detectedPhoneJid && m.key?.participantAlt?.endsWith("@s.whatsapp.net")) detectedPhoneJid = m.key.participantAlt;
      if (!detectedPhoneJid && m.key?.senderPn) detectedPhoneJid = `${m.key.senderPn}@s.whatsapp.net`;
      if (!detectedPhoneJid && m.senderPn) detectedPhoneJid = `${m.senderPn}@s.whatsapp.net`;

      if (!detectedPhoneJid) {
        const rawString = JSON.stringify(m);
        const match = rawString.match(/(\d+)@s\.whatsapp\.net/);
        if (match) detectedPhoneJid = match[0];
      }

      if (detectedPhoneJid) {
        if (m.key?.remoteJid?.endsWith("@lid")) m.key.remoteJid = detectedPhoneJid;
        if (m.key?.participant?.endsWith("@lid")) m.key.participant = detectedPhoneJid;
        if (m.sender?.endsWith("@lid")) m.sender = detectedPhoneJid;
        if (m.chat?.endsWith("@lid")) m.chat = detectedPhoneJid;
        if (m.from?.endsWith("@lid")) m.from = detectedPhoneJid;
      }
      // --- PROSES SELESAI ---

      const jid = m.key?.remoteJid || "";
      const isNewsletter = jid.endsWith("@newsletter");

      if (jid === "status@broadcast") return;

      const msg =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

      m.body = msg;
      m.isNewsletter = isNewsletter;

      const sourceType = isNewsletter ? "Newsletter" : jid.endsWith("@g.us") ? "Group" : "Private";
      const detailId = jid ? ` (${jid})` : "";
      const pushName = m.pushName || "No Name";
      const sender = m.key?.remoteJid || "";
      const lid = (m.key?.remoteJid?.endsWith("@lid") || m.key?.participant?.endsWith("@lid"))
        ? m.key?.remoteJid?.split("@")[0] || "None"
        : "None";

      const rawCommand = msg.split(" ")[0] || "";
      const command = rawCommand.replace(/^\.*/, "");
      await handler(sock, m);

    } catch (err) {
      console.error("HANDLER ERROR:", err);
    }
  });

  return sock;
}

// Function to cleanly stop a running bot
async function stopBot(){

  if(!botSocket) return;

  try {
    botSocket.end({
      reason:"manual"
    });
  } catch(e){}

  botSocket = null;

  console.log("🛑 Bot stopped");
}

// Function to restart/repair the bot
async function repairBot(){

  console.log("🔧 Repairing bot...");

  await stopBot();

  setTimeout(()=>{
    startBot();
  },2000);

}

// Function to delete the session entirely
async function deleteSession(){

  await stopBot();

  const SESSION_PATH = path.join(
    __dirname,
    "session"
  );

  if(fs.existsSync(SESSION_PATH)){

    fs.rmSync(
      SESSION_PATH,
      {
        recursive:true,
        force:true
      }
    );

    console.log("🗑️ Session deleted");

  }
}

function getBotStatus(){
    return botSocket !== null;
}

module.exports = {
    startBot,
    stopBot,
    repairBot,
    deleteSession,
    getBotStatus
};
