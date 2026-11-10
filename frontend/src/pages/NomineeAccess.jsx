import { useState } from 'react'
import { Link } from 'react-router-dom'
import { accessAsNominee, verifyNomineeOtp, fetchNomineeFileBytes } from '../utils/api.js'
import { deriveKey, decryptWithKey, importKey, decryptFile } from '../utils/crypto.js'
import Logo from '../components/Logo.jsx'

function NomineeAccess() {
  const [ownerEmail, setOwnerEmail] = useState('')
  const [nomineeEmail, setNomineeEmail] = useState('')
  const [nomineePassword, setNomineePassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpRequired, setOtpRequired] = useState(false)
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [nomineeToken, setNomineeToken] = useState('')
  const [nomineeVaultKey, setNomineeVaultKey] = useState(null)

  async function handleCredentialsSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const data = await accessAsNominee(ownerEmail, nomineeEmail, nomineePassword)
      if (data.otpRequired) {
        setOtpRequired(true)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault()
    setError('')
  
    try {
      const data = await verifyNomineeOtp(ownerEmail, nomineeEmail, otp)
  
      let vaultKey
      try {
        const nomineeKey = await deriveKey(nomineePassword, data.wrappedKey.salt)
        const vaultKeyBase64 = await decryptWithKey(nomineeKey, data.wrappedKey.encryptedVaultKey, data.wrappedKey.iv)
        vaultKey = await importKey(vaultKeyBase64)
      } catch {
        setError('Could not unlock the vault with your nominee password.')
        return
      }
  
      const decrypted = await Promise.all(
        data.items.map(async (item) => {
          const plaintext = await decryptWithKey(vaultKey, item.ciphertext, item.iv)
          return { ...item, content: JSON.parse(plaintext) }
        })
      )
  
      setNomineeVaultKey(vaultKey)
      setNomineeToken(data.nomineeToken)
      setItems(decrypted)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDownload(item) {
    setError('')
    try {
      const bytes = await fetchNomineeFileBytes(item.id, nomineeToken)
      let blob
      let name
      if (item.file_iv) {
        const decrypted = await decryptFile(nomineeVaultKey, bytes, item.file_iv)
        blob = new Blob([decrypted], { type: item.content.fileType || 'application/octet-stream' })
        name = item.content.fileName || 'download'
      } else {
        blob = new Blob([bytes])
        name = item.original_filename || 'download'
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Could not download or decrypt this file.')
    }
  }

  return (
    <div className="relative bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-sky-500 selection:text-white overflow-hidden flex flex-col">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-800">
        <Link to="/"><Logo /></Link>
        <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
          Account owner? <span className="text-sky-400">Log In</span>
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Nominee Verification
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Access a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Released Vault</span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm max-w-sm mx-auto">
              {otpRequired
                ? 'Enter the verification code sent to your email.'
                : "Enter the account owner's email, your own registered email, and your nominee password."}
            </p>
          </div>

          {!otpRequired ? (
            <form onSubmit={handleCredentialsSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Owner's Email</label>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Your (Nominee) Email</label>
                <input
                  type="email"
                  required
                  value={nomineeEmail}
                  onChange={(e) => setNomineeEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Your Nominee Password</label>
                <input
                  type="password"
                  required
                  value={nomineePassword}
                  onChange={(e) => setNomineePassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all shadow-xl shadow-indigo-500/25 text-base"
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
                className="w-full py-3.5 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all shadow-xl shadow-indigo-500/25 text-base"
              >
                Verify & Check Access
              </button>
            </form>
          )}

          {items && (
           <div className="mt-8 p-6 rounded-2xl bg-slate-900 border border-emerald-500/20 space-y-4">
             <h2 className="text-base font-bold text-white flex items-center gap-2">
               <span className="text-emerald-400">🔓</span> Vault Contents
             </h2>
          
             {items.length === 0 && <p className="text-sm text-slate-400">No items were stored.</p>}
          
             <div className="space-y-3">
               {items.map((item) => (
                 <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                   <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20           mb-2">
                     {item.category}
                   </span>
                   <p className="text-sm font-semibold text-white">{item.content.title}</p>
                   <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{item.content.details}</p>
                   {item.file_path && (
                     <button onClick={() => handleDownload(item)} className="mt-3 text-xs text-sky-400 hover:underline">
                       📎 {item.content.fileName || item.original_filename}
                     </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default NomineeAccess