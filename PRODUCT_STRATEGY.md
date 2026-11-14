# App Idea Store: product strategy

Written 14 November 2026, from a walkthrough of the app running at `http://localhost:5173` (branch `feat/idea-store-app`, commit `57d5ca7`), a read of the code, and competitor research done the same day.

## The answer in one paragraph

In 30 days, stop selling a catalog of ideas and start selling **openings**: specific, dated gaps in the App Store that a solo developer can ship in a month, each with the receipts (the incumbent apps, what their 1–2 star reviews complain about, who just entered the charts, which TestFlight betas are filling up). Give the weekly radar away free. Charge **$29 for a Build Brief** (the opening turned into a spec a coding agent can start from) and **$79 a year for a Builder Pass** (every opening in full, a watchlist with alerts, MCP access). Sell it first to indie iOS developers and Academy peers you can reach directly. Whether they will pay is not established; section 7 says how to find out in two weeks for almost no build cost.

What I could not check: Google sign-in, account sync and the MCP server did not run in this local session, because the backend on port 8787 was not answering (the Sign in button showed "Sign-in works on the deployed app, not in this preview"). I also had no traffic figures for appidea.store.

---

## 1. Current product audit

### What exists

| Part | What it really is |
|---|---|
| Idea library | 77 concepts hand-written in `shared/ideas.ts`. Each has a pitch, problem, job, three features, tech, platforms, effort and business model. |
| Search and filters | Keyword match over those 77 entries, plus category chips. |
| Idea detail | A modal of about 60 words, with four related ideas. |
| Constellation | A force graph of saved ideas, grouped by category, problem or technology. |
| Synthesis | Rule-based counting over saved ideas, run in the browser. No model involved. |
| TestFlight band | A counter and two rows of app names, from a bundled snapshot dated 8 November. |
| Accounts | Google sign-in, saved ideas synced to D1. Built; not exercised today. |
| MCP server | Seven tools over the same 77 ideas and the user's saves. Built; not exercised today. |
| Pricing | Three cards. Pro ($12/month) and Idea Kit ($19) both say "Coming soon". |

### Critical weaknesses, in order of commercial damage

1. **The headline promise is untrue.** The hero says "77 app ideas, each with the evidence behind it." No idea has any evidence: there is no evidence field in the data. The Pro card then sells "Full evidence on every idea". The first visitor who clicks through to check will not trust anything else on the site, and this audience checks.

2. **There is nothing here ChatGPT cannot produce in one prompt.** "Give me 77 app ideas with audience, problem and three features" returns the same shape of content for free. The ideas are well written, but they are opinions without proof, and the count never grows.

3. **No way to register intent to pay.** Both paid buttons are dead. There is no email capture, no waitlist, no pre-order. Every interested visitor today leaves without a trace, so nothing is being learned about demand.

4. **No reason to come back.** Nothing changes between visits. The one live asset, the App Store and TestFlight data the old Worker collects every few hours, appears only as a number on the landing page. That band says "Checked hourly… last on Nov 8", which was five days stale when I looked, because the local build falls back to the bundled file.

5. **The idea page is a dead end.** The landing page's fourth step is "Take the brief into Claude or Cursor and start", but an idea page has no brief, no copy button, no competitors, no links out. The only action is Save.

6. **Search dead-ends.** "dog walking" returns "0 ideas" and a clear button. With 77 entries most real queries will miss. The header also reads "0 ideas ranked by what you saved", which is wrong when nothing is saved.

7. **Synthesis is thin and sometimes wrong.** On the ten sample ideas it reported "6 of your ideas use Widgets" and an "intersection" labelled Health and Finance built from Voice Journal, Spend Mood and Breath Break. It is counting tags. The page itself admits the result is "not market demand". Any assistant does this better from a pasted list.

8. **Pages cannot be found or shared.** Everything is a hash route in a single-page app, so no idea has an indexable URL or a share preview. The older build had server-rendered idea and category pages and seven blog posts; this one proxies the blog only. That removes the main free acquisition channel.

