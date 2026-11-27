'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import type { PollMode, PublicPoll } from '@/lib/types'
import { ChamberHeader, Chyron, useCalendarDate } from './chamber'

const MAX_RECENT = 10
// The browser cannot observe server-side idle-TTL refreshes, so expire this
// convenience list at the initial 30-day boundary rather than showing stale keys.
const RECENT_LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000
const RECENT_KEY = 'whatitdo:recent-polls:v2'
const LEGACY_PRIVATE_RESULTS_KEY = 'whatitdo:private-results:v1'

const PLACEHOLDERS: Record<PollMode, string[]> = {
  normal: ['get tacos and actually show up', 'host game night at my place', 'go see the movie everybody spoiled'],
  dubious: ['hit the Waffle House at 3 a.m.', 'drive to the beach right now', 'text the ex "you up?" as a group'],
}

interface RecentPoll {
  title: string
  voteUrl: string
  createdAt: number
  expiresAt: number
}

interface CreatedPoll extends RecentPoll {
  resultsUrl: string
}

function parseRecentPoll(value: unknown): RecentPoll | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.title !== 'string' || typeof item.voteUrl !== 'string'
    || typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt)
    || typeof item.expiresAt !== 'number' || !Number.isFinite(item.expiresAt)
    || item.expiresAt <= Date.now()) return null

  try {
    const voteUrl = new URL(item.voteUrl)
    if (voteUrl.origin !== window.location.origin || voteUrl.username || voteUrl.password
      || voteUrl.search || voteUrl.hash || !/^\/vote\/[A-Za-z0-9_-]{10}$/.test(voteUrl.pathname)) return null
    return {
      title: item.title,
      voteUrl: `${voteUrl.origin}${voteUrl.pathname}`,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
    }
  } catch {
    return null
  }
}

