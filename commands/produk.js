const fs = require("fs")

module.exports = async (sock, msg) => {
  const products = JSON.parse(
    fs.readFileSync("./database/products.json")
  )

  let teks = "📦 *LIST PRODUK*\n\n"

  products.forEach((p, i) => {
    teks += `*${i + 1}. ${p.nama}*\n`

       p.varian.forEach((v, idx) => {
      teks += `   ${idx + 1}. ${v.nama} - Rp${v.harga} (Stok: ${v.stok})\n`
    })

    teks += "\n"
  })

  teks += "🛒 Cara order:\n.order nomorProduk nomorVarian"

  sock.sendMessage(msg.key.remoteJid, { text: teks })
}