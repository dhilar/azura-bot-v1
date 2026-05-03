const fs = require("fs")
const { findBestMatch } = require("../lib/fuzzy")
const { generateInvoice } = require("../lib/invoice")

module.exports = async (sock, msg, text) => {
  // ❌ biar bot gak bales pesan dia sendiri (anti loop)
  if (msg.key.fromMe) return

  const jid = msg.key.remoteJid

  const products = JSON.parse(
    fs.readFileSync("./database/products.json")
  )

  // =====================
  // MENU DETECTION
  // =====================
  const menuKeywords = ["menu", "list", "produk", "produklist"]

  if (menuKeywords.includes(text)) {
    let teks = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃       ✨ 𝐀𝐙𝐔𝐑𝐀 𝐒𝐓𝐎𝐑𝐄 ✨        ┃
┃     🛍️ Premium WhatsApp Store    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃         📦 *LIST PRODUK*       ┃
┃        (Pilih barang favorit)  ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

`

    products.forEach((p, i) => {
      teks += `┌────────────────────────────┐\n`
      teks += `│ ${(i+1).toString().padStart(2)}. 🎁 *${p.nama}*\n`
      teks += `│    💰 Mulai Rp${p.varian[0]?.harga?.toLocaleString() || "0"}\n`
      teks += `│    📦 ${p.varian.length} Varian tersedia\n`
      teks += `└────────────────────────────┘\n\n`
    })

    teks += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         💡 *CARA ORDER*         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  1️⃣ Ketik nama produk           ┃
┃  2️⃣ Pilih varian yang diinginkan┃
┃  3️⃣ Tunggu invoice dari bot     ┃
┃  4️⃣ Konfirmasi ke admin         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         📞 *INFO TOKO*         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  ⏰ Jam Operasional: 24 Jam    ┃
┃  ✅ Garansi: 100% Uang Kembali ┃
┃  ⭐ Rating: ★★★★★ (4.9/5)     ┃
┃  💬 Respon: < 5 Menit          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Happy Shopping at Azura Store!* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

    return sock.sendMessage(jid, { text: teks })
  }

  // =====================
  // DETECT ORDER (PRIORITAS)
  // =====================
  const words = text.split(" ")

  let foundProduct = null

  for (let p of products) {
    const match = findBestMatch(words[0], p.alias)
    if (match) {
      foundProduct = p
      break
    }
  }

  if (foundProduct && words.length > 1) {
    const inputVar = words.slice(1).join(" ")

    const varianNamaList = foundProduct.varian.map(v => v.nama)

    const bestVar = findBestMatch(inputVar, varianNamaList)

    const varian = foundProduct.varian.find(v => v.nama === bestVar)

    // ❗ cek dulu varian ada atau tidak
    if (!varian) {
    return sock.sendMessage(jid, {
        text: `❌ *VARIAN TIDAK DITEMUKAN*\n\n💡 *Varian yang tersedia:*\n${foundProduct.varian.map(v => `• ${v.nama}`).join("\n")}\n\n📝 Contoh: ${foundProduct.nama} ${foundProduct.varian[0]?.nama}`
    })
    }

    // ❗ baru cek stok
    if (varian.stok !== undefined && varian.stok <= 0) {
    return sock.sendMessage(jid, {
        text: "❌ Stok habis"
    })
    }

    if (!varian) {
      return sock.sendMessage(jid, {
        text: `❌ *VARIAN TIDAK DITEMUKAN*\n\n💡 *Varian yang tersedia:*\n${foundProduct.varian.map(v => `• ${v.nama}`).join("\n")}\n\n📝 Contoh: ${foundProduct.nama} ${foundProduct.varian[0]?.nama}`
      })
    }

    const invoiceId = generateInvoice()

    let orders = JSON.parse(
      fs.readFileSync("./database/orders.json")
    )

    const user = msg.key.participant || msg.key.remoteJid

    orders.push({
      id: invoiceId,
      user,
      produk: foundProduct.nama,
      varian: varian.nama,
      harga: varian.harga,
      status: "pending",
      createdAt: Date.now()
    })

    fs.writeFileSync(
      "./database/orders.json",
      JSON.stringify(orders, null, 2)
    )

    return sock.sendMessage(jid, {
      text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        🧾 *INVOICE PESANAN*       ┃
┃       (Simpan sebagai bukti)      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭────────────────────────────────╮
│  🆔 *ID INVOICE*                │
│  ────────────────────────────── │
│  ➤ ${invoiceId}                 │
│                                  │
│  📦 *DETAIL PRODUK*              │
│  ────────────────────────────── │
│  ➤ Produk: ${foundProduct.nama} │
│  ➤ Paket: ${varian.nama}        │
│  ➤ Harga: Rp${varian.harga.toLocaleString()} │
│                                  │
│  ⏳ *STATUS*                     │
│  ────────────────────────────── │
│  ➤ 🟡 PENDING (Menunggu Admin)  │
│                                  │
│  🕐 *WAKTU ORDER*                │
│  ────────────────────────────── │
│  ➤ ${new Date().toLocaleString("id-ID")} │
╰────────────────────────────────╯

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      📌 *INSTRUKSI*           ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  1️⃣ Simpan ID Invoice ini     ┃
┃  2️⃣ Lakukan pembayaran sesuai ┃
┃  3️⃣ Konfirmasi ke admin       ┃
┃  4️⃣ Tunggu proses pengiriman  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Terima kasih sudah berbelanja!* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    })
  }

  // =====================
  // DETECT PRODUK (VIEW)
  // =====================
  let product = null

  for (let p of products) {
    const match = findBestMatch(text, p.alias)
    if (match) {
      product = p
      break
    }
  }

  if (product) {
    let teks = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      📺 *DETAIL PRODUK*        ┃
┃   ${product.nama.toUpperCase()}   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

╭────────────────────────────────╮
┃      💰 *PAKET YANG TERSEDIA*   ┃
┃      (Pilih sesuai kebutuhan)   ┃
╰────────────────────────────────╯

`

    product.varian.forEach((v, i) => {
      teks += `┌────────────────────────────┐\n`
      teks += `│  ${(i+1)}. 🎁 *${v.nama}*\n`
      teks += `│     └─ 💰 Harga: Rp${v.harga.toLocaleString()}\n`
      teks += `│     └─ 📦 Stok: ${v.stok || "Tersedia"}\n`
      teks += `└────────────────────────────┘\n\n`
    })

    teks += `╭────────────────────────────────╮
┃         📋 *SYARAT & KETENTUAN*    ┃
╰────────────────────────────────╯
┌────────────────────────────────┐
│  📌 ${product.snk || "Barang digital tidak bisa diretur"} │
│  ✅ Garansi 100% jika produk   │
│     tidak sesuai pesanan       │
│  ⏰ Proses max 30 menit        │
└────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      💡 *CARA ORDER*          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  Ketik: *${product.nama}* [nama_paket] ┃
┃                                  ┃
┃  Contoh:                         ┃
┃  *${product.nama} ${product.varian[0]?.nama}*      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 *Yuk langsung order sekarang!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

    return sock.sendMessage(jid, { text: teks })
  }

if (text === "pay") {
  const pay = JSON.parse(
    fs.readFileSync("./database/payment.json")
  )

  if (!pay.image) {
    return sock.sendMessage(jid, {
      text: "Payment belum di-set"
    })
  }

  return sock.sendMessage(jid, {
    image: fs.readFileSync(pay.image),
    caption: `💳 *PEMBAYARAN*\n\n${pay.text}`
  })
}
}