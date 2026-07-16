'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useEffect, useRef, useState } from 'react'
import type { NotificationStatus, PublicPoll, VoteOption } from '@/lib/types'
import { COMMENT_MAX, COUNTER_PROPOSAL_MAX, VOTER_NAME_MAX } from '@/lib/validation'

interface SuggestionVote {
  text: string
  vote: VoteOption | null
  comment: string
}

interface SubmissionPayload {
  pollId: string
  submissionId: string
  voterName: string
  votes: { text: string; vote: VoteOption; comment: string }[]
  counterProposal?: string
}

const VOTES: { value: VoteOption; label: string; symbol: string }[] = [
  { value: 'yes', label: 'Yes', symbol: '✓' },
  { value: 'maybe', label: 'Maybe', symbol: '~' },
  { value: 'no', label: 'Nope', symbol: '×' },
  { value: 'yolo', label: 'YOLO', symbol: '⚡' },
]

const MYSTERY_NAMES = ['A Midnight Caller', 'The Plot Twist', 'An Enigmatic Pal', 'Someone With Taste']

function statusCopy(status: NotificationStatus) {
  switch (status) {
    case 'sent': return 'Vote sealed. The email alert was accepted for delivery.'
    case 'not_configured': return 'Vote sealed. Email alerts are not configured, but your response is safe.'
    case 'failed': return 'Vote sealed. The email alert fizzled, but your response is safe.'
    case 'duplicate': return 'This exact vote was already sealed. Nothing was duplicated.'
  }
}