9. **Rendering problems.** The hero was blank for roughly five seconds on first load. Several library cards render with a large empty top half (Someday Shelf, Weekly Review Coach) and one clips its pitch (Deep Link Desk). The constellation fills about a quarter of the screen with very small labels. Saving gave me no visible confirmation, and the constellation afterwards said nothing was saved; I could not tell whether that was my automated clicks or a bug, so test it by hand.

### What is worth keeping

- **The look.** Paper, ink and vermilion with the hand-drawn "a" is distinctive and nothing in this category looks like it.
- **"Steal the job, not the app."** The job line on each idea is the sharpest piece of content on the site.
- **The data pipeline nobody sees.** The catalog Worker already pulls new releases across stores into a 30-day archive, per-genre top charts (grossing, free, paid), and the open/full status of 464 public TestFlight betas. A build report also describes daily history tables; confirm those are deployed, because history is the asset.
- **The plumbing.** Accounts, D1, entitlement table and a working MCP server are the hard parts of charging money, and they are done.

---

## 2. Competitor analysis

Prices are as reported by the sources linked, on the dates they give.

| Product | What it sells | Price | Weakness |
|---|---|---|---|
| [IdeaBrowser](https://preuve.ai/blog/best-saas-idea-finder-tools-2026) | About 1,000 written-up startup ideas, a free Idea of the Day | $499, $1,499 or $2,999 a year, annual only | General startup ideas, not iOS. An independent review calls the data stale. |
| [BigIdeasDB](https://bigideasdb.com/bigideasdb-vs-businessideasdb) | Complaints mined from Reddit, G2, Capterra and app stores | $29–$349 one-time, or $49/month | Raw complaints; you do the thinking. Mostly B2B software. |
| [Exploding Topics](https://bigideasdb.com/exploding-topics-alternative) | Rising search trends | $39, $99, $249 a month | Shows attention, not a problem to solve. |
| [RightIdea](https://www.producthunt.com/posts/1185268) | On-demand report: low-star reviews, Reddit, search volume | 1 free, then $19 for 3 | You must already have the idea. One-off. |
| [IdeaProbe](https://scour.ing/p/https://ideaprobe.io) | Go / caution / no-go report on your app idea | First free, then $9 each | Same: point-in-time, bring your own idea. |
| [Niches Hunter](https://trustmrr.com/startup/niches-hunter) | Tracks 40,000+ iOS apps daily, surfaces niches | Free, or $29 lifetime | See below. |
| [Astro](https://trysonar.app/blog/astro-aso-pricing), [Sonar](https://trysonar.app/blog/astro-aso-pricing), [Appfigures](https://toolradar.com/tools/appfigures) | Keyword and analytics tools | $108/year; $19/month; from $9.99/month | For apps that already exist. |
| [Departures](https://ios.gadgethacks.com/how-to/try-upcoming-apps-features-and-iaps-your-iphone-for-free-before-they-hit-app-store-0384962) | TestFlight directory with open/full status | Free to browse | Built for testers, not for builders reading it as a signal. |
| ChatGPT, Claude | Any idea, instantly | Free | No dated data, no links you can verify. |

Three things this tells us:

- **The closest competitor earns very little.** Niches Hunter does roughly what a "radar for iOS niches" would do, and its verified revenue is $7,721 in total with $80 a month recurring and about 146 users (TrustMRR, last updated 6 June 2026). Data alone, at this price, in this niche, is not a business. Plan for that.
- **This audience buys one-off and lifetime, not monthly.** BigIdeasDB, RightIdea, IdeaProbe and Niches Hunter all lead with one-time prices, and IdeaProbe advertises "no subscription" as a feature. The $12/month Pro card is the wrong shape.
- **Everyone sells a lookup.** Each product answers "is my idea good?" or "here is a database" at one moment in time. None that I found leads with what changed this week, uses pre-launch signals, or hands over something you can start building from. BigIdeasDB and Sonar do offer a Claude connection, so MCP by itself is not unique.

The tailwind is real: new subscription apps launching each month rose from about 2,000 in January 2022 to more than 14,700 by January 2026, per [RevenueCat's 2026 report](https://www.subscriptioninsider.com/article-type/news/revenuecat-data-shows-subscription-app-growth-concentrating-at-the-top). The same report says apps launched before 2020 still take 69% of subscription revenue. More people than ever are choosing what to build, and most of them will pick badly.

---

## 3. Three positioning options

### Option A: the pre-launch radar

- **Customer:** indie iOS developers who already ship and want the next app.
- **Problem:** by the time a niche shows up in a "top niches" post, it is crowded.
- **Promise:** see what is being built and what is breaking into the charts before everyone else.
- **Advantage:** a time series (chart entries, beta fill rates) that a newcomer cannot backfill and a prompt cannot produce.
- **Money:** annual pass.
- **Risk:** this is Niches Hunter's pitch, and it earns $80 a month. Signals without a conclusion are homework.

### Option B: build-ready openings (recommended)

- **Customer:** developers who can ship in a weekend to a month but do not know what to ship. That includes Academy learners and the growing group building with Claude Code or Cursor.
- **Problem:** choosing is the hard part, and validation takes hours per idea across review pages, Reddit and charts.
- **Promise:** each week, ten openings with receipts, and for any one of them a brief your coding agent can start from.
- **Advantage:** the radar's data, plus judgement (the job to steal, the scope, the App Review traps you have hit yourself), plus a deliverable that ends in a running project.
- **Money:** one-time Build Briefs, and an annual pass.
- **Risk:** briefs must be good enough that buyers ship. Writing ten solid openings a week is real work until it is partly automated.

### Option C: the build cohort

- **Customer:** first-time builders who want accountability.
- **Problem:** they start and never ship.
- **Promise:** pick an opening, ship to TestFlight in 30 days with a group.
- **Advantage:** your Academy network and your own shipping record on X.
- **Money:** $99–$199 a seat.
- **Risk:** it is a service. It takes your evenings and does not grow without you.

### Recommendation: B, with A as its free front door

A alone has evidence against it. C is a good test of demand and a possible later tier, but it is not a product. B is the only option where the buyer leaves with something they could not get from a free tool: a chosen, evidenced, scoped thing to build. The radar becomes the free weekly habit that feeds it.

**The line:** *Ten openings a week in the App Store, each with the receipts, and a build brief your coding agent can start from.*

**Why not just ask ChatGPT:** it cannot know which apps entered the Finance top 200 this week, which betas went from open to full in three days, or how many of an incumbent's last 200 reviews complain about the same thing. Every claim on an opening links to its source.

This is a hypothesis. Nobody has yet paid for it.

---

## 4. Ranked feature opportunities

Ratings are 1–5. Score is impact × confidence ÷ effort; build in score order.

| # | Feature | Type | Impact | Confidence | Effort | Score |
|---|---|---|---|---|---|---|
| 1 | Email capture and pre-order buttons | Monetization | 5 | 5 | 1 | 25 |
| 2 | Openings with a proof panel | Core | 5 | 4 | 3 | 6.7 |
| 3 | Weekly radar email and "This week" page | Retention | 4 | 4 | 2 | 8 |
| 4 | Real, indexable pages with share cards | Growth | 4 | 4 | 2 | 8 |
| 5 | Build Brief | Monetization | 5 | 3 | 3 | 5 |
| 6 | Niche watchlist with alerts | Retention | 4 | 3 | 3 | 4 |
| 7 | "Check my idea" against our data | Core | 4 | 3 | 4 | 3 |
| 8 | Shipped wall | Growth | 3 | 3 | 2 | 4.5 |
| 9 | Niche map (replaces constellation) | Core | 3 | 3 | 4 | 2.3 |

**1. Email capture and pre-orders.** Replace both "Coming soon" buttons with a Stripe payment link, and add one email field under the hero. It solves our problem, not the user's: we learn who wants this. An afternoon of work.

**2. Openings with a proof panel.** An opening is a page with a dated claim (an invented example of the format: "Medication reminders: the three leaders average 4.6 stars, yet 31 of the last 200 low-star reviews across them are about missed alerts on Apple Watch") and the panel that proves it: incumbent apps with rating and review count, complaint clusters with counts and links to the reviews, chart movement for the category, related TestFlight betas and their status. Then the job to steal, the scope, and what would make it fail. It replaces four hours of tab-hopping. A prompt cannot replace it because the counts and dates come from stored snapshots. Medium effort: review fetching and clustering are new; the rest is data we already collect. Start by writing ten by hand.

**3. Weekly radar.** One email and one page every Monday: ten new openings, what moved, which betas filled. Three shown in full to everyone. This is the reason to return and the main acquisition asset. Low effort once openings exist.

**4. Real pages.** Server-render each opening and category at its own URL with a share image. Each one targets a search like "habit tracker app competitors" and makes an X post worth clicking. This brings back what the old build had. Low to medium effort in the existing Worker.

**5. Build Brief.** For one opening: a short product spec, screens, data model, the SwiftUI and Apple frameworks to use, a paywall plan, a first keyword set, an App Review risk list, and a `CLAUDE.md` so a coding agent can scaffold the project. Delivered as a download and through the MCP server. The buyer goes from "interesting" to a running Xcode project in an evening. The evidence and the review-risk notes are what a generic prompt lacks. Medium effort; the first ten are written by hand with model help.

**6. Niche watchlist.** Follow a category or a set of apps; get an alert when a new entrant charts, an incumbent's rating drops, or a beta opens. This matters most *after* someone has picked an idea, which is exactly when an idea product normally loses them. Medium effort, needs the history tables.

**7. Check my idea.** Type an idea, get our stored data for that space. RightIdea and IdeaProbe already sell this for $9–$19, so it is a free feature that leads to a Brief, not a product.

**8. Shipped wall.** Apps built from an opening, with the builder's X handle. Proof for buyers, a reason for builders to post about us.

**9. Niche map.** Covered in section 6.

Cut or demote: the synthesis panel (move behind the watchlist, or remove), the 77-idea count as a headline, and "MCP access" as a paid bullet until the MCP serves something worth paying for.

---

## 5. Monetization and pricing

| | Free | Build Brief | Builder Pass |
|---|---|---|---|
| Price | $0 | $29 once | $79 a year (founding price) |
| Weekly radar | 3 of 10 openings in full | n/a | All 10, plus the archive |
| Proof panels | On the free 3 | For that opening | All |
| Briefs | Sample brief | One | Three a year included |
| Watchlist alerts | One niche | n/a | Unlimited |
| MCP | Search only | That brief | Everything |

- **Why these shapes.** One-time and annual match what this audience already buys (section 2). A monthly plan invites the obvious behaviour: subscribe, pick an idea, cancel.
- **Why someone upgrades.** They have read an opening they want to build and the Brief saves them a week. Or they have hit the seven locked openings three weeks running.
- **The moment to ask.** At the bottom of a free opening's proof panel, after they have seen the receipts: "Get the build brief, $29". Never before the evidence.
- **Showing value first.** Three full openings every week and one complete sample brief, free, with no sign-in.
- **Avoiding one-and-done.** The weekly email before they pick; the watchlist on their niche after.

### Revenue scenarios (hypotheses, not forecasts)

Monthly figures. Assumptions: visitors arrive from X, search and the newsletter; a share give an email; of those, a share buy a Brief and a share buy a Pass.

| | Visitors | Email rate | Signups | Brief buyers | Pass buyers | Revenue |
|---|---|---|---|---|---|---|
| Conservative | 1,000 | 5% | 50 | 2% → 1 | 1% → 0.5 | about $68 |
| Base | 4,000 | 8% | 320 | 4% → 13 | 2% → 6 | about $877 |
| Optimistic | 12,000 | 10% | 1,200 | 5% → 60 | 3% → 36 | about $4,584 |

For comparison only, the median freemium app converts about 2.1% of downloads to paid ([RevenueCat 2026](https://revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)); that is apps, not web tools.

Two honest readings:

- At the base rate the funnel produces about 19 customers a month, so **100 customers takes around five months** by organic traffic alone. Reaching 100 in 30 days means selling directly: Academy cohorts, your X audience, a pre-sale.
- 100 customers is $2,900 to $7,900. A real income needs something like 1,000 Pass holders ($79,000 a year). That is a distribution problem more than a product one.

None of these rates is validated. Annual renewal is unknown and is the number that decides whether this is a business.

---

## 6. UX and UI transformation

Keep the paper, ink and vermilion, the brush marks, and the handwritten job line. Change what the craft is spent on.

- **Hero.** Replace the card piles with this week's top opening, live: the claim in large type, its proof panel assembling beside it. The first screen should show the product, and it must paint in under two seconds with a static fallback.
- **The opening page.** A long editorial page, not a modal. Claim, then receipts, then job, then scope. Each receipt is a small chart you can read at a glance: a chart-rank sparkline, complaint clusters as bars with the review count, a beta timeline showing open → full.
- **Niche map in place of the constellation.** Plot the apps in one category: size by review count, colour by rating, pulled toward the complaint themes they share. The empty region is the opening. This is where motion and WebGL earn their place, because it turns a table into something you can see in a second.
- **Radar as a timeline.** The library becomes a dated feed, newest week first, so the site visibly changes.
- **One orchestrated moment per page.** The proof panel building itself is the animation. Drop scroll reveals on every section.
- **Fix now:** the blank hero, half-empty cards, clipped text, the tiny constellation, missing save feedback, the wrong "ranked by what you saved" header, and the search dead end (show nearest openings and a "request this niche" email field).

---

## 7. Validation experiments

The five riskiest assumptions, most dangerous first.

| # | Assumption | Test | Audience | Success | If it fails |
|---|---|---|---|---|---|
| 1 | Builders will pay for a Brief when ChatGPT is free | Hand-write 3 openings and 1 Brief. Sell the Brief at $19 via a payment link. | Academy peers, your X followers, r/iOSProgramming | 15 paid from 500 visitors in 14 days (3%) | Make Briefs the free lead magnet; test the cohort (Option C) at $99 |
| 2 | A weekly radar brings people back | Send four weekly issues to whoever signs up | Email list | 45% open and 25% click by issue four | Try one "opening of the day"; if that fails too, drop the feed |
| 3 | Our signals find openings an experienced dev would not already know | Show 10 openings blind to 5 indie devs who have shipped | Direct asks | At least 4 of 10 rated "I would consider building this" by most of them | The edge is curation, not data: sell fewer, deeper write-ups |
| 4 | People will prepay for a year | Pass button at $79 leading to real checkout | Signups from tests 1–2 | 2% of signups reach checkout, 30% of those pay | Sell Brief packs (3 for $59) only |
| 5 | A watchlist keeps buyers after they pick | Offer every Brief buyer a manual weekly note on their niche | Brief buyers | 40% opt in, half still opening at week four | Retention is not coming from here; price for one-off value |

Count payments and replies, not likes or signups. Experiment 1 is the gate: if fewer than five people pay, do not build the roadmap in section 8 past the first block.

---

## 8. Implementation roadmap

### Immediate (1–3 days)

- **Deliver:** truthful hero copy; email capture; payment links on both paid cards; fixes for the blank hero, broken cards, search dead end and save feedback; the TestFlight band reading live data.
- **Depends on:** a Stripe account and an email tool.
- **Technical:** copy and CSS, one new table for emails, the existing `/api/signals/testflight` route.
- **Success:** the site makes no claim it cannot back; at least one email captured per 20 visitors.

### MVP differentiation (1–2 weeks)

- **Deliver:** ten hand-built openings with proof panels at real URLs; the first weekly issue; one sample Brief; share images.
- **Depends on:** a script that pulls recent reviews for a set of app IDs and clusters low-star ones; the chart and beta snapshots.
- **Technical:** server-rendered routes in the Worker; an `openings` table; review fetching kept within Apple's public feeds.
- **Success:** 5 of 10 openings pass experiment 3; 100 emails.

### Monetization validation (2–4 weeks)

- **Deliver:** Brief checkout and delivery (download plus MCP); Pass checkout; experiments 1, 2 and 4 run to a decision.
- **Depends on:** Stripe webhooks writing to the existing `entitlement` table.
- **Technical:** gate content on the server, not in the browser.
- **Success:** 15 paid Briefs and 5 Passes, or a clear no.

### Long-term moat (1–3 months)

- **Deliver:** daily history of charts, ratings and beta status for every tracked app; automated opening candidates ranked for your review; watchlist alerts; the niche map; the shipped wall.
- **Depends on:** the history tables running in production from now. Each day not stored is a day no one can recover.
- **Technical:** D1 size limits; move old history to R2.
- **Success:** 40% of Pass holders open the radar in a given week; at least 3 apps on the shipped wall.

What compounds: the stored history, the archive of openings and how they played out, and the list of people who shipped from one.

---

## 9. The five changes to make first

1. **Fix the claim.** Change "each with the evidence behind it" today, and remove "Full evidence on every idea" until it is true.
2. **Take money and emails.** Replace "Coming soon" with a payment link and add an email field.
3. **Write ten real openings by hand**, with linked receipts, and one sample Brief.
4. **Turn on history.** Confirm the daily chart and beta history is being stored in production.
5. **Give every opening a URL** that search engines and X previews can read.

---

## 10. Why this could become a sustainable business

- **The market is growing.** Seven times more subscription apps launch each month than four years ago, and coding agents keep lowering the cost of building, which moves the bottleneck to choosing.
- **The asset is hard to copy late.** A daily record of charts, ratings and beta status cannot be rebuilt after the fact.
- **The costs are tiny.** It runs on one Worker, one database and public feeds.
- **You have a way in.** An Academy network of people deciding what to build, and an X account whose content pillar ("what's worth building") is the product.

And why it might not: the nearest competitor makes $80 a month, buyers in this niche resist recurring payments, most of your customers' apps will fail whatever you tell them, and Apple's public feeds can change. The plan above is built to find out cheaply which of those is fatal before any of the expensive parts get built.

---

## Sources

- [Best SaaS Idea Finder Tools 2026, Preuve AI](https://preuve.ai/blog/best-saas-idea-finder-tools-2026)
- [IdeaBrowser review, Preuve AI](https://preuve.ai/compare/ideabrowser)
- [BigIdeasDB vs Business Ideas DB](https://bigideasdb.com/bigideasdb-vs-businessideasdb)
- [Exploding Topics alternative, BigIdeasDB](https://bigideasdb.com/exploding-topics-alternative)
- [BigIdeasDB review, MakerStack](https://makerstack.co/reviews/bigideasdb-review/)
- [RightIdea on Product Hunt](https://www.producthunt.com/posts/1185268)
- [IdeaProbe](https://scour.ing/p/https://ideaprobe.io)
- [Niches Hunter on TrustMRR](https://trustmrr.com/startup/niches-hunter)
- [Niches Hunter on Product Hunt](https://www.producthunt.com/products/niches-hunter-2/launches)
- [Astro ASO pricing, Sonar](https://trysonar.app/blog/astro-aso-pricing)
- [Appfigures pricing, Toolradar](https://toolradar.com/tools/appfigures)
- [TestFlight directories, Gadget Hacks](https://ios.gadgethacks.com/how-to/try-upcoming-apps-features-and-iaps-your-iphone-for-free-before-they-hit-app-store-0384962)
- [RevenueCat 2026 benchmarks](https://revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)
- [RevenueCat report coverage, Subscription Insider](https://www.subscriptioninsider.com/article-type/news/revenuecat-data-shows-subscription-app-growth-concentrating-at-the-top)
