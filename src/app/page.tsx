'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useRef, useState } from 'react'
import type { PollMode, PublicPoll } from '@/lib/types'

const MAX_RECENT = 10
// The browser cannot observe server-side idle-TTL refreshes, so expire this
// convenience list at the initial 30-day boundary rather than showing stale keys.
const RECENT_LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000
const RECENT_KEY = 'whatitdo:private-results:v1'

const PLACEHOLDERS: Record<PollMode, string[]> = {
  normal: ['Try the tiny dumpling spot', 'Go stargazing Friday', 'Host a game night'],
  dubious: ['Send the mysterious text', 'Take a midnight road trip', 'Book the wildly unnecessary getaway'],
}

interface RecentPoll {
  title: string
  voteUrl: string
  resultsUrl: string
  createdAt: number
  expiresAt: number
}

function readRecentPolls(): RecentPoll[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as RecentPoll[]
    return parsed
      .filter((item) => item && typeof item.resultsUrl === 'string' && item.expiresAt > Date.now())
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
  const [created, setCreated] = useState<RecentPoll | null>(null)
  const [recent, setRecent] = useState<RecentPoll[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'vote' | 'results' | ''>('')
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function updateSuggestion(index: number, value: string) {
    setSuggestions((current) => current.map((suggestion, i) => (i === index ? value : suggestion)))
    setError('')
  }

  async function createPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const filled = suggestions.map((item) => item.trim()).filter(Boolean)
    if (!filled.length) {
      setError('Give the group at least one possibility to deliberate.')
      return
    }

    setCreating(true)
    setError('')
    try {
      const response = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || (mode === 'dubious' ? 'A Highly Questionable Proposal' : 'What It Do?'),
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
          ? 'The idea machine needs a breather. Try again in a minute.'
          : 'The poll would not materialize. Try again.'
        throw new Error(body.error || fallback)
      }

      const now = Date.now()
      const item: RecentPoll = {
        title: body.poll.title,
        voteUrl: `${window.location.origin}/vote/${body.id}`,
        resultsUrl: `${window.location.origin}/results/${body.id}#${body.resultsToken}`,
        createdAt: now,
        expiresAt: now + RECENT_LINK_LIFETIME_MS,
      }
      const next = [item, ...readRecentPolls().filter((entry) => entry.resultsUrl !== item.resultsUrl)]
        .slice(0, MAX_RECENT)
      // The API response is authoritative. Show both links before attempting the
      // optional browser-history write so a storage exception cannot hide them.
      setCreated(item)
      setRecent(next)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        setError('Your links are visible, but we could not save it in this browser. Copy the private link now.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The poll would not materialize. Try again.')
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
      setError('Clipboard access fizzled. Select the link and copy it manually.')
    }
  }

  function clearRecent() {
    try {
      localStorage.removeItem(RECENT_KEY)
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
      <div className="ambient-doodles" aria-hidden="true"><span>✦</span><span>↝</span><span>☻</span></div>
      <header className="brand-header">
        <Link href="/" className="brand-mark" aria-label="What It Do home">
          <span className="brand-kicker">group decisions, but weird</span>
          <span className="brand-wordmark">WHAT IT <i>DO?</i></span>
        </Link>
        <span className="edition-sticker" aria-hidden="true">MIDNIGHT<br />EDITION</span>
      </header>

      {created ? (
        <section className="hero-grid success-grid" aria-labelledby="created-title">
          <div className="hero-copy">
            <p className="eyebrow">The council is summoned</p>
            <h1 id="created-title">Poll <span>alive.</span><br />Chaos pending.</h1>
            <p className="lede">Send the public ballot to your people. Keep the owner link private—it is the only key to the unfiltered results.</p>
            <button className="text-button" type="button" onClick={reset}>← Conjure another poll</button>
          </div>
          <div className="paper-stack">
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <article className="paper-card tape-top">
              <p className="card-label">SHARE THIS ONE</p>
              <h2>Public voting link</h2>
              <p className="muted">Safe to send around. It does not reveal names, comments, or results.</p>
              <output className="link-output">{created.voteUrl}</output>
              <div className="button-row">
                <button className="primary-button cyan" type="button" onClick={() => copyLink('vote', created.voteUrl)}>
                  {copied === 'vote' ? 'Copied! ✦' : 'Copy vote link'}
                </button>
                <a className="secondary-button" href={`sms:?body=${encodeURIComponent(`Cast your vote: ${created.title}\n${created.voteUrl}`)}`}>Text it</a>
              </div>
            </article>
            <article className="paper-card owner-card">
              <p className="card-label hot">EYES ONLY</p>
              <h2>Private owner link</h2>
              <p className="muted">Save this now. Anyone with this exact link can read every response.</p>
              <output className="link-output private-link">{created.resultsUrl}</output>
              <div className="button-row">
                <button className="primary-button pink" type="button" onClick={() => copyLink('results', created.resultsUrl)}>
                  {copied === 'results' ? 'Secret secured! ✦' : 'Copy private link'}
                </button>
                <Link className="secondary-button" href={created.resultsUrl} prefetch={false}>Open results</Link>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="hero-grid" aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">Schemes · dreams · questionable decisions</p>
            <h1 id="home-title">Stop circling.<br /><span>Pick a thing.</span></h1>
            <p className="lede">A tiny voting booth for big plans, bad ideas, and friends who refuse to answer the group chat.</p>
            <div className="scribble-note" aria-hidden="true">no logins<br />no lurking<br />just vote ↗</div>
          </div>

          <form className="paper-card creation-card tape-top" onSubmit={createPoll}>
            <fieldset className="mode-switch">
              <legend>Choose your energy</legend>
              <button type="button" className={mode === 'normal' ? 'active' : ''} aria-pressed={mode === 'normal'} onClick={() => setMode('normal')}>
                <span aria-hidden="true">☀</span> Classic
              </button>
              <button type="button" className={mode === 'dubious' ? 'active dubious' : ''} aria-pressed={mode === 'dubious'} onClick={() => setMode('dubious')}>
                <span aria-hidden="true">☾</span> Dubious
              </button>
            </fieldset>
            <p className="mode-caption">{mode === 'dubious' ? 'Unlocks the reckless-but-sincere YOLO vote.' : 'A respectable yes / maybe / no situation.'}</p>

            <label className="field-label" htmlFor="poll-title">Name the dilemma <span>optional</span></label>
            <input id="poll-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="Friday night: what are we doing?" />

            <fieldset className="options-fieldset">
              <legend>Possible moves <small>1–3 required</small></legend>
              {suggestions.map((suggestion, index) => (
                <label className="option-input" key={index} htmlFor={`suggestion-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <input id={`suggestion-${index}`} value={suggestion} maxLength={200} onChange={(event) => updateSuggestion(index, event.target.value)} placeholder={PLACEHOLDERS[mode][index]} />
                </label>
              ))}
            </fieldset>

            {error && <p className="notice notice-error" role="alert" aria-live="assertive">{error}</p>}
            <button className="primary-button jumbo" disabled={creating} type="submit">
              {creating ? 'Opening the portal…' : 'Make the poll'} <span aria-hidden="true">↗</span>
            </button>
            <p className="fine-print">Polls vanish after 30 idle days (90 days max). We keep no account or profile.</p>
          </form>
        </section>
      )}

      {!created && recent.length > 0 && (
        <section className="recent-section" aria-labelledby="recent-heading">
          <div>
            <p className="eyebrow">Your browser remembers</p>
            <h2 id="recent-heading">Recent private links</h2>
          </div>
          <ul className="recent-list">
            {recent.map((item) => (
              <li key={item.resultsUrl}>
                <Link href={item.resultsUrl} prefetch={false}>
                  <span>{item.title}</span>
                  <small>{new Date(item.createdAt).toLocaleDateString()} · open results ↗</small>
                </Link>
              </li>
            ))}
          </ul>
          <button className="text-button danger" type="button" onClick={clearRecent}>Clear private-link history</button>
        </section>
      )}
      <footer className="site-footer"><span>WHATITDO.EXE</span><span>Built for decisive-ish people.</span></footer>
    </main>
  )
}