export default function VotePage() {
  const { id } = useParams<{ id: string }>()
  const [poll, setPoll] = useState<PublicPoll | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionVote[]>([])
  const [voterName, setVoterName] = useState('')
  const [counterProposal, setCounterProposal] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadState, setLoadState] = useState<'not-found' | 'retired' | 'error' | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [notification, setNotification] = useState<NotificationStatus | null>(null)
  const [receipt, setReceipt] = useState<SubmissionPayload | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const pendingSubmission = useRef<SubmissionPayload | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch(`/api/poll?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const body = (await response.json().catch(() => ({}))) as { poll?: PublicPoll }
        if (!active) return
        if (!response.ok || !body.poll) {
          setLoadState(response.status === 410 ? 'retired' : response.status === 404 ? 'not-found' : 'error')
          return
        }
        setPoll(body.poll)
        setSuggestions(body.poll.suggestions.map((text) => ({ text, vote: null, comment: '' })))
      } catch {
        if (active) setLoadState('error')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id, loadAttempt])

  function retryLoad() {
    setLoadState('')
    setLoading(true)
    setLoadAttempt((attempt) => attempt + 1)
  }

  function choose(index: number, vote: VoteOption) {
    setSuggestions((current) => current.map((item, i) => i === index ? { ...item, vote } : item))
    setSubmitError('')
  }

  function comment(index: number, value: string) {
    setSuggestions((current) => current.map((item, i) => i === index ? { ...item, comment: value } : item))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let payload = pendingSubmission.current
    if (!payload) {
      if (!suggestions.length || suggestions.some((item) => !item.vote)) {
        setSubmitError('Choose one response for every possibility.')
        return
      }
      const resolvedName = voterName.trim() || (poll?.mode === 'dubious'
        ? MYSTERY_NAMES[Math.floor(Math.random() * MYSTERY_NAMES.length)]
        : 'Anonymous')
      payload = {
        pollId: id,
        submissionId: crypto.randomUUID(),
        voterName: resolvedName,
        votes: suggestions.map((item) => ({ text: item.text, vote: item.vote as VoteOption, comment: item.comment.trim() })),
        ...(counterProposal.trim() ? { counterProposal: counterProposal.trim() } : {}),
      }
      pendingSubmission.current = payload
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await response.json().catch(() => ({}))) as { error?: string; notification?: NotificationStatus }
      if (!response.ok) {
        if (response.status === 410) setLoadState('retired')
        // A non-5xx response confirms that this request was not ambiguously
        // accepted, so the voter may correct it and create a fresh receipt.
        if (response.status < 500) pendingSubmission.current = null
        const fallback = response.status === 429
          ? 'Too many votes arrived at once. Wait a moment, then retry—your choices are still here.'
          : response.status === 410 ? 'This older poll has been retired.' : 'Your vote did not land. Try again.'
        throw new Error(body.error || fallback)
      }
      setReceipt(payload)
      setNotification(body.notification || 'failed')
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'Your vote did not land. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="site-shell center-stage"><div className="loading-card" role="status"><span className="spinner" aria-hidden="true" />Opening the ballot…</div></main>
  }

  if (loadState || !poll) {
    const retired = loadState === 'retired'
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card tape-top">
          <p className="card-label hot">{retired ? 'ARCHIVED' : loadState === 'error' ? 'SIGNAL LOST' : 'NOT FOUND'}</p>
          <h1>{retired ? 'This old poll has left the building.' : loadState === 'error' ? 'The ballot booth is offline.' : 'Nothing doing here.'}</h1>
          <p>{retired ? 'Legacy polls were retired to protect private responses. Ask the creator to make a fresh one.' : loadState === 'error' ? 'Try reloading in a moment.' : 'The link may be mistyped, expired, or already gone.'}</p>
          {loadState === 'error' && <button className="primary-button cyan" type="button" onClick={retryLoad}>Try the ballot again</button>}
          <Link className="primary-button pink" href="/">Make a fresh poll</Link>
        </section>
      </main>
    )
  }

  if (notification) {
    return (
      <main className="site-shell center-stage">
        <section className="paper-card state-card success-card tape-top">
          <div className="giant-stamp" aria-hidden="true">COUNTED</div>
          <p className="eyebrow">Democracy, approximately</p>
          <h1>Your vote is in.</h1>
          <p className="status-message" role="status">{statusCopy(notification)}</p>
          <div className="receipt">
            <p>{poll.title}</p>
            {(receipt?.votes ?? []).map((item, index) => <span key={item.text}><b>{String(index + 1).padStart(2, '0')}</b> {item.vote.toUpperCase()} — {item.text}</span>)}
          </div>
          <Link className="primary-button cyan" href="/">Start your own dilemma ↗</Link>
        </section>
      </main>
    )
  }

  const dubious = poll.mode === 'dubious'
  const complete = suggestions.length > 0 && suggestions.every((item) => item.vote)

  return (
    <main className="site-shell ballot-shell">
      <header className="compact-header">
        <Link href="/" className="mini-brand">WHAT IT <i>DO?</i></Link>
        <span>{dubious ? 'DUBIOUS BALLOT' : 'CLASSIC BALLOT'}</span>
      </header>
      <section className="ballot-intro">
        <p className="eyebrow">An important-ish decision awaits</p>
        <h1>{poll.title}</h1>
        <p>{dubious ? 'Answer honestly. Or dramatically. Ideally both.' : 'Mark every possibility, then seal your ballot.'}</p>
      </section>

      <form className="ballot-form" onSubmit={submit}>
        <section className="paper-card identity-card tape-top">
          <label className="field-label" htmlFor="voter-name">Your alias <span>optional</span></label>
          <input id="voter-name" value={voterName} maxLength={VOTER_NAME_MAX} onChange={(event) => setVoterName(event.target.value)} placeholder={dubious ? 'Leave blank for a mysterious alias' : 'Anonymous is allowed'} />
          <p className="fine-print">Your name and notes are visible only to the poll creator.</p>
        </section>

        <ol className="ballot-list">
          {suggestions.map((item, index) => (
            <li className="paper-card ballot-card" key={item.text}>
              <div className="ballot-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
              <fieldset>
                <legend>{item.text}</legend>
                <div className={`vote-grid ${dubious ? 'four' : ''}`}>
                  {VOTES.filter((choice) => choice.value !== 'yolo' || dubious).map((choice) => (
                    <button
                      type="button"
                      key={choice.value}
                      aria-pressed={item.vote === choice.value}
                      className={`vote-choice ${choice.value} ${item.vote === choice.value ? 'selected' : ''}`}
                      onClick={() => choose(index, choice.value)}
                    >
                      <span aria-hidden="true">{choice.symbol}</span>{choice.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="note-input" htmlFor={`comment-${index}`}>
                <span>Margin note <small>optional</small></span>
                <input id={`comment-${index}`} value={item.comment} maxLength={COMMENT_MAX} onChange={(event) => comment(index, event.target.value)} placeholder="Context, conditions, strong feelings…" />
              </label>
            </li>
          ))}
        </ol>

        <section className="paper-card counter-card">
          <label className="field-label" htmlFor="counter-proposal">Plot twist <span>optional</span></label>
          <p>None of these? Pitch one rogue alternative.</p>
          <textarea id="counter-proposal" value={counterProposal} maxLength={COUNTER_PROPOSAL_MAX} onChange={(event) => setCounterProposal(event.target.value)} rows={3} placeholder="Hear me out…" />
        </section>

        {submitError && <p className="notice notice-error" role="alert" aria-live="assertive">{submitError}</p>}
        <button className="primary-button jumbo seal-button" type="submit" disabled={submitting}>
          {submitting ? 'Sealing…' : complete ? 'Seal my ballot ↗' : `Choose ${suggestions.filter((item) => !item.vote).length} more`}
        </button>
      </form>
      <footer className="site-footer"><span>PRIVATE BY DESIGN</span><span>Only the poll owner sees details.</span></footer>
    </main>
  )
}
