import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

function Home() {
  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white min-h-screen">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/"><Logo /></Link>

            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
              <a href="#impact" className="hover:text-sky-400 transition-colors">Impact</a>
              <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
              <a href="#faq" className="hover:text-sky-400 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Log In</Link>
              <Link to="/register" className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-lg transition-all shadow-lg shadow-sky-500/20">
                Create Vault
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-sky-400 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Zero-Knowledge Architecture & AES-256-GCM
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Protect Your Digital Assets <br className="hidden sm:inline"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Beyond Your Lifetime</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
            A zero-knowledge encrypted vault controlled by an automated Dead Man's Switch. Your passwords, documents, and assets remain private until designated nominees need them.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/25 transition-all text-base">
              Start Your Free Vault
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border
            border-slate-800 text-slate-300 transition-all text-base">
              View Architecture
            </a>
            <Link to="/nominee-access" className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all text-base">
              I'm a Nominee
            </Link>
          </div>

          <div className="mt-16 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl shadow-sky-950/40 backdrop-blur-xl">
            <div className="rounded-xl bg-slate-950 border border-slate-800/80 p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    🟢 SYSTEM ACTIVE
                  </span>
                  <span className="text-xs text-slate-400">Heartbeat Monitor: Operational</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">Next Check-In Due: <span className="text-white font-bold">18 Days, 14 Hours</span></div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sky-400">📄</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Family Estate Will & Deeds</div>
                      <div className="text-xs text-slate-400">AES-256 Encrypted Payload</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded">Assigned to: Son (Primary)</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400">🔑</span>
                    <div>
                      <div className="text-sm font-semibold text-white">Primary Crypto Wallet Seed Phrase</div>
                      <div className="text-xs text-slate-400">Client-Side Derived Key</div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded">Assigned to: Spouse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section id="impact" className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-400 tracking-wider uppercase">Why It Matters</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">Solving the Digital Estate Problem</p>
            <p className="mt-4 text-slate-400">Every year, crucial family documents, financial records, and digital assets are permanently lost due to sudden incapacity without legacy planning.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-4xl font-extrabold text-sky-400 mb-2">Any Size</div>
              <div className="text-base font-semibold text-white mb-2">Digital Footprint</div>
              <p className="text-sm text-slate-400">Sensitive financial, personal, and legal data, organized and ready for transfer when needed.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-4xl font-extrabold text-emerald-400 mb-2">Owner-Only</div>
              <div className="text-base font-semibold text-white mb-2">Access While Active</div>
              <p className="text-sm text-slate-400">Only you can view your vault items while your account remains active.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-4xl font-extrabold text-indigo-400 mb-2">Automated</div>
              <div className="text-base font-semibold text-white mb-2">Release Process</div>
              <p className="text-sm text-slate-400">Configurable check-in intervals ensure your assets transfer smoothly without relying on third parties.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-sky-400 tracking-wider uppercase">Architecture & Security</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">Engineered for Trust</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-6 text-xl">🔒</div>
              <h3 className="text-xl font-bold text-white mb-3">Password Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Passwords are hashed and never stored in plain text. Every request is verified with a secure session token.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 text-xl">⏳</div>
              <h3 className="text-xl font-bold text-white mb-3">Dead Man's Switch</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Automated inactivity monitoring checks in periodically and escalates through a warning and grace period before releasing access.</p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 text-xl">🤝</div>
              <h3 className="text-xl font-bold text-white mb-3">Nominee Verification</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Each nominee is verified with their own password before they can access a released vault.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-sky-400 tracking-wider uppercase">Questions & Answers</h2>
            <p className="mt-3 text-3xl font-extrabold text-white">Frequently Asked Questions</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-semibold text-white">Who can see my stored vault items?</h3>
              <p className="mt-2 text-sm text-slate-400">Only you, while your account is active. Your nominee can view them only after your account has been released.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-semibold text-white">What happens if I forget to check in?</h3>
              <p className="mt-2 text-sm text-slate-400">Your account moves through a warning stage and a grace period before being released, giving you time to check in and cancel the process.</p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-lg font-semibold text-white">What if I forget my password?</h3>
              <p className="mt-2 text-sm text-slate-400">Currently, password recovery isn't automated in this version — this is listed as a planned improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-sm">🔒</div>
            <span className="font-bold text-lg text-white">LegacyVault</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
            <a href="#impact" className="hover:text-white transition-colors">Security Model</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <p className="text-xs text-slate-500">&copy; 2026 LegacyVault.</p>
        </div>
      </footer>

    </div>
  )
}

export default Home