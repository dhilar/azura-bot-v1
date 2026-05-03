const fs = require("fs")

module.exports = async (sock, msg) => {
  const jid = msg.key.remoteJid
  const sender = msg.key.participant

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text

  if (!text) return

  const settings = JSON.parse(
   fs.readFileSync("./database/groupSettings.json")
  )

  const muteList = JSON.parse(
    fs.readFileSync("./database/mute.json")
  )

  // ======================
  // AUTO DELETE MUTED USER
  // ======================
  if (muteList.includes(sender)) {
    await sock.sendMessage(jid, {
      delete: msg.key
    })
    return
  }

  // ======================
  // ANTI LINK
  // ======================
  if (settings.antilink && text.includes("https://")) {
    await sock.sendMessage(jid, {
      delete: msg.key
    })

    await sock.groupParticipantsUpdate(jid, [sender], "remove")
  }
}