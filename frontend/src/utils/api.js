const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function registerUser(email, password, kdfSalt, encryptedVaultKey, vaultKeyIv, nominee) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, kdfSalt, encryptedVaultKey, vaultKeyIv, nominee }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
    }
    return data
}

export async function loginUser(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Login failed')
    }
    return data
}

function authHeaders() {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export async function getItems() {
    const response = await fetch(`${API_URL}/items`, {
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch items')
    }
    return data
}

export async function addItem(category, ciphertext, iv, encryptedFile, fileIv) {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('category', category)
    formData.append('ciphertext', ciphertext)
    formData.append('iv', iv)
    if (encryptedFile) {
        formData.append('fileIv', fileIv)
        formData.append('file', encryptedFile, 'encrypted.bin')
    }

    const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to add item')
    }
    return data
}

export async function deleteItem(id) {
    const response = await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to delete item')
    }
    return data
}

export async function getNominees() {
    const response = await fetch(`${API_URL}/nominees`, {
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch nominees')
    }
    return data
}

export async function addNominee(nominee) {
    const response = await fetch(`${API_URL}/nominees`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(nominee),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to add nominee')
    }
    return data
}

export async function deleteNominee(id) {
    const response = await fetch(`${API_URL}/nominees/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to delete nominee')
    }
    return data
}

export async function getStatus() {
    const response = await fetch(`${API_URL}/status`, {
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
    }
    return data
}

export async function checkIn() {
    const response = await fetch(`${API_URL}/checkin`, {
        method: 'POST',
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Check-in failed')
    }
    return data
}

export async function updateCheckinInterval(days) {
    const response = await fetch(`${API_URL}/checkin-interval`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ days }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to update interval')
    }
    return data
}

export async function accessAsNominee(ownerEmail, nomineeEmail, nomineePassword) {
    const response = await fetch(`${API_URL}/nominee-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail, nomineeEmail, nomineePassword }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Access denied')
    }
    return data
}

export async function verifyNomineeOtp(ownerEmail, nomineeEmail, otp) {
    const response = await fetch(`${API_URL}/nominee-access-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail, nomineeEmail, otp }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired OTP')
    }
    return data
}

export async function getDashboardSummary() {
    const response = await fetch(`${API_URL}/dashboard-summary`, {
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to load summary')
    }
    return data
}

export async function getSalt(email) {
    const response = await fetch(`${API_URL}/salt?email=${encodeURIComponent(email)}`)
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Account not found')
    }
    return data
}

export async function downloadFile(id, filename) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
}

export async function sendOtp(email) {
    const response = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
    }
    return data
}

export async function verifyOtp(email, otp) {
    const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired OTP')
    }
    return data
}

export async function verifyLoginOtp(email, otp) {
    const response = await fetch(`${API_URL}/login-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired OTP')
    }
    return data
}

export async function getStorageUsage() {
    const response = await fetch(`${API_URL}/storage-usage`, {
        headers: authHeaders(),
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || 'Failed to load storage usage')
    }
    return data
}

export async function fetchFileBytes(id) {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
    }
    return response.arrayBuffer()
}

export async function fetchNomineeFileBytes(id, nomineeToken) {
    const response = await fetch(`${API_URL}/nominee-download/${id}`, {
        headers: { Authorization: `Bearer ${nomineeToken}` },
    })
    if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
    }
    return response.arrayBuffer()
}