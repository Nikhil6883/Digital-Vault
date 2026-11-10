const crypto = require('crypto')

const otps = new Map()
const MAX_ATTEMPTS = 5

function keyFor(email, purpose) {
    return `${purpose}:${String(email).trim().toLowerCase()}`
}

function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString()
}

function saveOtp(email, otp, purpose = 'register') {
    otps.set(keyFor(email, purpose), {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attempts: 0,
    })
}

function verifyOtp(email, submittedOtp, purpose = 'register') {
    const key = keyFor(email, purpose)
    const record = otps.get(key)
    if (!record) return false

    if (Date.now() > record.expiresAt) {
        otps.delete(key)
        return false
    }

    if (record.otp !== String(submittedOtp).trim()) {
        record.attempts += 1
        if (record.attempts >= MAX_ATTEMPTS) otps.delete(key)
        return false
    }

    otps.delete(key)
    return true
}

module.exports = { generateOtp, saveOtp, verifyOtp }