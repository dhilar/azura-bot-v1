const fs = require("fs")
const { generateInvoice } = require("../lib/invoice")

module.exports = async (sock, msg, args) => {
  const produkIndex = parseInt(args[0]) - 1
  const varianIndex = parseInt(args[1]) - 1

  const jid = msg.key.remoteJid

  const products = JSON.parse(
    fs.readFileSync("./database/products.json")
  )

  const product = products[produkIndex]

  if (!product) {
    return sock.sendMessage(jid, {
      text: "❌ Produk tidak ditemukan"
    })
  }

  const varian = product.varian[varianIndex]

  if (!varian) {
    return sock.sendMessage(jid, {
      text: "❌ Varian tidak ditemukan"
    })
  }

  // 🔥 CEK STOK DULU (WAJIB DI SINI)
  if (varian.stok <= 0) {
    return sock.sendMessage(jid, {
      text: "❌ Stok habis"
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
    produk: product.nama,
    varian: varian.nama,
    harga: varian.harga,
    produkIndex,
    varianIndex,
    status: "pending",
    createdAt: Date.now()
  })

  fs.writeFileSync(
    "./database/orders.json",
    JSON.stringify(orders, null, 2)
  )

  await sock.sendMessage(jid, {
    text: `🧾 *INVOICE*

ID: ${invoiceId}
Produk: ${product.nama}
Varian: ${varian.nama}
Harga: Rp${varian.harga}

Status: ⏳ PENDING`
  })
}