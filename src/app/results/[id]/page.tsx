'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { availableVotes as getAvailableVotes, countVotes, summarizeVotes, VOTE_LABEL } from '@/lib/results'
import type { PollResults } from '@/lib/types'
import { billNumber, ChamberHeader, Chyron } from '../../chamber'

function boardErrorMessage(status: number, serverError?: string): string {
  if (status === 410) return 'This older bill was expunged to protect its members\u2019 votes.'
  if (status === 404) return 'That bill or that key is not on file with the Clerk.'
  if (status === 429) return 'The Chair does not recognize you right now. Too many refreshes. Give it a minute.'
  if (status >= 500) return 'The Clerk\u2019s office is not answering. The board will try again.'
  return serverError || 'The board did not come through. Try again.'
}

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
        setError('This link is missing its private key. Open the complete Clerk\u2019s key you saved when you introduced the bill.')
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
        const message = boardErrorMessage(response.status, body.error)
        throw new Error(message)
      }
      setPoll(body.poll)
      setLastUpdated(Date.now())
      setError('')
    } catch (caught) {
      if (controller.signal.aborted || tokenGeneration.current !== generation || activeRequest.current?.controller !== controller) return
      setError(caught instanceof Error ? caught.message : 'The board did not come through. Try again.')
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
    return <main className="site-shell center-stage"><div className="loading-card" role="status"><span className="spinner" aria-hidden="true" />The Clerk is unlocking the tally&hellip;</div></main>
  }

  if (!poll) {
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card">
          <p className="card-label hot">Sponsor&rsquo;s eyes only</p>
          <h1>{status === 410 ? 'Expunged from the record.' : status === 404 ? 'The Clerk does not recognize this key.' : 'The tally stayed sealed.'}</h1>
          <p className="notice notice-error" role="alert">{error}</p>
          {token && <button className="primary-button" type="button" onClick={() => load()}>Present the key again</button>}
          <Link className="text-button" href="/">&larr; Introduce a new bill</Link>
        </section>
      </main>
    )
  }

  const bill = billNumber(id)
  const sectionTotals = poll.suggestions.map((_, index) => summarizeVotes(countVotes(poll.responses, index), dubious))

  return (
    <main className="site-shell results-shell">
      <Chyron live={autoRefreshPaused ? 'PAUSED' : 'LIVE'} headline={`VOTE IN PROGRESS · ${bill} · ${responseCount} ${responseCount === 1 ? 'MEMBER HAS' : 'MEMBERS HAVE'} VOTED`} />
      <ChamberHeader right={<span className="private-badge">Sponsor&rsquo;s copy<br />Do not forward</span>} />

      <section className="results-masthead">
        <div>
          <p className="eyebrow">{bill} · The Clerk&rsquo;s tally</p>
          <h1>{poll.title}</h1>
        </div>
        <div className="response-counter" aria-label={`${responseCount} ${responseCount === 1 ? 'response' : 'responses'}`}>
          <b>{String(responseCount).padStart(2, '0')}</b>
          <span>{responseCount === 1 ? 'member voted' : 'members voted'}</span>
        </div>
      </section>

      {error && <div className="notice notice-error results-error" role="alert"><span>{error}</span><button type="button" onClick={() => load(true)}>Retry</button></div>}

      <section className="vote-board" aria-labelledby="tally-heading">
        <div className="section-heading">
          <div>
            <p className="board-label">Electronic vote board</p>
            <h2 id="tally-heading">The honest tally</h2>
            <p className="last-updated">
              {lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for the latest tally…'}
            </p>
          </div>
          <div className="board-controls">
            <button
              className="refresh-button"
              type="button"
              aria-label="Auto-refresh"
              aria-pressed={!autoRefreshPaused}
              onClick={() => setAutoRefreshPaused((paused) => !paused)}
            >
              {autoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
            </button>
            <button className="refresh-button" type="button" disabled={refreshing} onClick={() => load(true)}>{refreshing ? 'Refreshing…' : 'Refresh now ↻'}</button>
          </div>
        </div>
        <div className="tally-grid">
          {poll.suggestions.map((suggestion, index) => {
            const counts = countVotes(poll.responses, index)
            const summary = sectionTotals[index]
            return (
              <article className="tally-card" key={suggestion}>
                <div className="tally-title"><span>SEC. {index + 1}</span><h3>{suggestion}</h3></div>
                <p className={`verdict ${summary.leaders.length === 1 ? summary.leaders[0] : 'none'}`}>{summary.verdict}</p>
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

        {poll.responses.length > 0 && (
          <section className="member-wall" aria-label="Members, as recorded">
            <p className="board-label">Members, as recorded</p>
            <table>
              <caption className="sr-only">How each member voted on each section</caption>
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  {poll.suggestions.map((suggestion, index) => <th scope="col" key={suggestion} title={suggestion}>Sec. {index + 1}</th>)}
                </tr>
              </thead>
              <tbody>
                {poll.responses.map((response, responseIndex) => (
                  <tr key={`${response.submittedAt}-${responseIndex}`}>
                    <th scope="row">{response.voterName}</th>
                    {response.votes.map((vote, voteIndex) => (
                      <td key={`${vote.text}-${voteIndex}`}><span className={`wall-lamp ${vote.vote}`}>{VOTE_LABEL[vote.vote]}</span></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <p className="fine-print">Percentages are per section. Equal totals are shown as ties. The board never invents a winner.</p>
      </section>

      {poll.responses.some((response) => response.counterProposal) && (
        <section className="wildcards" aria-labelledby="wildcards-heading">
          <div className="section-heading"><div><p className="eyebrow">Proposed from the floor</p><h2 id="wildcards-heading">Amendments</h2></div></div>
          <ul>
            {poll.responses.filter((response) => response.counterProposal).map((response, index) => (
              <li className="paper-card amendment" key={`${response.submittedAt}-${index}`}>
                <span className="amendment-no">Amdt. {index + 1}</span>
                <p className="amendment-lead">Offered by {response.voterName}:</p>
                <blockquote>Strike all sections and insert: &ldquo;{response.counterProposal}&rdquo;</blockquote>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="responses-section" aria-labelledby="responses-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Proceedings and debates of the group chat</p><h2 id="responses-heading">The Record</h2></div>
        </div>
        {poll.responses.length ? (
          <ol className="record">
            {poll.responses.map((response, responseIndex) => (
              <li className="record-entry" key={`${response.submittedAt}-${responseIndex}`}>
                <header>
                  <span>Vote {String(responseIndex + 1).padStart(2, '0')}</span>
                  <h3>{response.voterName}</h3>
                  <time dateTime={new Date(response.submittedAt).toISOString()}>{new Date(response.submittedAt).toLocaleString()}</time>
                </header>
                <ul>
                  {response.votes.map((vote, voteIndex) => (
                    <li key={`${vote.text}-${voteIndex}`}>
                      <span className={`vote-stamp ${vote.vote}`}>{VOTE_LABEL[vote.vote]}</span>
                      <div>
                        <p>on Sec. {voteIndex + 1}, {vote.text}{/[.!?]$/.test(vote.text) ? '' : '.'}</p>
                        {vote.comment && <blockquote><i>And asked that the following be entered into the Record:</i> &ldquo;{vote.comment}&rdquo;</blockquote>}
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <div className="paper-card empty-state"><span aria-hidden="true">&sect;</span><h3>The chamber is dramatically empty.</h3><p>Nobody has voted yet. Text the floor pass to the group chat and whip some votes.</p></div>
        )}
      </section>
      <footer className="site-footer"><span>{autoRefreshPaused ? 'BOARD PAUSED' : 'BOARD REFRESHES EVERY 30 SEC'}</span><Link href="/">Introduce another bill &rarr;</Link></footer>
    </main>
  )
}
