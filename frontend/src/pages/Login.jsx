import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, verifyLoginOtp, getSalt } from '../utils/api.js'
import { deriveKey, decryptWithKey } from '../utils/crypto.js'
import Logo from '../components/Logo.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequired, setOtpRequired] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const data = await loginUser(email, password)
      if (data.otpRequired) {
        setOtpRequired(true)
      }
    } catch (err) {
      if (err.message && err.message.includes('Too many')) {
        setError(err.message)
      } else {
        setError('Invalid email or password')
      }
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const data = await verifyLoginOtp(email, otp)

      const saltData = await getSalt(email)
      const derivedKey = await deriveKey(password, saltData.kdf_salt)
      const vaultKeyBase64 = await decryptWithKey(derivedKey, saltData.encrypted_vault_key, saltData.vault_key_iv)

      localStorage.setItem('token', data.token)
      localStorage.setItem('userEmail', email)
      sessionStorage.setItem('vaultKey', vaultKeyBase64)

      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="relative bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-sky-500 selection:text-white overflow-hidden flex flex-col">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-800">
        <Link to="/"><Logo /></Link>
        <Link to="/register" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
          New here? <span className="text-sky-400">Create a Vault</span>
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Login
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Back</span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm">
              {otpRequired ? 'Enter the code sent to your email.' : 'Log in to access your vault.'}
            </p>
          </div>

          {!otpRequired ? (
            <form onSubmit={handlePasswordSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-xl shadow-sky-500/25 text-base"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">6-Digit Code</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-center font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-xl shadow-sky-500/25 text-base"
              >
                Verify & Log In
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account? <Link to="/register" className="text-sky-400 hover:underline">Register here</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

export default Login