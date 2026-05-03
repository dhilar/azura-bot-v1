const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const qrcode = require("qrcode-terminal")
const fs = require("fs")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,

    // 🔥 FIX WAJIB (BIAR QR GAK NGACO)
    browser: ["Windows", "Chrome", "120.0.0"],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  // save session
  sock.ev.on("creds.update", saveCreds)

  // =====================
  // CONNECTION HANDLER (FIX UTAMA)
  // =====================
  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      console.log("📱 Scan QR:")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "open") {
      console.log("✅ Bot connect")
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode

      console.log("❌ Disconnect:", reason)

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...")
        setTimeout(startBot, 3000)
      } else {
        console.log("⚠️ Session logout, hapus session dan scan ulang")
      }
    }
  })

  // =====================
  // MESSAGE HANDLER
  // =====================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text

    if (!text) return

    const cleanText = text.toLowerCase().trim()

    // GROUP SECURITY
    if (msg.key.remoteJid && msg.key.remoteJid.endsWith("@g.us")) {
      await require("./commands/groupHandler")(sock, msg)
    }

    // OWNER COMMAND
    if (cleanText.startsWith("#") || cleanText.startsWith(".")) {
      return require("./commands/owner")(sock, msg, cleanText)
    }

    // CHAT FLOW
    return require("./commands/chatFlow")(sock, msg, cleanText)
  })

  // =====================
  // WELCOME / GOODBYE
  // =====================
  sock.ev.on("group-participants.update", async (data) => {
    let settings = {}

    try {
      settings = JSON.parse(
        fs.readFileSync("./database/groupSettings.json")
      )
    } catch {
      settings = {
        welcome: true,
        goodbye: true,
        welcomeText: "👋 Welcome @user",
        goodbyeText: "👋 Goodbye @user"
      }
    }

    const jid = data.id
    const user = data.participants[0]

    const userJid = typeof user === "string" ? user : user.id || user
    const number = userJid.split("@")[0]

    if (data.action === "add" && settings.welcome) {
      const text = settings.welcomeText.replace("@user", `@${number}`)

      await sock.sendMessage(jid, {
        text,
        mentions: [userJid]
      })
    }

    if (data.action === "remove" && settings.goodbye) {
      const text = settings.goodbyeText.replace("@user", `@${number}`)

      await sock.sendMessage(jid, {
        text,
        mentions: [userJid]
      })
    }
  })
}

// =====================
// AUTO CLEAN DATABASE
// =====================
setInterval(() => {
  try {
    let orders = JSON.parse(
      fs.readFileSync("./database/orders.json")
    )

    const now = Date.now()

    // hapus order lebih dari 2 hari
    orders = orders.filter(
      (o) => now - o.createdAt < 2 * 24 * 60 * 60 * 1000
    )

    fs.writeFileSync(
      "./database/orders.json",
      JSON.stringify(orders, null, 2)
    )

    console.log("🧹 Auto clean orders")
  } catch (err) {
    console.log("⚠️ Clean error:", err.message)
  }
}, 6 * 60 * 60 * 1000)

startBot()