import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { getStatus, checkIn, updateCheckinInterval } from '../utils/api.js'

function Settings() {
  const [status, setStatus] = useState(null)
  const [days, setDays] = useState(30)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      const data = await getStatus()
      setStatus(data)
      setDays(data.checkin_interval_days)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCheckIn() {
    setError('')
    setMessage('')
    try {
      await checkIn()
      setMessage('Checked in successfully. Your timer has been reset.')
      loadStatus()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleIntervalSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await updateCheckinInterval(Number(days))
      setMessage('Check-in interval updated.')
      loadStatus()
    } catch (err) {
      setError(err.message)
    }
  }

  const statusColors = {
    ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    WARNING_SENT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    GRACE_PERIOD: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    RELEASED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex selection:bg-sky-500 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 px-6 sm:px-8 flex items-center bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <h1 className="text-lg font-bold text-white">Settings</h1>
        </header>

        <div className="p-6 sm:p-8 space-y-8 max-w-2xl">

          {message && (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">{message}</p>
          )}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {status && (
            <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white">Account Status</h2>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                  {status.status}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Last Active</span>
                <span className="text-sm text-white font-medium">{new Date(status.last_active_at).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-sm text-slate-300">Next Check-In Due</span>
                <span className="text-sm text-white font-medium">{new Date(status.next_checkin_due_at).toLocaleString()}</span>
              </div>

              <button
                onClick={handleCheckIn}
                className="w-full py-3.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-lg shadow-sky-500/20"
              >
                I'm Alive — Check In Now
              </button>
            </section>
          )}

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Check-In Interval</h2>
              <p className="text-xs text-slate-400 mt-0.5">How many days of inactivity before the release process begins</p>
            </div>

            <form onSubmit={handleIntervalSubmit} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Days</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
              <button type="submit" className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm transition-all">
                Save
              </button>
            </form>
          </section>

        </div>
      </main>
    </div>
  )
}

export default Settings