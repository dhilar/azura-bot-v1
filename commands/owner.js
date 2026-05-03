const fs = require("fs")
const config = require("../config")

module.exports = async (sock, msg, text) => {
  const jid = msg.key.remoteJid
  const isGroup = jid.endsWith("@g.us")

  const sender = isGroup
    ? msg.key.participant
    : msg.key.remoteJid

  if (!config.owners.includes(sender)) {
    return sock.sendMessage(jid, { text: "❌ Lu bukan owner" })
  }

  // 🔥 PARSE COMMAND
  const args = text.split(" ")
  const command = args.shift()

  let products = JSON.parse(fs.readFileSync("./database/products.json"))
  let orders = JSON.parse(fs.readFileSync("./database/orders.json"))
  let groupSettings = JSON.parse(fs.readFileSync("./database/groupSettings.json"))

  // ======================
  // CRUD PRODUK
  // ======================

  if (command === ".addproduk") {
    const nama = args[0]

    if (!nama) return sock.sendMessage(jid, { text: "Format: .addproduk nama" })

    products.push({
      nama,
      alias: [nama],
      snk: "-",
      varian: []
    })

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: `✅ Produk ${nama} ditambahkan` })
  }

  if (command === ".addalias") {
    const nama = args[0]
    const alias = args[1]

    const p = products.find(x => x.nama === nama)
    if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

    p.alias.push(alias)

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: "✅ Alias ditambahkan" })
  }
// ======================
// DELETE ALIAS
// ======================

