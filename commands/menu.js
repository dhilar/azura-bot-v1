module.exports = async (sock, msg) => {
  const teks = `
🤖 *BOT MENU*

📦 .produk
🛒 .order <id>

👑 OWNER:
➕ .addproduk nama harga stok
`

  sock.sendMessage(msg.key.remoteJid, { text: teks })
}