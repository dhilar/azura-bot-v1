function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
}

// hitung kemiripan (simple score)
function similarity(a, b) {
  let match = 0
  const len = Math.min(a.length, b.length)

  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) match++
  }

  return match / Math.max(a.length, b.length)
}

function findBestMatch(input, list) {
  const normInput = normalize(input)

  let best = null
  let bestScore = 0

  for (let item of list) {
    const normItem = normalize(item)

    // exact / include langsung gas
    if (normItem === normInput) return item
    if (normItem.includes(normInput) || normInput.includes(normItem)) {
      return item
    }

    const score = similarity(normInput, normItem)

    // threshold aman (hindari ngawur)
    if (score > 0.6 && score > bestScore) {
      bestScore = score
      best = item
    }
  }

  return best
}

module.exports = { findBestMatch }