function readRecentPolls(): RecentPoll[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(parseRecentPoll)
      .filter((item): item is RecentPoll => item !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

export default function Home() {
  const [mode, setMode] = useState<PollMode>('dubious')
  const [title, setTitle] = useState('')
  const [suggestions, setSuggestions] = useState(['', '', ''])
  const [created, setCreated] = useState<CreatedPoll | null>(null)
  const [recent, setRecent] = useState<RecentPoll[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'vote' | 'results' | ''>('')
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const createdTitleRef = useRef<HTMLHeadingElement | null>(null)
  const shouldFocusCreatedTitle = useRef(false)
  const calendarDate = useCalendarDate()

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const cleaned = readRecentPolls()
      setRecent(cleaned)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(cleaned))
      } catch {
        // Private browsing and hardened browsers may reject storage writes.
        // Recent links are only a convenience; the app remains usable without them.
      }
    }, 0)
    return () => {
      window.clearTimeout(hydrationTimer)
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!created || !shouldFocusCreatedTitle.current) return
    shouldFocusCreatedTitle.current = false
    createdTitleRef.current?.focus()
  }, [created])

  function updateSuggestion(index: number, value: string) {
    setSuggestions((current) => current.map((suggestion, i) => (i === index ? value : suggestion)))
    setError('')
  }

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const filled = suggestions.map((item) => item.trim()).filter(Boolean)
    if (!filled.length) {
      setError('A bill needs at least one section. Give the chat something to vote on.')
      return
    }

    setCreating(true)
    setError('')
    try {
      const response = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || (mode === 'dubious' ? 'The Highly Questionable Plans Act' : 'The What It Do Act'),
          suggestions: filled,
          mode,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as {
        id?: string
        resultsToken?: string
        poll?: PublicPoll
        error?: string
      }
      if (!response.ok || !body.id || !body.resultsToken || !body.poll) {
        const fallback = response.status === 429
          ? 'The Chair does not recognize you right now. Too many bills too fast. Try again in a minute.'
          : 'The Clerk dropped the bill. Try introducing it again.'
        throw new Error(body.error || fallback)
      }

      const now = Date.now()
      const createdPoll: CreatedPoll = {
        title: body.poll.title,
        voteUrl: `${window.location.origin}/vote/${body.id}`,
        resultsUrl: `${window.location.origin}/results/${body.id}#${body.resultsToken}`,
        createdAt: now,
        expiresAt: now + RECENT_LINK_LIFETIME_MS,
      }
      const recentPoll: RecentPoll = {
        title: createdPoll.title,
        voteUrl: createdPoll.voteUrl,
        createdAt: createdPoll.createdAt,
        expiresAt: createdPoll.expiresAt,
      }
      const next = [recentPoll, ...readRecentPolls().filter((entry) => entry.voteUrl !== recentPoll.voteUrl)]
        .slice(0, MAX_RECENT)
      // The API response is authoritative. Show both links before attempting the
      // optional public-history write so a storage exception cannot hide them.
      shouldFocusCreatedTitle.current = true
      setCreated(createdPoll)
      setRecent(next)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        setError('Your links are below, but this browser would not let us remember the floor pass. Copy the Clerk\u2019s key now.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The Clerk dropped the bill. Try introducing it again.')
    } finally {
      setCreating(false)
    }
  }

  async function copyLink(kind: 'vote' | 'results', value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(''), 1800)
    } catch {
      setError('The clipboard refused to cooperate. Select the link and copy it by hand.')
    }
  }

  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY)
      localStorage.removeItem(LEGACY_PRIVATE_RESULTS_KEY)
    } catch {
      // Keep the rendered state clear even when storage is unavailable.
    }
    setRecent([])
  }

  function reset() {
    setCreated(null)
    setTitle('')
    setSuggestions(['', '', ''])
    setError('')
    setCopied('')
  }

  return (
    <main className="site-shell">
      <Chyron live="LIVE" headline={created ? `FLOOR DEBATE · ${created.title}` : 'THE HOUSE IS IN SESSION · NO QUORUM REQUIRED'} />
      <ChamberHeader right={<span className="session-tag">1st Session<br />of the Group Chat</span>} />

      {created ? (
        <section className="hero-grid success-grid" aria-labelledby="created-title">
          <div className="hero-copy">
            <p className="eyebrow">Referred directly to the floor</p>
            <h1 id="created-title" ref={createdTitleRef} tabIndex={-1}>The bill is <span>on the floor.</span></h1>
            <p className="lede">Send the floor pass to every member of the chat. Keep the Clerk&rsquo;s key to yourself&mdash;it is the only way to see who voted how.</p>
            <button className="text-button" type="button" onClick={reset}>&larr; Introduce another bill</button>
          </div>
          <div className="paper-stack">
            <p className="notice notice-ok" role="status">Your floor pass and the Clerk&rsquo;s private tally link are ready.</p>
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <article className="paper-card pass-card">
              <p className="card-label">Admit all members · Share freely</p>
              <h2>Floor pass</h2>
              <p className="muted">The public voting link. It shows the bill and nothing else&mdash;no names, no remarks, no tally.</p>
              <output className="link-output">{created.voteUrl}</output>
              <div className="button-row">
                <button className="primary-button" type="button" onClick={() => copyLink('vote', created.voteUrl)}>
                  {copied === 'vote' ? 'Copied. Whip the votes.' : 'Copy floor pass'}
                </button>
                <a className="secondary-button" href={`sms:?body=${encodeURIComponent(`You've been called to vote: ${created.title}\n${created.voteUrl}`)}`}>Text it to the chat</a>
              </div>
            </article>
            <article className="paper-card owner-card">
              <p className="card-label hot">Sponsor&rsquo;s eyes only</p>
              <h2>The Clerk&rsquo;s tally</h2>
              <p className="muted">Your private results link. Save it now. Anyone holding this exact link can read every vote and every remark.</p>
              <output className="link-output private-link">{created.resultsUrl}</output>
              <div className="button-row">
                <button className="primary-button red" type="button" onClick={() => copyLink('results', created.resultsUrl)}>
                  {copied === 'results' ? 'Key secured.' : 'Copy the Clerk’s key'}
                </button>
                <Link className="secondary-button" href={created.resultsUrl} prefetch={false}>Open the vote board</Link>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="hero-grid" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">Group decisions, under oath</p>
            <h1 id="home-title">The group chat is <span>now in session.</span></h1>
            <p className="lede">Somebody always says &ldquo;idk, whatever y&rsquo;all want.&rdquo; Not anymore. Introduce the plan as a bill, and every member has to go on the record: yea, nay, or present.</p>
            <ol className="procedure">
              <li><span><b>Introduce</b> the bill. Up to three sections.</span></li>
              <li><span><b>Text the floor pass</b> to the chat. No accounts.</span></li>
              <li><span><b>Watch the board</b> light up. Only you hold the key.</span></li>
            </ol>
          </div>

          <form className="paper-card bill-card" onSubmit={createPoll}>
            <div className="bill-masthead" aria-hidden="true">
              <span>H.R. ____</span>
              <span>{calendarDate || 'In the House of What It Do'}</span>
            </div>
            <p className="bill-a">A BILL</p>
            <p className="bill-purpose">To end the group chat&rsquo;s indecision, and for other purposes.</p>

            <fieldset className="mode-switch">
              <legend>Rules of debate</legend>
              <button type="button" className={mode === 'normal' ? 'active' : ''} aria-pressed={mode === 'normal'} onClick={() => setMode('normal')}>
                Regular order
              </button>
              <button type="button" className={mode === 'dubious' ? 'active dubious' : ''} aria-pressed={mode === 'dubious'} onClick={() => setMode('dubious')}>
                Suspend the rules
              </button>
            </fieldset>
            <p className="mode-caption">{mode === 'dubious' ? 'Members may also vote HELL YEA. For plans that are a bad idea and everyone knows it.' : 'Yea, present, or nay. Respectable. Procedural. Boring on purpose.'}</p>

            <label className="field-label" htmlFor="poll-title">Short title of the bill <span>optional</span></label>
            <input id="poll-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder={mode === 'dubious' ? 'The Absolutely Not Going To Bed Act' : 'The Friday Night Act'} />

            <fieldset className="options-fieldset">
              <legend>Be it enacted by the members of the group chat, that we: <small>1&ndash;3 sections</small></legend>
              {suggestions.map((suggestion, index) => (
                <label className="option-input" key={index} htmlFor={`suggestion-${index}`}>
                  <span>Sec. {index + 1}</span>
                  <input id={`suggestion-${index}`} value={suggestion} maxLength={200} onChange={(event) => updateSuggestion(index, event.target.value)} placeholder={PLACEHOLDERS[mode][index]} />
                </label>
              ))}
            </fieldset>

            {error && <p className="notice notice-error" role="alert" aria-live="assertive">{error}</p>}
            <button className="primary-button jumbo" disabled={creating} type="submit">
              {creating ? 'The Clerk is reading the bill…' : 'Introduce the bill'} <span aria-hidden="true">&rarr;</span>
            </button>
            <p className="fine-print">Bills die in committee after 30 quiet days, 90 at most. No accounts, no profiles, no lobbyists.</p>
          </form>
        </section>
      )}

      {!created && recent.length > 0 && (
        <section className="recent-section" aria-labelledby="recent-heading">
          <div>
            <p className="eyebrow">Remembered by this browser only</p>
            <h2 id="recent-heading">Your bills on the calendar</h2>
          </div>
          <ul className="recent-list">
            {recent.map((item) => (
              <li key={item.voteUrl}>
                <Link href={item.voteUrl} prefetch={false}>
                  <span>{item.title}</span>
                  <small>Introduced {new Date(item.createdAt).toLocaleDateString()} · open the floor &rarr;</small>
                </Link>
              </li>
            ))}
          </ul>
          <button className="text-button danger" type="button" onClick={clearRecent}>Strike these from the calendar</button>
        </section>
      )}
      <footer className="site-footer"><span>CHAT-SPAN · Unedited, uninterrupted, unbothered</span><span>A Skeptical Wombat production</span></footer>
    </main>
  )
}
