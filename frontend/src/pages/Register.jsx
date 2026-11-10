import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getPasswordStrength } from '../utils/validation.js'
import { generateSalt, deriveKey, generateVaultKey, exportKey, encryptWithKey, wrapVaultKeyForNominee } from '../utils/crypto.js'
import { registerUser, sendOtp, verifyOtp } from '../utils/api.js'
import Logo from '../components/Logo.jsx'

function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nomineeName, setNomineeName] = useState('')
  const [nomineeContact, setNomineeContact] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const passwordStrength = getPasswordStrength(password)
  const [nomineePassword, setNomineePassword] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
  
    if (!otpVerified) {
      setError('Please verify your email before completing registration')
      return
    }
    if (!passwordStrength.isValid) {
      setError('Password does not meet all requirements')
      return
    }
    if (!getPasswordStrength(nomineePassword).isValid) {
      setError('Nominee password must also be 8+ characters with uppercase, lowercase, a number and a punctuation mark')
      return
    }
  
    try {
      const kdfSalt = generateSalt()
      const derivedKey = await deriveKey(password, kdfSalt)
      const vaultKey = await generateVaultKey()
      const vaultKeyBase64 = await exportKey(vaultKey)
      const { ciphertext, iv } = await encryptWithKey(derivedKey, vaultKeyBase64)
  
      const wrapped = await wrapVaultKeyForNominee(vaultKeyBase64, nomineePassword)
      const nominee = { name: nomineeName, email: nomineeContact, password: nomineePassword, ...wrapped }
  
      await registerUser(email, password, kdfSalt, ciphertext, iv, nominee)
      navigate('/login')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSendOtp() {
    setError('')
    setOtpMessage('')
    if (!email) {
      setError('Enter your email first')
      return
    }
    try {
      await sendOtp(email)
      setOtpSent(true)
      setOtpMessage('OTP sent to your email.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleVerifyOtp() {
    setError('')
    setOtpMessage('')
    try {
      await verifyOtp(email, emailOtp)
      setOtpVerified(true)
      setOtpMessage('Email verified successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen w-full flex selection:bg-sky-500 selection:text-white">

      <aside className="hidden lg:flex w-4/12 bg-slate-900 border-r border-slate-800 p-10 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10"><Logo size="lg" /></div>

        <div className="space-y-6 relative z-10 my-auto py-8">
          <div>
            <span className="text-xs font-bold text-sky-400 tracking-wider uppercase">Zero-Knowledge Setup</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">5-Step Onboarding Protocol</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-xs font-bold">1</span>
              <span className="text-white font-medium">Identity & Email Verification</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-xs font-bold">2</span>
              <span className="text-white font-medium">Username & Master Password</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-emerald-400 font-semibold">Nominee Assignment & Split Key</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          Academic SDLC Submission &bull; Cryptographic Split-Key Architecture
        </div>
      </aside>

      <main className="w-full lg:w-8/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-8 py-8">

          <section className="space-y-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Step 1</span>
              <h2 className="text-xl font-bold text-white mt-1">Identity & Email Verification</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Test"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="test@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm"
                  />
                </div>
                <div>
                  <button type="button" onClick={handleSendOtp} className="w-full py-3 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 font-semibold text-xs transition-all">
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Enter Email OTP</label>
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    disabled={otpVerified}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono text-sm tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!otpSent || otpVerified}
                  className="py-2.5 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs transition-all disabled:opacity-40"
                >
                  {otpVerified ? '✓ Verified' : 'Verify'}
                </button>
              </div>
              
              {otpMessage && <p className="text-xs text-emerald-400">{otpMessage}</p>}
            </div>
          </section>

          <section className="space-y-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Step 2</span>
              <h2 className="text-xl font-bold text-white mt-1">Credentials & Key Derivation</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Unique Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    placeholder="test_vault"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Create Master Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">Used locally to derive your client-side encryption key.</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= passwordStrength.passedCount
                        ? passwordStrength.isValid ? 'bg-emerald-400' : 'bg-amber-400'
                        : 'bg-slate-800'
                      }`}
                      />
                      ))}
                      </div>
                      <ul className="text-[11px] text-slate-400 space-y-0.5">
                        <li className={passwordStrength.checks.length ? 'text-emerald-400' : ''}>
                          {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={passwordStrength.checks.uppercase ? 'text-emerald-400' : ''}>
                          {passwordStrength.checks.uppercase ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={passwordStrength.checks.lowercase ? 'text-emerald-400' : ''}>
                          {passwordStrength.checks.lowercase ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={passwordStrength.checks.number ? 'text-emerald-400' : ''}>
                          {passwordStrength.checks.number ? '✓' : '○'} One number
                        </li>
                        <li className={passwordStrength.checks.punctuation ? 'text-emerald-400' : ''}>
                          {passwordStrength.checks.punctuation ? '✓' : '○'} One punctuation mark
                        </li>
                      </ul>
                      </div>
                  </div>
                </div>
          </section>

          <section className="space-y-6 p-6 rounded-2xl bg-slate-900/60 border border-sky-500/30 relative">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Step 3 (Mandatory)</span>
                <h2 className="text-xl font-bold text-white mt-1">Nominee & Split Recovery Key</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Split-Key Security
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John (Son / Beneficiary)"
                  required
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Email</label>
                <input
                  type="email"
                  placeholder="John@example.com"
                  required
                  value={nomineeContact}
                  onChange={(e) => setNomineeContact(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm"
                />
              </div>

              <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Password</label>
              <input
                type="password"
                placeholder="Set a password for your nominee"
                required
                value={nomineePassword}
                onChange={(e) => setNomineePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">Share this with your nominee — they'll need it to access your vault later.</p>
              </div>

            </div>
          </section>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 px-4 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-xl shadow-sky-500/25 text-base"
          >
            Complete Registration & Initialize Vault
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-sky-400 hover:underline">Login here</Link>
          </p>

        </form>
      </main>
    </div>
  )
}

export default Register