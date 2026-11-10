function Logo({ size = 'md', showText = true }) {
  const box = size === 'lg' ? 'h-10 w-10 rounded-xl' : 'h-9 w-9 rounded-lg'
  const icon = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
  const text = size === 'lg' ? 'text-2xl' : 'text-xl'

  return (
    <div className="flex items-center gap-3">
      <div className={`${box} bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400`}>
        <svg className={icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
      {showText && (
        <span className={`font-bold ${text} tracking-tight text-white`}>
          Legacy<span className="text-sky-400">Vault</span>
        </span>
      )}
    </div>
  )
}

export default Logo