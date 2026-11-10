import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { getNominees, addNominee, deleteNominee } from '../utils/api.js'
import { wrapVaultKeyForNominee } from '../utils/crypto.js'
import { getPasswordStrength } from '../utils/validation.js'

function Nominees() {
  const [nominees, setNominees] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadNominees()
  }, [])

  async function loadNominees() {
    try {
      const data = await getNominees()
      setNominees(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAdd(event) {
    event.preventDefault()
    setError('')
    try {
      const vaultKeyBase64 = sessionStorage.getItem('vaultKey')
      if (!vaultKeyBase64) {
        setError('Session expired. Please log in again.')
        return
      }
      if (!getPasswordStrength(password).isValid) {
        setError('Nominee password needs 8+ characters with uppercase, lowercase, a number and a punctuation mark')
        return
      }
  
      const wrapped = await wrapVaultKeyForNominee(vaultKeyBase64, password)
      await addNominee({ name, email, password, ...wrapped })
  
      setName('')
      setEmail('')
      setPassword('')
      loadNominees()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNominee(id)
      loadNominees()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex selection:bg-sky-500 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 px-6 sm:px-8 flex items-center bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-lg font-bold text-white">Nominees</h1>
        </header>

        <div className="p-6 sm:p-8 space-y-8">

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Add a Nominee</h2>
              <p className="text-xs text-slate-400 mt-0.5">This person will be able to access your vault only after your account is released.</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominee Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">Share this with your nominee — they'll need it to access your vault later.</p>
              </div>
              <button type="submit" className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all">
                Add Nominee
              </button>
            </form>
          </section>

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">Your Nominees</h2>

            {nominees.length === 0 && <p className="text-sm text-slate-400">No nominees added yet.</p>}

            <div className="space-y-3">
              {nominees.map((nominee) => (
                <div key={nominee.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      {nominee.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{nominee.name}</p>
                      <p className="text-xs text-slate-400">{nominee.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(nominee.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}

export default Nominees