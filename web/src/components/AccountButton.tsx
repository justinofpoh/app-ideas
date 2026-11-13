import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { account, useAccount } from '../lib/store'
import { ease } from '../lib/motion'

const G = (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)

export function AccountButton() {
  const { user, plan, backend } = useAccount()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false)
    }
    addEventListener('mousedown', close)
    addEventListener('keydown', close)
    return () => { removeEventListener('mousedown', close); removeEventListener('keydown', close) }
  }, [open])

  const signIn = async () => {
    setNote('')
    if (backend === 'absent') { setNote('Sign-in works on the deployed app, not in this preview.'); setOpen(true); return }
    try { await account.signIn() } catch (e) { setNote(`${(e as Error).message}. Try again.`); setOpen(true) }
  }
  const mcpUrl = `${location.origin}/mcp`
  const copy = async () => {
    try { await navigator.clipboard.writeText(mcpUrl); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* clipboard blocked */ }
  }

  return (
    <div className="acct" ref={root}>
      {user ? (
        <button className="acct-avatar" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label={`Account: ${user.name}`}>
          {user.image ? <img src={user.image} alt="" referrerPolicy="no-referrer" /> : <span>{user.name.charAt(0)}</span>}
        </button>
      ) : (
        <button className="acct-signin" onClick={signIn} disabled={backend === 'checking'}>
          {G}<span>Sign in</span>
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="acct-panel"
            role="dialog"
            aria-label="Account"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: ease.lift }}
          >
            {user ? (
              <>
                <p className="acct-name">{user.name}</p>
                <p className="acct-mail">{user.email}</p>
                <p className="acct-plan">{plan === 'pro' ? 'Pro plan' : 'Free plan'}. Your saved ideas sync to this account.</p>
                <div className="acct-mcp">
                  <p>Use your ideas in Claude, Cursor or any MCP client: add this as a custom connector.</p>
                  <div className="acct-copy">
                    <code>{mcpUrl}</code>
                    <button onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
                  </div>
                </div>
                <button className="btn" onClick={() => { account.signOut(); setOpen(false) }}>Sign out</button>
              </>
            ) : (
              <p className="acct-note">{note}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
