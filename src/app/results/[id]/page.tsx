'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { availableVotes as getAvailableVotes, countVotes, summarizeVotes, VOTE_LABEL } from '@/lib/results'
import type { PollResults } from '@/lib/types'

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [token, setToken] = useState('')
  const [poll, setPoll] = useState<PollResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false)
  const tokenGeneration = useRef(0)
  const activeRequest = useRef<{ generation: number; controller: AbortController } | null>(null)

  useEffect(() => {
    const syncTokenFromFragment = () => {
      tokenGeneration.current += 1
      activeRequest.current?.controller.abort()
      activeRequest.current = null
      const fragment = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
      setToken(fragment)
      setPoll(null)
      setStatus(null)
      setLastUpdated(null)
      if (!fragment) {
        setError('This owner link is missing its private key. Open the complete link you saved when creating the poll.')
        setLoading(false)
      } else {
        setError('')
        setLoading(true)
      }
    }
    const tokenTimer = window.setTimeout(syncTokenFromFragment, 0)
    window.addEventListener('hashchange', syncTokenFromFragment)
    return () => {
      window.clearTimeout(tokenTimer)
      window.removeEventListener('hashchange', syncTokenFromFragment)
    }
  }, [id])

  useEffect(() => () => {
    activeRequest.current?.controller.abort()
  }, [])

  const load = useCallback(async (quiet = false) => {
    if (!token) return
    const generation = tokenGeneration.current
    const controller = new AbortController()
    activeRequest.current?.controller.abort()
    activeRequest.current = { generation, controller }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    setStatus(null)
    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({ pollId: id, resultsToken: token }),
      })
      const body = (await response.json().catch(() => ({}))) as { poll?: PollResults; error?: string }
      if (controller.signal.aborted || tokenGeneration.current !== generation || activeRequest.current?.controller !== controller) return
      if (!response.ok || !body.poll) {
        setStatus(response.status)
        const message = response.status === 410
          ? 'This legacy poll was retired to protect its responses.'
          : response.status === 404 ? 'That poll or private key could not be found.'
          : response.status === 429 ? 'Too many refreshes. Give it a minute, then retry.'
          : body.error || 'Results did not arrive. Try again.'
        throw new Error(message)
      }
      setPoll(body.poll)
      setLastUpdated(Date.now())
      setError('')
    } catch (caught) {
      if (controller.signal.aborted || tokenGeneration.current !== generation || activeRequest.current?.controller !== controller) return
      setError(caught instanceof Error ? caught.message : 'Results did not arrive. Try again.')
    } finally {
      if (tokenGeneration.current === generation && activeRequest.current?.controller === controller) {
        activeRequest.current = null
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [id, token])

  useEffect(() => {
    if (!token) return
    const initialLoad = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(initialLoad)
  }, [load, token])

  useEffect(() => {
    if (!token || autoRefreshPaused) return
    let interval: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (!interval && document.visibilityState === 'visible') interval = setInterval(() => load(true), 30000)
    }
    const visibility = () => {
      if (document.visibilityState === 'hidden') {
        if (interval) clearInterval(interval)
        interval = null
      } else {
        load(true)
        start()
      }
    }
    start()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [autoRefreshPaused, load, token])

  const responseCount = poll?.responses.length ?? 0
  const dubious = poll?.mode === 'dubious'
  const availableVotes = getAvailableVotes(dubious)

  if (loading && !poll) {
    return <main className="site-shell center-stage"><div className="loading-card" role="status"><span className="spinner" aria-hidden="true" />Unlocking private results…</div></main>
  }

  if (!poll) {
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card tape-top">
          <p className="card-label hot">PRIVATE ARCHIVE</p>
          <h1>{status === 410 ? 'This archive is retired.' : status === 404 ? 'Key not accepted.' : 'The archive stayed shut.'}</h1>
          <p className="notice notice-error" role="alert">{error}</p>
          {token && <button className="primary-button cyan" type="button" onClick={() => load()}>Try the key again</button>}
          <Link className="text-button" href="/">← Make a new poll</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="site-shell results-shell">
      <header className="compact-header">
        <Link href="/" className="mini-brand">WHAT IT <i>DO?</i></Link>
        <span className="private-badge">PRIVATE RESULTS</span>
      </header>

      <section className="results-masthead">
        <div>
          <p className="eyebrow">The group has spoken-ish</p>
          <h1>{poll.title}</h1>
        </div>
        <div className="response-counter" aria-label={`${responseCount} ${responseCount === 1 ? 'response' : 'responses'}`}>
          <b>{String(responseCount).padStart(2, '0')}</b>
          <span>{responseCount === 1 ? 'response' : 'responses'}</span>
        </div>
      </section>

      {error && <div className="notice notice-error results-error" role="alert"><span>{error}</span><button type="button" onClick={() => load(true)}>Retry</button></div>}

      <section className="paper-card tally-board tape-top" aria-labelledby="tally-heading">
        <div className="section-heading">
          <div>
            <p className="card-label">LIVE VIBE METER</p>
            <h2 id="tally-heading">The honest tally</h2>
            <p className="last-updated">
              {lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for the latest tally…'}
            </p>
          </div>
          <div>
            <button className="refresh-button" type="button" aria-pressed={autoRefreshPaused} onClick={() => setAutoRefreshPaused((paused) => !paused)}>
              {autoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
            </button>
            <button className="refresh-button" type="button" disabled={refreshing} onClick={() => load(true)}>{refreshing ? 'Refreshing…' : 'Refresh now ↻'}</button>
          </div>
        </div>
        <div className="tally-grid">
          {poll.suggestions.map((suggestion, index) => {
            const counts = countVotes(poll.responses, index)
            const summary = summarizeVotes(counts, dubious)
            return (
              <article className="tally-card" key={suggestion}>
                <div className="tally-title"><span>{String(index + 1).padStart(2, '0')}</span><h3>{suggestion}</h3></div>
                <p className="verdict">{summary.verdict}</p>
                <div className="bars">
                  {availableVotes.map((vote) => {
                    const percentage = summary.percentages[vote]
                    return (
                      <div className={`bar-row ${vote}`} key={vote}>
                        <span>{VOTE_LABEL[vote]}</span>
                        <div className="bar-track" aria-hidden="true"><i style={{ width: `${percentage}%` }} /></div>
                        <output>{counts[vote]} · {Math.round(percentage)}%</output>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
        <p className="fine-print">Percentages are calculated per possibility. Equal totals are shown as ties—not fake winners.</p>
      </section>

      {poll.responses.some((response) => response.counterProposal) && (
        <section className="wildcards" aria-labelledby="wildcards-heading">
          <div className="section-heading"><div><p className="eyebrow">Plot twists</p><h2 id="wildcards-heading">Rogue alternatives</h2></div></div>
          <ul>
            {poll.responses.filter((response) => response.counterProposal).map((response, index) => (
              <li className="paper-card" key={`${response.submittedAt}-${index}`}><span aria-hidden="true">↝</span><blockquote>{response.counterProposal}</blockquote><cite>— {response.voterName}</cite></li>
            ))}
          </ul>
        </section>
      )}

      <section className="responses-section" aria-labelledby="responses-heading">
        <div className="section-heading">
          <div><p className="eyebrow">No podium, just receipts</p><h2 id="responses-heading">Individual ballots</h2></div>
        </div>
        {poll.responses.length ? (
          <ol className="response-list">
            {poll.responses.map((response, responseIndex) => (
              <li className="paper-card response-card" key={`${response.submittedAt}-${responseIndex}`}>
                <header><div><span>RESPONSE {String(responseIndex + 1).padStart(2, '0')}</span><h3>{response.voterName}</h3></div><time dateTime={new Date(response.submittedAt).toISOString()}>{new Date(response.submittedAt).toLocaleString()}</time></header>
                <ul>
                  {response.votes.map((vote, voteIndex) => (
                    <li key={`${vote.text}-${voteIndex}`}><span className={`vote-stamp ${vote.vote}`}>{VOTE_LABEL[vote.vote]}</span><div><p>{vote.text}</p>{vote.comment && <blockquote>“{vote.comment}”</blockquote>}</div></li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <div className="paper-card empty-state"><span aria-hidden="true">…</span><h3>The room is dramatically silent.</h3><p>Share the public voting link to collect the first response.</p></div>
        )}
      </section>
      <footer className="site-footer"><span>{autoRefreshPaused ? 'AUTO-REFRESH PAUSED' : 'AUTO-REFRESH · 30 SEC'}</span><Link href="/">Create another poll ↗</Link></footer>
    </main>
  )
}
