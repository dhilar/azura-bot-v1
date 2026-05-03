function cleanJid(jid) {
  if (!jid) return jid
  return jid.split(":")[0]
}

module.exports = { cleanJid }