if (command === ".delalias") {
  const nama = args[0]
  const alias = args[1]

  if (!nama || !alias) {
    return sock.sendMessage(jid, {
      text: "Format: .delalias produk alias"
    })
  }

  const p = products.find(x => x.nama === nama)

  if (!p) {
    return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })
  }

  // ❌ jangan hapus alias utama
  if (alias === p.nama) {
    return sock.sendMessage(jid, {
      text: "❌ Tidak bisa hapus alias utama"
    })
  }

  p.alias = p.alias.filter(a => a !== alias)

  fs.writeFileSync(
    "./database/products.json",
    JSON.stringify(products, null, 2)
  )

  return sock.sendMessage(jid, {
    text: `✅ Alias ${alias} dihapus`
  })
}

  if (command === ".addvar") {
    const nama = args[0]
    const varian = args[1]
    const harga = Number(args[2])
    const deskripsi = args.slice(3).join(" ")

    const p = products.find(x => x.nama === nama)
    if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

    p.varian.push({
      nama: varian,
      harga,
      deskripsi: deskripsi || "-"
    })

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: "✅ Varian ditambahkan" })
  }

  if (command === ".setsnk") {
    const nama = args[0]
    const snk = args.slice(1).join(" ")

    const p = products.find(x => x.nama === nama)
    if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

    p.snk = snk

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: "✅ S&K diupdate" })
  }

  if (command === ".delvar") {
    const nama = args[0]
    const varian = args[1]

    const p = products.find(x => x.nama === nama)
    if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

    p.varian = p.varian.filter(v => v.nama !== varian)

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: "✅ Varian dihapus" })
  }

  if (command === ".delproduk") {
    const nama = args[0]

    products = products.filter(p => p.nama !== nama)

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, { text: "✅ Produk dihapus" })
  }

    //set stok
    if (command === ".setstok") {
        const nama = args[0]
        const varianNama = args[1]
        const jumlah = Number(args[2])

        const p = products.find(x => x.nama === nama)
        if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

        const v = p.varian.find(x => x.nama === varianNama)
        if (!v) return sock.sendMessage(jid, { text: "Varian tidak ditemukan" })

        v.stok = Math.max(0, jumlah)

        fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

        return sock.sendMessage(jid, {
            text: `✅ Stok di-set: ${v.stok}`
        })
    }

    // tambah  stok
    if (command === ".addstok") {
    const nama = args[0]
    const varianNama = args[1]
    const jumlah = Number(args[2])

    const p = products.find(x => x.nama === nama)
    if (!p) return sock.sendMessage(jid, { text: "Produk tidak ditemukan" })

    const v = p.varian.find(x => x.nama === varianNama)
    if (!v) return sock.sendMessage(jid, { text: "Varian tidak ditemukan" })

    v.stok = (v.stok || 0) + jumlah

    fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))

    return sock.sendMessage(jid, {
        text: `✅ Stok ditambah ${jumlah}\nTotal: ${v.stok}`
    })
 }

    // cek stok
    if (command === ".cekstok") {if (command === ".stok") {
    let teks = "📦 *STOK PRODUK*\n\n"

    products.forEach(p => {
        teks += `🔹 ${p.nama}\n`

        p.varian.forEach(v => {
        teks += `   • ${v.nama}: ${v.stok || 0}\n`
        })

        teks += "\n"
    })

    return sock.sendMessage(jid, { text: teks })
    }
  // ======================
  // GROUP CONTROL
  // ======================

  if (text === "#close") {
    await sock.groupSettingUpdate(jid, "announcement")
    return sock.sendMessage(jid, { text: "🔒 Grup ditutup" })
  }

  if (text === "#open") {
    await sock.groupSettingUpdate(jid, "not_announcement")
    return sock.sendMessage(jid, { text: "🔓 Grup dibuka" })
  }

  // ======================
  // MUTE
  // ======================

  if (text.startsWith("#mute")) {
    const target = msg.message.extendedTextMessage?.contextInfo?.participant
    if (!target) return

    let mute = JSON.parse(fs.readFileSync("./database/mute.json"))

    if (!mute.includes(target)) mute.push(target)

    fs.writeFileSync("./database/mute.json", JSON.stringify(mute, null, 2))

    return sock.sendMessage(jid, { text: "🔇 User dimute" })
  }

  if (text.startsWith("#unmute")) {
    const target = msg.message.extendedTextMessage?.contextInfo?.participant

    let mute = JSON.parse(fs.readFileSync("./database/mute.json"))
    mute = mute.filter(x => x !== target)

    fs.writeFileSync("./database/mute.json", JSON.stringify(mute, null, 2))

    return sock.sendMessage(jid, { text: "🔊 User diunmute" })
  }

  // ======================
  // TAG ALL
  // ======================

  if (text.startsWith("#tagall")) {
    const group = await sock.groupMetadata(jid)

    let teks = "📢 TAG ALL\n\n"
    let mentions = []

    group.participants.forEach(p => {
      teks += `@${p.id.split("@")[0]}\n`
      mentions.push(p.id)
    })

    return sock.sendMessage(jid, { text: teks, mentions })
  }

  if (text.startsWith("#hta")) {
    const group = await sock.groupMetadata(jid)
    let mentions = group.participants.map(p => p.id)

    const pesan = text.replace("#hta ", "")

    return sock.sendMessage(jid, { text: pesan, mentions })
  }

  // ======================
  // WELCOME SETTINGS
  // ======================

  if (text.startsWith("#setwelcome")) {
    groupSettings.welcomeText = text.replace("#setwelcome ", "")
  }

  if (text.startsWith("#setgoodbye")) {
    groupSettings.goodbyeText = text.replace("#setgoodbye ", "")
  }

  if (text === "#welcome on") groupSettings.welcome = true
  if (text === "#welcome off") groupSettings.welcome = false
  if (text === "#goodbye on") groupSettings.goodbye = true
  if (text === "#goodbye off") groupSettings.goodbye = false

  fs.writeFileSync("./database/groupSettings.json", JSON.stringify(groupSettings, null, 2))

  // ======================
  // INVOICE
  // ======================

  if (text.startsWith("#p") || text.startsWith("#c") || text.startsWith("#r") || text.startsWith("#d")) {

    const [cmd, invoiceId] = text.split(" ")
    const order = orders.find(o => o.id === invoiceId)

    if (!order) {
      return sock.sendMessage(jid, { text: "Invoice tidak ditemukan" })
    }

    if (cmd === "#p") {
  const order = orders.find(o => o.id === invoiceId)

  const p = products.find(x => x.nama === order.produk)
  const v = p?.varian.find(x => x.nama === order.varian)

  if (!v || v.stok <= 0) {
    return sock.sendMessage(jid, {
      text: "❌ Stok habis, tidak bisa diproses"
    })
  }

  // 🔥 KURANGI STOK (AMAN)
  v.stok = Math.max(0, v.stok - 1)

  order.status = "success"

  fs.writeFileSync("./database/products.json", JSON.stringify(products, null, 2))
  fs.writeFileSync("./database/orders.json", JSON.stringify(orders, null, 2))

  return sock.sendMessage(jid, {
    text: `✅ Order diproses\nSisa stok: ${v.stok}`
  })
}
    if (cmd === "#c") order.status = "cancel"
    if (cmd === "#r") order.status = "refund"

    if (cmd === "#d") {
      order.status = "done"

      await sock.sendMessage(order.user, {
        text: `📦 PESANAN SELESAI\nID: ${order.id}`
      })
    }

    fs.writeFileSync("./database/orders.json", JSON.stringify(orders, null, 2))

    return sock.sendMessage(jid, {
      text: `📊 STATUS: ${order.status.toUpperCase()}`
    })
  }
    }
    if (text.startsWith("#setpay")) {
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quoted || !quoted.imageMessage) {
        return sock.sendMessage(jid, {
        text: "❌ Reply gambar QRIS + #setpay teks"
        })
    }

    const caption = text.replace("#setpay ", "")

    const buffer = await sock.downloadMediaMessage({
        message: quoted
    })

    const path = "./database/qris.jpg"
    fs.writeFileSync(path, buffer)

    let pay = JSON.parse(fs.readFileSync("./database/payment.json"))

    pay.text = caption
    pay.image = path

    fs.writeFileSync("./database/payment.json", JSON.stringify(pay, null, 2))

    return sock.sendMessage(jid, {
        text: "✅ Payment berhasil disimpan"
    })
    }

        if (text === "#stats") {
        const os = require("os")

        const totalMem = os.totalmem() / 1024 / 1024
        const freeMem = os.freemem() / 1024 / 1024

        const orders = JSON.parse(fs.readFileSync("./database/orders.json"))

        return sock.sendMessage(jid, {
            text: `📊 *BOT STATS*

        🧠 RAM: ${freeMem.toFixed(0)}MB / ${totalMem.toFixed(0)}MB
        📦 Total Order: ${orders.length}
        ⏱️ Uptime: ${process.uptime().toFixed(0)}s`
        })
    }
    if (text === "#restart") {
    await sock.sendMessage(jid, {
        text: "♻️ Restarting bot..."
    })

    process.exit()
    }
}