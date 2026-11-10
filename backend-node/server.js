const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
require('dotenv').config()
const db = require('./db')

const app = express()
const jwt = require('jsonwebtoken')
const verifyToken = require('./authMiddleware')

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']).{8,}$/

function validNominee(n) {
    return Boolean(
        n && n.name && n.email && n.password &&
        n.wrappedKey && n.wrappedKeyIv && n.wrappedKeySalt &&
        PASSWORD_RULE.test(n.password)
    )
}

async function createNominee(conn, userId, n) {
    const passwordHash = await bcrypt.hash(n.password, 10)
    const [result] = await conn.query(
        'INSERT INTO nominees (user_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        [userId, n.name, n.email, passwordHash]
    )
    await conn.query(
        'INSERT INTO wrapped_keys (nominee_id, encrypted_vault_key, iv, salt) VALUES (?, ?, ?, ?)',
        [result.insertId, n.wrappedKey, n.wrappedKeyIv, n.wrappedKeySalt]
    )
}

function verifyNomineeToken(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' })
    }
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
        if (decoded.role !== 'nominee') {
            return res.status(401).json({ error: 'Invalid token' })
        }
        req.ownerId = decoded.ownerId
        req.nomineeId = decoded.nomineeId
        next()
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}

const multer = require('multer')

const { generateOtp, saveOtp, verifyOtp } = require('./otpStore')

async function sendOtpMail(to, otp, purpose) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: 'LegacyVault', email: process.env.MAIL_FROM },
            to: [{ email: to }],
            subject: `${otp} is your LegacyVault ${purpose} code`,
            textContent: `Your LegacyVault ${purpose} code is ${otp}. It expires in 5 minutes. If you did not request this, you can safely ignore this email.`,
            htmlContent: `<div style="font-family:Arial,sans-serif;max-width:420px">
        <p>Your LegacyVault ${purpose} code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:12px 0">${otp}</p>
        <p style="color:#555">It expires in 5 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>`,
        }),
    })

    if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Email send failed (${response.status}): ${detail}`)
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
})

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' })
})

app.post('/api/register', async (req, res) => {
    const conn = await db.getConnection()
    try {
        const { email, password, kdfSalt, encryptedVaultKey, vaultKeyIv, nominee } = req.body

        if (!email || !password || !kdfSalt || !encryptedVaultKey || !vaultKeyIv) {
            return res.status(400).json({ error: 'Missing required fields' })
        }
        if (!PASSWORD_RULE.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a punctuation mark' })
        }
        if (!validNominee(nominee)) {
            return res.status(400).json({ error: 'Nominee details are incomplete, or the nominee password does not meet the password rules' })
        }

        const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email])
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        await conn.beginTransaction()
        const [result] = await conn.query(
            `INSERT INTO users (email, password_hash, kdf_salt, encrypted_vault_key, vault_key_iv, next_checkin_due_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
            [email, passwordHash, kdfSalt, encryptedVaultKey, vaultKeyIv]
        )
        await createNominee(conn, result.insertId, nominee)
        await conn.commit()

        res.json({ message: 'Registration successful' })
    } catch (err) {
        await conn.rollback()
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    } finally {
        conn.release()
    }
})

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' })
        }

        const [recentAttempts] = await db.query(
            `SELECT COUNT(*) as count FROM login_attempts 
       WHERE email = ? AND success = FALSE AND attempted_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)`,
            [email]
        )

        if (recentAttempts[0].count >= 3) {
            return res.status(429).json({ error: 'Too many failed attempts. Please try again in 1 minute.' })
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])

        if (rows.length === 0) {
            await db.query('INSERT INTO login_attempts (email, success) VALUES (?, FALSE)', [email])
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const user = rows[0]
        const passwordMatches = await bcrypt.compare(password, user.password_hash)

        if (!passwordMatches) {
            await db.query('INSERT INTO login_attempts (email, success) VALUES (?, FALSE)', [email])
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        const otp = generateOtp()
        saveOtp(email, otp, 'login')

        await sendOtpMail(email, otp, 'login')

        res.json({ otpRequired: true, message: 'OTP sent to your email' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/login-verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' })
        }

        const isValid = verifyOtp(email, otp, 'login')
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid or expired OTP' })
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email])
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Account not found' })
        }
        const user = rows[0]

        await db.query('INSERT INTO login_attempts (email, success) VALUES (?, TRUE)', [email])

        await db.query(
            `UPDATE users SET last_active_at = NOW(), next_checkin_due_at = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?`,
            [user.id]
        )

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        )

        res.json({ message: 'Login successful', token })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

const STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 // 100 MB per user

app.post('/api/items', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { category, ciphertext, iv, fileIv } = req.body
        const file = req.file

        if (!ciphertext || !iv) {
            return res.status(400).json({ error: 'Item content is required' })
        }
        if (file && !fileIv) {
            return res.status(400).json({ error: 'Files must be encrypted before upload' })
        }

        if (file) {
            const [[usageRow]] = await db.query(
                'SELECT COALESCE(SUM(file_size), 0) as totalUsed FROM vault_items WHERE user_id = ?',
                [req.userId]
            )
            const used = Number(usageRow.totalUsed)
            if (used + file.size > STORAGE_LIMIT_BYTES) {
                return res.status(400).json({
                    error: `Storage limit exceeded. You have used ${(used / (1024 * 1024)).toFixed(1)} MB of your 50 MB limit.`
                })
            }
        }

        await db.query(
            `INSERT INTO vault_items (user_id, ciphertext, iv, category, file_path, original_filename, file_size, file_iv, file_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId, ciphertext, iv, category || 'Other',
                file ? 'stored-in-database' : null,
                file ? 'encrypted-file' : null,
                file ? file.size : null,
                file ? fileIv : null,
                file ? file.buffer : null,
            ]
        )

        res.json({ message: 'Item added' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/storage-usage', verifyToken, async (req, res) => {
    try {
        const [[usageRow]] = await db.query(
            'SELECT COALESCE(SUM(file_size), 0) as totalUsed FROM vault_items WHERE user_id = ?',
            [req.userId]
        )

        res.json({
            usedBytes: usageRow.totalUsed,
            limitBytes: STORAGE_LIMIT_BYTES,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/items', verifyToken, async (req, res) => {
    try {
        const [items] = await db.query(
            `SELECT id, category, ciphertext, iv, file_path, original_filename, file_size, file_iv, created_at
       FROM vault_items WHERE user_id = ? ORDER BY created_at DESC`,
            [req.userId]
        )
        res.json(items)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/items', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { category, ciphertext, iv, fileIv } = req.body
        const file = req.file

        if (!ciphertext || !iv) {
            return res.status(400).json({ error: 'Item content is required' })
        }
        if (file && !fileIv) {
            return res.status(400).json({ error: 'Files must be encrypted before upload' })
        }

        if (file) {
            const [[usageRow]] = await db.query(
                'SELECT COALESCE(SUM(file_size), 0) as totalUsed FROM vault_items WHERE user_id = ?',
                [req.userId]
            )
            const used = Number(usageRow.totalUsed)
            if (used + file.size > STORAGE_LIMIT_BYTES) {
                return res.status(400).json({
                    error: `Storage limit exceeded. You have used ${(used / (1024 * 1024)).toFixed(1)} MB of your 50 MB limit.`
                })
            }
        }

        await db.query(
            `INSERT INTO vault_items (user_id, ciphertext, iv, category, file_path, original_filename, file_size, file_iv, file_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId, ciphertext, iv, category || 'Other',
                file ? 'stored-in-database' : null,
                file ? 'encrypted-file' : null,
                file ? file.size : null,
                file ? fileIv : null,
                file ? file.buffer : null,
            ]
        )

        res.json({ message: 'Item added' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.put('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const { ciphertext, category } = req.body
        const { id } = req.params

        await db.query(
            'UPDATE vault_items SET ciphertext = ?, category = ? WHERE id = ? AND user_id = ?',
            [ciphertext, category, id, req.userId]
        )

        res.json({ message: 'Item updated' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.delete('/api/items/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params

        await db.query(
            'DELETE FROM vault_items WHERE id = ? AND user_id = ?',
            [id, req.userId]
        )

        res.json({ message: 'Item deleted' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/download/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT file_data FROM vault_items WHERE id = ? AND user_id = ? AND file_data IS NOT NULL',
            [req.params.id, req.userId]
        )
        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' })
        }
        res.set('Content-Type', 'application/octet-stream')
        res.send(rows[0].file_data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/nominees', verifyToken, async (req, res) => {
    try {
        const [nominees] = await db.query(
            'SELECT id, name, email, created_at FROM nominees WHERE user_id = ?',
            [req.userId]
        )
        res.json(nominees)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/nominees', verifyToken, async (req, res) => {
    const conn = await db.getConnection()
    try {
        if (!validNominee(req.body)) {
            return res.status(400).json({ error: 'Name, email and a strong nominee password are required' })
        }

        await conn.beginTransaction()
        await createNominee(conn, req.userId, req.body)
        await conn.commit()

        res.json({ message: 'Nominee added' })
    } catch (err) {
        await conn.rollback()
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    } finally {
        conn.release()
    }
})

app.delete('/api/nominees/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params

        await db.query(
            'DELETE FROM nominees WHERE id = ? AND user_id = ?',
            [id, req.userId]
        )

        res.json({ message: 'Nominee removed' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/checkin', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT checkin_interval_days FROM users WHERE id = ?', [req.userId])
        const days = rows[0].checkin_interval_days

        await db.query(
            `UPDATE users 
       SET last_active_at = NOW(), 
           next_checkin_due_at = DATE_ADD(NOW(), INTERVAL ? DAY),
           status = 'ACTIVE'
       WHERE id = ?`,
            [days, req.userId]
        )

        res.json({ message: 'Check-in successful' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/status', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT email, status, checkin_interval_days, last_active_at, next_checkin_due_at FROM users WHERE id = ?',
            [req.userId]
        )
        res.json(rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.put('/api/checkin-interval', verifyToken, async (req, res) => {
    try {
        const { days } = req.body

        if (!days || days < 1) {
            return res.status(400).json({ error: 'Please provide a valid number of days' })
        }

        await db.query(
            `UPDATE users 
       SET checkin_interval_days = ?, 
           next_checkin_due_at = DATE_ADD(NOW(), INTERVAL ? DAY)
       WHERE id = ?`,
            [days, days, req.userId]
        )

        res.json({ message: 'Check-in interval updated' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/nominee-access', async (req, res) => {
    try {
        const { ownerEmail, nomineeEmail, nomineePassword } = req.body

        if (!ownerEmail || !nomineeEmail || !nomineePassword) {
            return res.status(400).json({ error: 'Owner email, your email, and your nominee password are required' })
        }

        const [users] = await db.query('SELECT id, status FROM users WHERE email = ?', [ownerEmail])
        if (users.length === 0) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const owner = users[0]

        const [nominees] = await db.query(
            'SELECT id, password_hash FROM nominees WHERE user_id = ? AND email = ?',
            [owner.id, nomineeEmail]
        )
        if (nominees.length === 0) {
            return res.status(403).json({ error: 'Access denied' })
        }

        const nominee = nominees[0]
        const passwordMatches = await bcrypt.compare(nomineePassword, nominee.password_hash)
        if (!passwordMatches) {
            return res.status(403).json({ error: 'Access denied' })
        }

        if (owner.status !== 'RELEASED') {
            return res.status(403).json({ error: 'Access denied' })
        }

        const otp = generateOtp()
        saveOtp(nomineeEmail, otp, 'nominee')

        await sendOtpMail(nomineeEmail, otp, 'access')

        res.json({ otpRequired: true, message: 'OTP sent to your email' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/nominee-access-verify-otp', async (req, res) => {
    try {
        const { ownerEmail, nomineeEmail, otp } = req.body

        if (!ownerEmail || !nomineeEmail || !otp) {
            return res.status(400).json({ error: 'Missing required fields' })
        }

        if (!verifyOtp(nomineeEmail, otp, 'nominee')) {
            return res.status(400).json({ error: 'Invalid or expired OTP' })
        }

        const [rows] = await db.query(
            `SELECT u.id AS ownerId, u.status, n.id AS nomineeId
       FROM users u JOIN nominees n ON n.user_id = u.id
       WHERE u.email = ? AND n.email = ?`,
            [ownerEmail, nomineeEmail]
        )
        if (rows.length === 0 || rows[0].status !== 'RELEASED') {
            return res.status(403).json({ error: 'Access denied' })
        }
        const { ownerId, nomineeId } = rows[0]

        const [keys] = await db.query(
            'SELECT encrypted_vault_key, iv, salt FROM wrapped_keys WHERE nominee_id = ?',
            [nomineeId]
        )
        if (keys.length === 0) {
            return res.status(409).json({ error: 'No key was shared with you. Ask the owner to remove and re-add you as a nominee.' })
        }

        const [items] = await db.query(
            'SELECT id, category, ciphertext, iv, file_path, file_iv, original_filename, created_at FROM vault_items WHERE user_id = ?',
            [ownerId]
        )

        await db.query(
            'INSERT INTO access_logs (user_id, action) VALUES (?, ?)',
            [ownerId, `Nominee ${nomineeEmail} accessed the vault`]
        )

        const nomineeToken = jwt.sign(
            { role: 'nominee', ownerId, nomineeId },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        )

        res.json({
            items,
            nomineeToken,
            wrappedKey: {
                encryptedVaultKey: keys[0].encrypted_vault_key,
                iv: keys[0].iv,
                salt: keys[0].salt,
            },
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/dashboard-summary', verifyToken, async (req, res) => {
    try {
        const [[itemCountRow]] = await db.query(
            'SELECT COUNT(*) as count FROM vault_items WHERE user_id = ?', [req.userId]
        )
        const [[nomineeCountRow]] = await db.query(
            'SELECT COUNT(*) as count FROM nominees WHERE user_id = ?', [req.userId]
        )
        const [[user]] = await db.query(
            'SELECT status, next_checkin_due_at FROM users WHERE id = ?', [req.userId]
        )

        res.json({
            itemCount: itemCountRow.count,
            nomineeCount: nomineeCountRow.count,
            status: user.status,
            nextCheckinDueAt: user.next_checkin_due_at,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.get('/api/salt', async (req, res) => {
    try {
        const { email } = req.query

        const [rows] = await db.query(
            'SELECT kdf_salt, encrypted_vault_key, vault_key_iv FROM users WHERE email = ?',
            [email]
        )

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Account not found' })
        }

        res.json(rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})

app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ error: 'Email is required' })
        }

        const otp = generateOtp()
        saveOtp(email, otp)

        await sendOtpMail(email, otp, 'verification')

        res.json({ message: 'OTP sent' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to send OTP' })
    }
})

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' })
    }

    const isValid = verifyOtp(email, otp)
    if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    res.json({ message: 'OTP verified' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

app.get('/api/nominee-download/:id', verifyNomineeToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT v.file_data FROM vault_items v
       JOIN users u ON u.id = v.user_id
       WHERE v.id = ? AND v.user_id = ? AND u.status = 'RELEASED' AND v.file_data IS NOT NULL`,
            [req.params.id, req.ownerId]
        )
        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' })
        }
        res.set('Content-Type', 'application/octet-stream')
        res.send(rows[0].file_data)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong' })
    }
})