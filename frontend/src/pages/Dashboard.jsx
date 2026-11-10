import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import { getItems, addItem, deleteItem, getDashboardSummary, downloadFile, getStorageUsage, fetchFileBytes } from '../utils/api.js'
import { importKey, encryptWithKey, decryptWithKey, encryptFile, decryptFile } from '../utils/crypto.js'

function Dashboard() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [category, setCategory] = useState('Assets')
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [decryptedItems, setDecryptedItems] = useState([])
  const [storage, setStorage] = useState(null)

  useEffect(() => {
    loadItems()
    loadSummary()
    loadStorage()
  }, [])

  async function loadStorage() {
    try {
      const data = await getStorageUsage()
      setStorage(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadItems() {
    try {
      const data = await getItems()
      setItems(data)

      const vaultKeyBase64 = sessionStorage.getItem('vaultKey')
      if (!vaultKeyBase64) {
        setError('Session expired. Please log in again.')
        return
      }
      const vaultKey = await importKey(vaultKeyBase64)

      const decrypted = await Promise.all(
        data.map(async (item) => {
          const plaintext = await decryptWithKey(vaultKey, item.ciphertext, item.iv)
          return { ...item, content: JSON.parse(plaintext) }
        })
      )
      setDecryptedItems(decrypted)
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadSummary() {
    try {
      const data = await getDashboardSummary()
      setSummary(data)
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
  
      if (file && file.size > 5 * 1024 * 1024) {
        setError('File is too large. Maximum size is 5 MB.')
        return
      }
  
      const vaultKey = await importKey(vaultKeyBase64)
      const content = { title, details }
      let encryptedBlob = null
      let fileIv = null
  
      if (file) {
        const encrypted = await encryptFile(vaultKey, file)
        encryptedBlob = encrypted.encryptedBlob
        fileIv = encrypted.iv
        content.fileName = file.name
        content.fileType = file.type
      }
  
      const { ciphertext, iv } = await encryptWithKey(vaultKey, JSON.stringify(content))
      await addItem(category, ciphertext, iv, encryptedBlob, fileIv)
  
      setTitle('')
      setDetails('')
      setFile(null)
      setShowForm(false)
      loadItems()
      loadSummary()
      loadStorage()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDownload(item) {
    setError('')
    try {
      if (!item.file_iv) {
        await downloadFile(item.id, item.original_filename)
        return
      }
  
      const vaultKeyBase64 = sessionStorage.getItem('vaultKey')
      if (!vaultKeyBase64) {
        setError('Session expired. Please log in again.')
        return
      }
      const vaultKey = await importKey(vaultKeyBase64)
      const encryptedBytes = await fetchFileBytes(item.id)
      const decrypted = await decryptFile(vaultKey, encryptedBytes, item.file_iv)
  
      const blob = new Blob([decrypted], { type: item.content.fileType || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.content.fileName || 'download'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Could not decrypt this file. It may be damaged or tampered with.')
    }
  }

  function canView(item) {
    const type = item.content.fileType || ''
    return Boolean(item.file_iv) && (
      (type.startsWith('image/') && type !== 'image/svg+xml') ||
      type === 'application/pdf' ||
      type === 'text/plain'
    )
  }

  async function handleView(item) {
    setError('')
    const viewer = window.open('', '_blank')
    if (!viewer) {
      setError('Please allow pop-ups to view files.')
      return
    }
    try {
      const vaultKeyBase64 = sessionStorage.getItem('vaultKey')
      if (!vaultKeyBase64) {
        viewer.close()
        setError('Session expired. Please log in again.')
        return
      }
      const vaultKey = await importKey(vaultKeyBase64)
      const bytes = await fetchFileBytes(item.id)
      const decrypted = await decryptFile(vaultKey, bytes, item.file_iv)
      const blob = new Blob([decrypted], { type: item.content.fileType })
      viewer.location = URL.createObjectURL(blob)
    } catch (err) {
      viewer.close()
      setError('Could not open this file.')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteItem(id)
      loadItems()
      loadSummary()
    } catch (err) {
      setError(err.message)
    }
  }

  function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  function daysUntil(dateStr) {
    if (!dateStr) return '—'
    const diff = new Date(dateStr).getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} Days` : 'Overdue'
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex selection:bg-sky-500 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <header className="h-16 border-b border-slate-800 px-6 sm:px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white">Vault Overview</h1>
            {summary && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {summary.status}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            {showForm ? 'Close' : 'Add Vault Item'}
          </button>
        </header>

        <div className="p-6 sm:p-8 space-y-8">

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {showForm && (
            <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white">New Vault Item</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    >
                      <option value="Assets">Assets</option>
                      <option value="Liabilities">Liabilities</option>
                      <option value="Belongings">Belongings</option>
                      <option value="Secrets">Secrets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Details</label>
                  <textarea
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm min-h-[90px] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Attach a file (optional, max 5MB)</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-sky-500/10 file:text-sky-400 file:text-xs file:font-semibold"
                  />
                </div>
                <button type="submit" className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-all">
                  Save Item
                </button>
              </form>
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault Items</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{summary ? summary.itemCount : '—'}</span>
                <span className="text-xs text-sky-400 font-medium">Stored</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Designated Nominees</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{summary ? summary.nomineeCount : '—'}</span>
                <span className="text-xs text-emerald-400 font-medium">Registered</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-emerald-400">{summary ? summary.status : '—'}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next Check-In</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-amber-400">{summary ? daysUntil(summary.nextCheckinDueAt) : '—'}</span>
              </div>
            </div>
          </section>

          {storage && (
            <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">Storage Used</span>
                <span className="text-slate-400">
                  {(storage.usedBytes / (1024 * 1024)).toFixed(1)} MB / {(storage.limitBytes / (1024 * 1024)).toFixed(0)} MB
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                className={`h-full rounded-full ${storage.usedBytes / storage.limitBytes > 0.9 ? 'bg-rose-400' : 'bg-sky-400'}`}
                style={{ width: `${Math.min(100, (storage.usedBytes / storage.limitBytes) * 100)}%` }}
                />
              </div>
            </section>
          )}

          <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Stored Vault Items</h2>
              <p className="text-xs text-slate-400 mt-0.5">Visible only to you while your account is active</p>
            </div>

            {decryptedItems.length === 0 && <p className="text-sm text-slate-400">No items yet — add your first one above.</p>}

            {decryptedItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4">Added</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
                    {decryptedItems.map((item) => (
                      <tr key={item.id}>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{item.content.title}</div>
                        <div className="text-slate-400 font-normal mt-0.5">{item.content.details}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{item.category}</td>
                      <td className="py-3.5 px-4">
                        {item.file_path ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleDownload(item)} className="text-sky-400 hover:underline">
                              📎 {item.content.fileName || item.original_filename}
                              {!item.file_iv && <span className="ml-1 text-amber-400">(unencrypted)</span>}
                            </button>
                            {canView(item) && (
                              <button onClick={() => handleView(item)} className="text-slate-400 hover:underline">
                                View
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{timeAgo(item.created_at)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={() => handleDelete(item.id)} className="text-rose-400 hover:underline">Delete</button>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  )
}

export default Dashboard