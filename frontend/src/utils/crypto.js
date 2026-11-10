function toBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(str) {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0))
}

export function generateSalt() {
    return toBase64(crypto.getRandomValues(new Uint8Array(16)))
}

export async function deriveKey(password, saltBase64) {
    const salt = fromBase64(saltBase64)
    const passKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        passKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    )
}

export async function generateVaultKey() {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function exportKey(key) {
    const raw = await crypto.subtle.exportKey('raw', key)
    return toBase64(raw)
}

export async function importKey(base64) {
    return crypto.subtle.importKey('raw', fromBase64(base64), 'AES-GCM', true, ['encrypt', 'decrypt'])
}

export async function encryptWithKey(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    )
    return { ciphertext: toBase64(ciphertext), iv: toBase64(iv) }
}

export async function decryptWithKey(key, ciphertextBase64, ivBase64) {
    const iv = fromBase64(ivBase64)
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        fromBase64(ciphertextBase64)
    )
    return new TextDecoder().decode(plaintext)
}

export async function encryptFile(key, file) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = await file.arrayBuffer()
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
    return {
        encryptedBlob: new Blob([encrypted], { type: 'application/octet-stream' }),
        iv: toBase64(iv),
    }
}

export async function decryptFile(key, encryptedBuffer, ivBase64) {
    const iv = fromBase64(ivBase64)
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedBuffer)
}

export async function wrapVaultKeyForNominee(vaultKeyBase64, nomineePassword) {
    const salt = generateSalt()
    const nomineeKey = await deriveKey(nomineePassword, salt)
    const { ciphertext, iv } = await encryptWithKey(nomineeKey, vaultKeyBase64)
    return { wrappedKey: ciphertext, wrappedKeyIv: iv, wrappedKeySalt: salt }
}