import { useEffect } from 'react'
import { CATEGORY_INK } from '@shared/ideas'
import { OPENINGS, OPENING_BY_SLUG, type Opening, type Receipts } from '@shared/openings'
import { href, useRoute } from '../lib/router'
import { BrushTally, effortMarks } from '../components/BrushTally'
import { EmailCapture, PlanButton } from '../components/EmailCapture'
import './openings.css'

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const count = (n: number) => n.toLocaleString()

// One line that sums up the receipts, or says plainly that there are none yet.
function headline(r: Receipts | null): string {
  if (!r) return 'Receipts not collected yet'
  const top = r.themes[0]
  if (!r.reviewsRead) return `${r.incumbents.length} apps found, no recent reviews to read`
  if (!top) return `${r.lowStar} of ${r.reviewsRead} recent reviews are 1–2 stars`
  return `${top.theme}: ${top.count} of ${r.lowStar} recent 1–2 star reviews`
}

export function Openings({ onInk }: { onInk: (c: string) => void }) {
  const route = useRoute()
  const opening = route.name === 'opening' ? OPENING_BY_SLUG.get(route.slug) : undefined
  useEffect(() => { onInk(opening ? CATEGORY_INK[opening.category] : '#fd461a') }, [opening, onInk])
  useEffect(() => { scrollTo(0, 0) }, [route])

  if (route.name === 'opening') {
    return opening ? <OpeningPage o={opening} /> : (
      <main className="page op">
        <p className="op-missing">That opening is not on the list.</p>
        <a className="btn btn-solid" href={href.openings}>See every opening</a>
      </main>
    )
  }

  const withReceipts = OPENINGS.filter((o) => o.receipts).length
  return (
    <main className="page op">
      <header className="op-head">
        <h1><span className="op-count">{OPENINGS.length}</span><span className="op-of">openings in the App Store</span></h1>
        <p className="op-lede">
          An opening is a niche with real apps in it and real complaints about them. The numbers come from Apple’s public search and review feeds.
          {withReceipts < OPENINGS.length && ` ${withReceipts} of ${OPENINGS.length} have receipts so far.`}
        </p>
      </header>
      <ol className="op-list">
        {OPENINGS.map((o) => (
          <li key={o.slug}>
            <a href={href.opening(o.slug)} style={{ ['--pig' as string]: CATEGORY_INK[o.category] }}>
              <span className="op-cat"><span className="dot" />{o.category}</span>
              <strong>{o.title}</strong>
              <span className="op-job hand">“{o.job}”</span>
              <span className="op-sum" data-empty={!o.receipts || undefined}>{headline(o.receipts)}</span>
            </a>
          </li>
        ))}
      </ol>
      <section className="op-radar">
        <h2>Get new openings by email</h2>
        <p>One email when new openings and fresh receipts are ready. No more than weekly.</p>
        <EmailCapture interest="radar" source="openings" cta="Send me openings" done="You are on the list. The next batch will land in your inbox." />
      </section>
    </main>
  )
}

function OpeningPage({ o }: { o: Opening }) {
  const r = o.receipts
  const max = r ? Math.max(1, ...r.themes.map((t) => t.count)) : 1
  return (
    <main className="page op op-page" style={{ ['--pig' as string]: CATEGORY_INK[o.category] }}>
      <a className="op-back" href={href.openings}>All openings</a>
      <header className="op-top">
        <p className="op-cat"><span className="dot" />{o.category}</p>
        <h1>{o.title}</h1>
        <p className="op-job hand">Job to steal: “{o.job}”</p>
      </header>

      <div className="op-grid">
        <section className="op-proof" aria-labelledby="op-proof-title">
          <h2 id="op-proof-title">The receipts</h2>
          {!r ? (
            <div className="op-none">
              <p><strong>Not collected yet.</strong> This opening has no App Store data behind it so far, so treat it as a hunch.</p>
              <p>The receipts are the top apps for “{o.term}”, their ratings, and what their recent 1–2 star reviews complain about.</p>
            </div>
          ) : (
            <>
              <h3>Who is already here</h3>
              <div className="op-table-wrap">
                <table className="op-table">
                  <thead><tr><th scope="col">App</th><th scope="col">Rating</th><th scope="col">Ratings</th><th scope="col">Price</th><th scope="col">Last update</th></tr></thead>
                  <tbody>
                    {r.incumbents.map((a) => (
                      <tr key={a.id}>
                        <th scope="row"><a href={a.url} target="_blank" rel="noopener">{a.name}</a><small>{a.seller}</small></th>
                        <td>{a.rating ?? 'n/a'}</td>
                        <td>{count(a.ratings)}</td>
                        <td>{a.price || 'n/a'}</td>
                        <td>{a.updated ? day(a.updated) : 'n/a'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3>What unhappy users say</h3>
              {r.reviewsRead === 0 ? (
                <p className="op-note">Apple’s feed returned no recent reviews for these apps.</p>
              ) : (
                <>
                  <p className="op-note">
                    {r.lowStar} of the {r.reviewsRead} most recent reviews of the top three apps gave 1–2 stars. These are the subjects they mention. A review can count under more than one.
                  </p>
                  {r.themes.length ? (
                    <ul className="op-themes">
                      {r.themes.map((t) => (
                        <li key={t.theme}>
                          <span>{t.theme}</span>
                          <span className="op-bar"><i style={{ width: `${(t.count / max) * 100}%` }} /></span>
                          <b>{t.count}</b>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="op-note">None of them matched a known complaint subject.</p>}
                </>
              )}
              <p className="op-source">
                Collected {day(r.collectedAt)} from the US App Store: search results for “{o.term}” ranked by rating count, and Apple’s customer review feed. Subjects are matched by keyword in English, so read them as a guide and check the reviews yourself.
              </p>
            </>
          )}
        </section>

        <aside className="op-side">
          <section className="op-read">
            <h2>Our read</h2>
            <p>{o.read}</p>
            <small>This part is an opinion, not data.</small>
          </section>
          <section className="op-brief">
            <h2>Build brief</h2>
            <p>The opening as a spec: screens, data model, Apple frameworks, paywall plan, first keywords, App Review risks and a file your coding agent can start from.</p>
            <PlanButton plan="brief" label="Get the brief, $29" source="opening" note={o.slug} tone="red" />
          </section>
          {o.ideas.length > 0 && (
            <section className="op-ideas">
              <h2>Concepts to start from</h2>
              <ul>
                {o.ideas.map((i) => (
                  <li key={i.id}>
                    <a href={href.idea(i.id)}>
                      <BrushTally count={effortMarks(i.effort)} size={28} />
                      <span><strong>{i.title}</strong><em>{i.pitch}</em></span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}
