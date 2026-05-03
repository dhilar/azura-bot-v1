function generateInvoice() {
  const now = Date.now()
  const rand = Math.floor(Math.random() * 1000)
  return `INV-${now}${rand}`
}

module.exports = { generateInvoice }