import { useId, useState, type FormEvent } from 'react'
import { subscribe, useConfig, type Interest } from '../lib/subscribe'
import './email.css'

interface Props {
  interest: Interest
  source: string
  note?: string
  cta: string
  done: string
  tone?: 'paper' | 'ink' | 'red'
}

export function EmailCapture({ interest, source, note, cta, done, tone = 'paper' }: Props) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (website) { setState('done'); return }
    setState('sending'); setError(null)
    const err = await subscribe(email, interest, source, note)
    if (err) { setError(err); setState('idle') } else setState('done')
  }

  if (state === 'done') return <p className={`ec-done ec-${tone}`} role="status">{done}</p>
  return (
    <form className={`ec ec-${tone}`} onSubmit={send} noValidate>
      <label className="sr-only" htmlFor={id}>Email address</label>
      <input id={id} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby={error ? `${id}-err` : undefined} aria-invalid={!!error} />
      <input className="ec-hp" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} />
      <button className="btn" disabled={state === 'sending' || !email}>{state === 'sending' ? 'Sending' : cta}</button>
      {error && <p className="ec-err" id={`${id}-err`} role="alert">{error}</p>}
    </form>
  )
}

// A paid plan's button: goes to checkout once a payment link exists, and until
// then takes an email so the first buyers can be told when it opens.
export function PlanButton({ plan, label, source, note, tone }: { plan: 'brief' | 'pass'; label: string; source: string; note?: string; tone?: Props['tone'] }) {
  const { briefLink, passLink } = useConfig()
  const [open, setOpen] = useState(false)
  const link = plan === 'brief' ? briefLink : passLink
  if (link) return <a className="btn btn-plan" href={link} target="_blank" rel="noopener">{label}</a>
  if (!open) return <button className="btn btn-plan" onClick={() => setOpen(true)}>{label}</button>
  return (
    <div className="plan-wait">
      <p>Not on sale yet. Leave your email and you will get the first-buyer price when it opens.</p>
      <EmailCapture interest={plan} source={source} note={note} cta="Tell me" done="You are on the list. We will email you when it opens." tone={tone} />
    </div>
  )
}
